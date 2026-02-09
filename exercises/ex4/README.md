# Exercise 5 – Vulnerable and Outdated Components (A06:2021) in Incident Management Application

## Table of Contents

- [📖 1. Overview](#1-overview)
- [🚨 2. Vulnerable Code](#2-vulnerable-code)
- [💥 3. Exploitation](#3-exploitation)
- [🛡️ 4. Remediation](#4-remediation)
- [✅ 5. Verification](#5-verification)
- [📌 6. Summary](#6-summary)

---

## 📖 1. Overview

Vulnerable and outdated components are a top supply chain risk for all Node.js and SAP CAP apps. If both application and BTP service dependencies aren’t checked and updated continuously, attackers will exploit them—regardless of business logic security.

This lab is hands-on, using your real CAP project structure and pipelines.

---

## 🚨 2. Vulnerable Code

Below is your `package.json`. For demo, we add the known vulnerable `lodash@4.17.15`, but in real-world you’ll see this same risk as soon as _any_ dependency lags:

```json
{
  "name": "incident-management",
  "version": "1.0.0",
  "description": "A simple CAP project.",
  "dependencies": {
    "@cap-js/hana": "^2",
    "@sap/cds": "^9",
    "@sap/xssec": "^4.8.0",
    "express": "^4",
    "lodash": "4.17.15" // ⚠️ Demo risk – real CVEs for <4.17.21!
  },
  "engines": {
    "node": ">=20"
  },
  "devDependencies": {
    "@cap-js/cds-test": "^0.4.0",
    "@cap-js/cds-types": "^0.11.0",
    "@cap-js/sqlite": "^2",
    "@sap/cds-dk": "^9.1.1",
    "ui5-task-zipper": "^3.4.2"
  }
}
```

**Why is this dangerous?**
- `"lodash"` is a public CVE sink—prototype pollution, injection, etc.
- `"express"` and `"@sap/xssec"` have both had vulnerabilities historically.
- No npm audit, SAP Application Vulnerability Report, or blocking gates.

---

## 💥 3. Exploitation

**Step-by-step Attack**

1. **Find Unpatched Package:**  
   Automated scans reveal the version from your app or BTP service instance.
2. **Send Prototype Pollution Payload:**

    ```json
    {
      "title": "CVE exploit",
      "details": { "__proto__": { "polluted": "yes" } }
    }
    ```

3. **App Code (unsafe merge):**

    ```js
    const _ = require('lodash')
    let config = _.merge({}, req.data.details)
    if (config.polluted) {
      // Your prototype is compromised!
    }
    ```

4. **CI/CD and BTP let it ship:**  
   Without blocking on vulnerabilities, exploit code arrives in prod.

---

## 🛡️ 4. Remediation

### a. Add Automated Checks (SAP-native + open source)
- **SAP Application Vulnerability Report:**  
  https://help.sap.com/docs/application-vulnerability-report

- **npm audit**, etc:
    ```sh
    npm install
    npm audit --audit-level=high
    npm outdated
    ```

#### SAP CI/CD YAML Example:
```yaml
steps:
  - script: npm ci
  - script: npm audit --audit-level=high
  - script: npm outdated --long || exit 1
```

### b. Patch All Vulnerable Components

```sh
npm install lodash@4.17.21 --save
```
- Review (`express`, `@sap/xssec`, dev-deps) as well before commit.

### c. Platform Service Check

- In SAP BTP Cockpit:  
    - Check for deprecated/broken service instances (`hana`, `xsuaa`)
- Rerun Application Vulnerability Report after any deployment.

### d. SBOM/Compliance

- Generate SBOM as part of build:
    ```sh
    npx sbom > sbom.json
    ```

---

## ✅ 5. Verification

### Manual

1. Add vulnerable lodash to `package.json`.
2. Run:
    ```sh
    npm audit --audit-level=high
    ```
   Output should flag lodash.
3. Upgrade lodash, rerun, audit is now clean.
4. Your CI/CD should *block* any insecure PR.

### Automated

```sh
npm audit --audit-level=high | grep lodash
npm install lodash@4.17.21 --save
npm audit --audit-level=high | grep lodash # No output = fixed
```

### SAP Dashboard

- Go to BTP Cockpit → Security → Application Vulnerability Report
- Download and check. No vulnerable libraries should report for Incident app.

---

## 📌 6. Summary

**Key outcomes:**
- Attackers exploit slow or ignored dependency updates—this is a practical, not hypothetical, risk.
- SAP AVR + open-source scripting + CI/CD blocks and detects outdated/vulnerable code.
- SBOM generation = regulatory and operational confidence.
- Dependency health must live in build/test, not once-a-year sweeps.
- Train teams to fix *before* deployment—make it routine, not a panic.

**Links for more:**
- [SAP CAP Security Guide](https://cap.cloud.sap/docs/guides/security/)
- [SAP Application Vulnerability Report](https://help.sap.com/docs/application-vulnerability-report)
- [OWASP Top 10, A06](https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/)

