# Exercise 2 - SQL Injection
Vulnerability: [A03:2025-Injection](https://owasp.org/Top10/2025/A05_2025-Injection/)

## Table of Contents
- [📖 1. Overview](./README.md#--1-overview-)
- [🚨 2. Vulnerable Code](./README.md#-2-vulnerable-code)
- [💥 3. Exploitation](./README.md#-3-exploitation)
- [🛡️ 4. Remediation](./README.md#%EF%B8%8F-4-remediation)
- [✅ 5. Verification](./README.md#-5-verification)
- [📌 6. Summary](./README.md#-6-summary)

## 📖  1. Overview

This exercise demonstrates how unsanitized user inputs can be exploited to perform SQL Injection attacks, thereby compromising the integrity and confidentiality of enterprise data. In the incident management application that you already know from the previous exercises, input fields - such as those accepting the customer ID - are vulnerable if not properly validated. As a result, attackers might inject malicious SQL code to retrieve, alter, or delete sensitive records without detection.
In this exercise you will test the application locally in the development environment. Instead of building and deploying the application to SAP BTP, you will use `cds watch` to launch a local server.

### 📐Business Rules

  - ❌ Users must not exploit insecure input fields to inject or modify SQL queries.
  - ⚠️ All user input must be rigorously validated and sanitized to prevent SQL Injection.

### ⚠️ Why This Matters

 * **Business Impact:** Successful SQL Injection attacks can compromise the integrity and confidentiality of critical data, leading to unauthorized data disclosure, manipulation, or deletion.
 * **Compliance Risk:** Violates [A05:2025 Injection](https://owasp.org/Top10/2025/A05_2025-Injection/) and GDPR/PCI DSS requirements for input validation.
 * **Security Risk:** Malicious actors could exfiltrate sensitive data (e.g., credit card numbers) or bypass authorization controls.

### 🎯 Key Learning Objectives

- Understand how SQL Injection works and how unsafe handling of input can be exploited.
- Learn to use CAP’s safe query APIs (parameterized queries) to prevent SQL Injection.
- Test the remediation to confirm that malicious input is neutralized while legitimate application functionality remains intact.

## 🚨 2. Vulnerable Code
We’ll build upon [Exercise 1.2 - Vertical Privilege Escalation](../ex1/ex1.2/README.md)  by introducing an SQL Injection vulnerability resulting from unsanitized user input.

### What We're Adding

1. **CDS Service Definition (srv/services.cds):** A new **fetchCustomer** function in AdminService that accepts unvalidated input
2. **Vulnerable Implementation (srv/services.js):** Raw SQL query with direct string insertion

**Updated File:** srv/services.cds
- The updated **services.cds** file now includes a new function called **fetchCustomer** in the AdminService. This function is intentionally designed to be vulnerable to SQL Injection for demonstration purposes.

- Copy the contents of [services.cds](./srv/services.cds) into your project’s **srv/services.cds** file.
- Ensure the following corrected code is included in the file:

```
... Other methods

annotate ProcessorService.Incidents with @odata.draft.enabled; 
annotate ProcessorService with @(requires: ['support', 'admin']);  // ✅ NEW: Allow both roles support and admin at service level.

/**
 * Service used by administrators to manage customers and incidents.
 */
service AdminService {
  @restrict: { grant: '*', to: 'admin' }
  @odata
  
  entity Customers as projection on my.Customers;
  entity Incidents as projection on my.Incidents;

  // ✅ Add Custom Vulnerable Operation fetchCustomer to AdminService
  // ✅ Exposed via HTTP GET  {{server}}/odata/v4/admin/fetchCustomer with JSON body

  @tags: ['security', 'vulnerable']
  @summary: 'Returns customer data using various query construction methods (for security testing only)'
  
function fetchCustomer(
    customerID: String,
    /*
     * Query construction method:
     * 
     *   concat  → ❌ VULNERABLE: String interpolation
     *             `SELECT ... WHERE ID = '${customerID}'`
     *             Payload ' OR '1'='1 → returns all records!
     * 
     *   tagged  → ❌ VULNERABLE: Parenthesized template literal
     *             sql(`...${customerID}...`) evaluates before tag function
     *             Same injection risk as concat
     * 
     *   safe    → ✅ SECURE: Parameterized query
     *             SELECT.from('Customers').where({ID: customerID})
     *             Input automatically sanitized
     */
    method: String
  ) returns array of Customers;
}

annotate AdminService with @(requires: 'admin');

```

**Updated File:** srv/services.js
- The updated **services.js** file now includes a new function handler for **fetchCustomer** in the AdminService class.
- Copy the contents of [services_vulnerable.js](./srv/services_vulnerable.js) into your project’s **srv/services.js** file.
- Ensure the following corrected code is included in the file:

```
const cds = require('@sap/cds');

... Other methods

// AdminService Implementation
class AdminService extends cds.ApplicationService {
init() {
    /**
     * Event handler for the 'fetchCustomer' operation
     * This method demonstrates different approaches to constructing SQL queries
     * and handling the results.
     *
     * @param {Object} req - The request object containing customerID and method
     */
    this.on('fetchCustomer', async (req) => {
      // Extract customerID and method from the request data
      // Default to 'concat' method if not specified
      const { customerID, method = 'safe' } = req.data;

      /**
       * ❌ VULNERABILITY 1: Direct String concatenation method
       * This method directly interpolates user input into the SQL query,
       * creating a significant SQL injection vulnerability.
       */
      if (method === 'concat') {
        console.log('⚠️ Using INSECURE string concatenation method.');
        // ❌ CRITICAL: User input is directly embedded in SQL query
        // This allows for SQL injection attacks
        const query = `SELECT * FROM sap_capire_incidents_Customers WHERE ID = '${customerID}'`;

        try {
          // Execute the vulnerable query
          return await cds.run(query);
        } catch (error) {
          // Log the error and reject the request
          cds.log('security').error(`SQL error: ${error.message.substring(0, 100)}`);
          return req.reject(400, 'Invalid customer identifier');
        }
      }

      /**
       ❌ VULNERABILITY 2: Parenthesized tagged template method
       * This method is vulnerable because parentheses cause immediate evaluation
       * of the template, similar to string concatenation.
       */
      if (method === 'tagged') {
        console.log('⚠️ Using INSECURE parenthesized tagged template method.');

        /**
         * Tagged template function for SQL query construction
         * This function is designed to prevent SQL injection, but parentheses
         * cause immediate evaluation, defeating its purpose.
         *
         * @param {Array<string>} strings - Array of string literals from the template
         * @param {...any} values - Array of values to be substituted into the template
         * @returns {string} The constructed SQL query
         */
        const sql = (strings, ...values) => {
          console.log('Received strings:', strings);
          console.log('Received values:', values);

          // ❌ DETECT: Parentheses used - strings is already a plain string!
          // This indicates that the template was evaluated before reaching this function
          if (typeof strings === 'string') {
            console.log('❌ PARENTHESES DETECTED: strings is plain string, not array!');
            // ❌ CRITICAL: Returning the already-interpolated string directly
            // This makes the query vulnerable to SQL injection
            return strings;
          }
        };

        // ❌ CRITICAL: PARENTHESES cause immediate evaluation!
        // The template is evaluated before reaching the sql function
        // This creates a vulnerable query string
        const vulnerableQuery =
          sql(`SELECT * FROM sap_capire_incidents_Customers WHERE ID = '${customerID}'`);

        console.log('❌ Vulnerable query constructed:', vulnerableQuery);

        try {
          // Execute the vulnerable query
          const results = await cds.run(vulnerableQuery);
          console.log('✅ Results count:', results.length);
          return results;
        } catch (error) {
          console.error('❌ Error:', error.message);
          // Log the error and reject the request
          cds.log('security').error(`SQL error: ${error.message.substring(0, 100)}`);
          return req.error(400, 'Invalid customer identifier');
        }
      }

      /**
       * ✅ SECURE: Parameterized query method
       * This method uses CAP's fluent API to create a parameterized query
       * which automatically sanitizes user input and prevents SQL injection.
       */
      if (method === 'safe') {
        console.log('✅ Using SECURE parameterized query method.');

        try {
          // ✅ SECURE: Parameterized query using CAP's fluent API
          // This approach automatically sanitizes input and prevents SQL injection
          // Use the CDS entity name, not the DB table name/full path
          const query = SELECT.from('Customers').where({ ID: customerID });
          const results = await cds.run(query);
          return results;
        } catch (error) {
          // Log the error and reject the request
          cds.log('security').error(`SQL error: ${error.message.substring(0, 100)}`);
          return req.error(400, 'Invalid customer identifier');
        }
      }

      // Handle unknown methods
      // If an unknown method is provided, return an error
      return req.error(400, `Unknown method: ${method}`);
    });
  }
}
// Export both services
module.exports = {ProcessorService, AdminService};
```

**Why this is vulnerable:**

- ❌ **Direct String concatenation method:** The user-supplied customerID is concatenated directly into the SQL query without validation, making it possible for an attacker to inject malicious SQL code.
- ❌ **Parenthesized tagged template method:** This approach is also vulnerable because parentheses force immediate evaluation of the template literal into a raw string before it reaches the tag/SQL builder—effectively making it behave like string concatenation and enabling injection.

## 💥 3. Exploitation

We will exploit the SQL Injection vulnerability in a local development environment (SAP Business Application Studio with cds watch). Unlike production, key security measures such as real authentication flows, OAuth2 tokens, and data isolation are inactive, allowing ethical hackers to safely simulate attacks, validate vulnerabilities without risking live systems, and rapidly iterate fixes before deploying to production.

### 🪜 Step 1: Review the Test File for the HTTP Endpoint
- ▶️ Action:
  - Navigate to the `test/http` directory in your CAP project folder.
  - Open the file "sql-injection-demo.http".
  
```
@server = http://localhost:4004
@username = incident.support@tester.sap.com
@password = initial

### 🔒 SQL INJECTION DEMO (matches your current services.js)
# =====================================================
# Methods implemented in services.js:
#   - concat  → ❌ vulnerable: interpolates customerID into SQL string
#   - tagged  → ❌ vulnerable: (parenthesized tagged template) helper returns raw SQL string (still injectable)
#   - safe    → ✅ SECURE: parameterized query (WHERE ID = ?) + [customerID]
# =====================================================

### ============================================
### PART A — VULNERABLE (method=concat)
### ============================================

### ✅ Test A1: Legitimate Request (concat) → expect 1 row
GET {{server}}/odata/v4/admin/fetchCustomer
Content-Type: application/json
Authorization: Basic {{username}}:{{password}}

{
  "customerID": "1004100",
  "method": "concat"
}
... other methods

``` 
This file contains multiple HTTP requests grouped into three logical test categories (across three query methods):
  - **Test 1:** A legitimate request to retrieve a specific customer.
  Sends a normal customerID (1004100) using each method (concat, tagged, and safe) to verify expected behavior (one matching row returned).

  - **Test 2:** A malicious request that demonstrates a SQL Injection vulnerability.
  Uses a true-clause payload ("1004100' OR '1'='1") to show that the insecure methods (concat and tagged) may return many or all rows, while the safe method treats it as literal input.

  - **Test 3:** A SQL Injection using multiple SQL statements.
  Attempts a multi-statement payload ("1004100'; DELETE FROM ...;--") to demonstrate how insecure query could allow destructive behavior, while the safe method neutralizes the input through parameterization.

### 🪜 Step 2: Exploit the SQL Injection Vulnerability
- ▶️ Action:
  - Go to the integrated terminal. If you no longer have it open, right-click in the Explorer Pane on the project name to open the context menu. Then select the menu item "Open in Integrated Terminal".
  - Ensure you are in the **secure-incident-management** directory
  - Run the following commands from the integrated terminal:

```
  cds build
  cds deploy
  cds watch
```
- ▶️ Action:
  - Open the `sql-injection-demo.http` file in your editor.
  - Confirm in your `package.json` file that the user `incident.support@tester.sap.com` is assigned the `admin` role under the `cds.requires.[development].auth.users` configuration.
  - In `sql-injection-demo.http`, navigate to Test 2 to look up customer information and click on Send Request (added by the editor in the line above the GET statement).
  
``` 
  ### 🚨 Test A2: True-clause injection (concat)
  ### Action: Inject malicious payload ' OR '1'='1 (always true)
  ### Expected: Returns ALL customer records
  ### Result: Full database exposure vulnerability
  GET {{server}}/odata/v4/admin/fetchCustomer
  Content-Type: application/json
  Authorization: Basic {{username}}:{{password}}
  {
    "customerID": "1004100' OR '1'='1"
  }
```
- ✅ Result:

```
[odata] - GET /odata/v4/admin/fetchCustomer  
⚠️ Using INSECURE string concatenation method.
❌ Vulnerable query constructed: SELECT * FROM sap_capire_incidents_Customers WHERE ID = '1004100' OR '1'='1'
✅ Results count: 3
``` 

✅ Exploitation successful: The application returned the entire contents of the Customers table instead of just the record for customer ID 1004100.

- ▶️ Action: In `sql-injection-demo.http`, navigate to Test B2 to look up customer information and click on Send Request.

``` 
  ### 🚨 Test B2: True-clause injection (tagged) → may return many/all rows
  ### Action: Inject malicious payload ' OR '1'='1 (always true)
  ### Expected: Returns ALL customer records
  ### Result: Full database exposure vulnerability
  GET {{server}}/odata/v4/admin/fetchCustomer
  Content-Type: application/json
  Authorization: Basic {{username}}:{{password}}
  {
    "customerID": "1004100' OR '1'='1"
  }
```
- Result:

``` 
[odata] - GET /odata/v4/admin/fetchCustomer 
⚠️ Using INSECURE parenthesized tagged template method.
❌ PARENTHESES DETECTED: strings is plain string, not array!
❌ Vulnerable query constructed: SELECT * FROM sap_capire_incidents_Customers WHERE ID = '1004100' OR '1'='1'
✅ Results count: 3

``` 
✅ Exploitation successful: 
  - Same vulnerability as concat method: ALL customer records returned.
  - Parentheses cause immediate template evaluation, defeating the intended parameterization protection.
   
### 📌Critical Vulnerability Summary
- ❌ **Complete Data Breach:** Any authenticated user can extract the entire contents of the customer table.
- ❌ **Insecure SQL Concatenation & Parenthesized Tagged :** The services.js code uses direct string concatenation ('${customerID}') to build an SQL query instead of using parameterized queries.
- ❌ **Lack of Input Sanitization:** No validation or sanitization is performed on the customerID input parameter before it is used in the SQL query.

## 🛡️ 4. Remediation
Now that you've identified the SQL Injection vulnerability, let's fix it by implementing secure database queries using CAP's built-in protections.
- Open the contents of [services.js](./srv/services.js) into your project’s srv/services.js file.
- Ensure the following corrected code is included in the file:

```
      /**
       * SECURE: Parameterized query method
       * This method uses CAP's fluent API to create a parameterized query
       * which automatically sanitizes user input and prevents SQL injection.
       */
      if (method === 'safe') {
        console.log('✅ Using SECURE parameterized query method.');

        try {
          // ✅ SECURE: Parameterized query using CAP's fluent API
          // This approach automatically sanitizes input and prevents SQL injection
          const query = SELECT.from('Customers').where({ ID: customerID });
          const results = await cds.run(query);
          return results;
        } catch (error) {
          // Log the error and reject the request
          cds.log('security').error(`SQL error: ${error.message.substring(0, 100)}`);
          return req.error(400, 'Invalid customer identifier');
        }
      }
```
- The updated services.js now includes a secure version of the **fetchCustomer** function. 

### Key Changes:
  - ✅ Replaced raw SQL string concatenation with CAP’s SELECT.from().where() syntax.
  - ✅ Input is automatically parameterized and sanitized by the framework.
  - ✅ Eliminates the risk of SQL Injection.

## ✅ 5. Verification
This section outlines the steps to confirm that the remediation for the SQL Injection vulnerability has been successfully implemented. The goal is to verify that:

- Malicious SQL Injection payloads are neutralized and no longer return unauthorized data.
- Legitimate requests continue to function correctly and return expected results.
- The application now correctly uses parameterized queries, preventing any manipulation of the query structure.

### 🪜 Step 1: Test C1: Legitimate Request (safe) → expect 1 row
- ▶️ Action:
 💡**Note:** Ensure the deployment includes the updated [services.js](./srv/services.js) file with the secure parameterized query implementation.
- Open the sql-injection-demo.http file.
- Execute the **✅ Test C1:** by clicking on "Send Request" below line 71:

```
GET {{server}}/odata/v4/admin/fetchCustomer
Content-Type: application/json
Authorization: Basic {{username}}:{{password}}

{
  "customerID": "1004100",
  "method": "safe"
}
```
- ✅ Result:
  - The system returns a single customer record for ID = 1004100.
  - This confirms that legitimate functionality remains intact after the fix.


### 🪜 Step 2: Test C2: Injection attempt (safe) → expect 0 rows (treated as literal parameter)
- ▶️ Action:
  - Execute the **✅ Test C2:** by clicking on "Send Request" below line 81:
```
GET {{server}}/odata/v4/admin/fetchCustomer
Content-Type: application/json
Authorization: Basic {{username}}:{{password}}

{
  "customerID": "1004100' OR '1'='1",
  "method": "safe"
}
[
```
- Result:
```
  HTTP/1.1 200 OK  
  X-Powered-By: Express  
  X-Correlation-ID: 5dea2017-7c3a-46cd-9e45-0b119edce4ff  
  OData-Version: 4.0  
  Content-Type: application/json; charset=utf-8  
  Content-Length: 51  
  Date: Sun, 28 Sep 2025 19:45:56 GMT  
  Connection: close  
  
  {
    "@odata.context": "$metadata#Customers",
    "value": []
  }
```
- ✅ Empty array [] returned.
- ✅ The malicious payload ' OR '1'='1 is treated as a literal string value rather than executable SQL.
- ✅ This confirms that the SQL Injection vulnerability has been successfully mitigated.

### 🪜 Step 3: Test C3: Multi-statement attempt (safe) → expect 0 rows (treated as literal parameter)
- ▶️ Action: Execute the **Test C3** by clicking on "Send Request" above line 42:

```
  GET  {{server}}/odata/v4/admin/fetchCustomer
  Content-Type: application/json
  Authorization: Basic {{username}}:{{password}}

  {
     "customerID": "1004100'; SELECT * from sap_capire_incidents_Customers;-- "
  }
```
- ✅ Result:
  - All malicious payloads fail to return unintended data or alter query behavior.
  - The application either returns no results or a validation error, confirming comprehensive protection.

### 📌 Verification Summary
The remediation successfully addresses the SQL Injection vulnerability by:
- **Eliminating String Concatenation:** Replaced unsafe SQL string building with CAP’s parameterized query API (SELECT.from().where({...})).
- **Neutralizing Malicious Inputs:** Attack payloads (e.g., ' OR '1'='1) are treated as data values, not executable code.
- **Preserving Legitimate Functionality:** Valid requests continue to work as expected without disruption.
- **Leveraging Framework Security:** CAP’s built-in query translation to CQN (Core Query Language) and parameter binding prevent SQL Injection at runtime.

## 📌 6. Summary

### 🔑 Key Take‑Aways (SAP CAP Recommendations)
Whenever there’s user input involved:
  - 1. **Never use string concatenation when constructing queries!** Use parameterized APIs (e.g., CAP’s SELECT.from().where()) to ensure user input is treated as data, not executable code.
  - 2. **Never surround tagged template strings with parentheses!** The parentheses `(${userInput})` force JavaScript to evaluate the template literal as a raw string before it reaches the SQL parser.
  - 3. **Always Use CAP's parameterized query APIs exclusively**-  SAP CAP includes built-in SQL injection protection by using parameterized queries, which keep the SQL statement structure separate from user-supplied data at the database driver level. As a result, CAP’s query APIs are designed to be SQL-injection safe by default when used instead of dynamically constructed SQL strings.

- In this exercise, you have learned how to:
  
  - **Identify SQL Injection Vulnerabilities:** Recognize unsafe patterns like direct string interpolation in queries.
  - **Implement Parameterized Queries:** Use CAP’s API `SELECT.from().where()` to securely handle user input.
  - **Test Remediation:** Verify the fix via the HTTP endpoint by testing that valid inputs succeed and SQL Injection attempts are blocked.

- 🎉 **Congratulations!**
    You have successfully remediated the critical [A05:2025 Injection](https://owasp.org/Top10/2025/A05_2025-Injection/) vulnerability and fortified your application against one of the most critical security risks. Your application now follows secure coding best practices that prevent attacker-controlled input from compromising your database. 

👉 Next up: [Exercise 3 - Security Logging and Monitoring Failures](../ex3/README.md), where we address the critical [A09:2025 Security Logging & Alerting Failures](https://owasp.org/Top10/2025/A09_2025-Security_Logging_and_Alerting_Failures/) risks by implementing CAP's audit logging framework to detect unauthorized data access, track sensitive information flow, and ensure regulatory compliance through comprehensive security monitoring in enterprise environments.


