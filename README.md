# Developping More-Secure Solutions With SAP BTP: Proven Techniques For The Real World
<!--- Register repository https://api.reuse.software/register, then add REUSE badge:
[![REUSE status](https://api.reuse.software/badge/github.com/SAP-samples/REPO-NAME)](https://api.reuse.software/info/github.com/SAP-samples/REPO-NAME)
-->
## 📝Description

This repository contains the material for the workshop called "Developping More-Secure Solutions With SAP BTP: Proven Techniques For The Real World".  

## 🔎 Overview

Welcome to this hands-on workshop dedicated to embedding security into your SAP BTP applications. 
In an era where data breaches and cyber threats are constant, building secure software is not an option - it's a requirement. This workshop is designed for developers working with the SAP Cloud Application Programming Model (CAP) and Node.js. 

By completing the exercises, you will gain the practical skills to identify and mitigate common security risks as defined by the [OWASP Top 10 Vulnerabilities](https://owasp.org/Top10/). 

<p align="center">
  <img src="img/top10-owasp.png" alt="Top 10 OWASP Vulnerabilities" width="900"/>
  <br>
  <b>Top 10 OWASP Vulnerabilities</b>
</p>

### 🎯 Learning Objectives

-	**Identify and Mitigate** a critical OWASP Top 10 vulnerability in a real-world scenario.
-	**Leverage**  the SAP Cloud Application Programming Model (CAP) for secure, cloud-native development.
-	**Implement** SAP BTP's comprehensive, built-in security services to protect your data and business logic.
-	**Validate** the effectiveness of security fixes through practical testing.

### 📋 Requirements

- Some experience with **Node.js** and **GitHub**

### 🔧 Prerequisites

Please complete the following setup **before the workshop**:

- **[Getting Started](exercises/ex0#getting-started)** – Set up your environment and initial deployment.

> 💡 **Tip:**
> - Some exercises require switching between user accounts. Use an **Incognito (Private)** browser window to avoid authentication conflicts.
> - This workshop was tested with the Edge web browser. For a better experience, we recommend using Edge.

## 💻Exercises

Every exercise module is a self-contained lab focused on a specific vulnerability. All modules adhere to the following standard structure:

- 📖 **1. Overview:** A high-level description of the vulnerability, its impact, and why it's a security risk.
- 🚨 **2. Vulnerable Code:** A snippet of code containing the specific security flaw. We'll analyze why it's insecure.
- 💥 **3. Exploitation:** A step-by-step guide on how to exploit the vulnerability, demonstrating its real-world impact.
- 🛡️ **4. Remediation:** The corrected version of the code that patches the vulnerability, along with an explanation of the fix.
- ✅ **5. Verification:** A simple procedure to confirm that the patch has successfully mitigated the vulnerability and the exploit no longer works.
- 📌 **6. Summary:** A practical recap that consolidates the exercise outcomes with actionable takeaways.

💡In step 4, you will replace the vulnerable version of the code with a corrected version. In most cases you will have to open the corrected file and copy the full content into the development environment. If you only copy the code snippet explaining the fixes, your application won't work. To copy the content of the file, use the button "Copy raw file" in the toolbar above the file content.

This structure is designed to help you understand a vulnerability from an attacker's perspective and a defender's, see how it can impact a CAP application, and learn actionable steps to mitigate it with SAP BTP best practices. 

- [Exercise 0 - Getting Started (Prerequisites)](exercises/ex0#getting-started)
- [Exercise 1 - Broken Access Control](exercises/ex1#exercise-1---broken-access-control)
    - [Exercise 1.1 - Horizontal Privilege Escalation](exercises/ex1/ex1.1/README.md#exercise-11---horizontal-privilege-escalation)
    - [Exercise 1.2 - Vertical Privilege Escalation](exercises/ex1/ex1.2/README.md#exercise-12---vertical-privilege-escalation)
- [Exercise 2 - SQL Injection](exercises/ex2/README.md#exercise-2---sql-injection)
- [Exercise 3 - Security Logging and Monitoring Failures](exercises/ex3/README.md)
    - [Exercise 3.1 - Audit Logging for Sensitive Data Access in Local Development](exercises/ex3/ex3.1/README.md)
    - [Exercise 3.2 - Security Event Monitoring in SAP BTP Production Environment (Optional - requires production landscape)](exercises/ex3/ex3.2/README.md)
- [Additional Resources](resources/README.md)

## Known Issues
No known issues.

## 🤝 How to Get Support

This repository content is designed for the DSAG-TechExchange workshop, where **live support** will be available from facilitators during the event.

### During the Workshop

Support is available directly from the instructors.

### 🕐 Outside the Workshop

- **Found a bug or have a question?**  
  [Open an issue](https://github.com/SAP-samples/btp-secure-development/issues) in this repository.

- **Looking for broader support?**  
  [Ask a question in SAP Community](https://answers.sap.com/questions/ask.html).

  💡 **Tip:** When creating issues, please include details like your environment (Node.js version, OS), steps to reproduce the issue, and screenshots if applicable. This helps us provide faster, more accurate support!

## Contributing
If you wish to contribute code, offer fixes or improvements, please send a pull request. Due to legal reasons, contributors will be asked to accept a DCO when they create the first pull request to this project. This happens in an automated fashion during the submission process. SAP uses [the standard DCO text of the Linux Foundation](https://developercertificate.org/).

## License
Copyright (c) 2026 SAP SE or an SAP affiliate company. All rights reserved. This project is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](LICENSE) file.
