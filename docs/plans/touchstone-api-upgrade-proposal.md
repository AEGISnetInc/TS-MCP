# Touchstone API Upgrade Proposal

**Date:** 2026-01-14
**Status:** Draft
**Purpose:** Document proposed enhancements to the Touchstone API to better support MCP integration and developer workflows.

---

## Background

During the design of TS-MCP (Use Case 1: Conversational FHIR Testing Assistant), we identified several limitations in the current Touchstone API that impact developer experience and automation capabilities.

This document captures proposed enhancements for discussion with the AEGIS Touchstone team.

---

## Current Limitations

| Gap | Current Behavior | Impact |
|-----|------------------|--------|
| No list test setups endpoint | Users must know Test Setup names from UI | Cannot browse available setups programmatically |
| No dynamic endpoint specification | Test systems must be pre-configured in UI | Cannot specify FHIR server URL at runtime |
| No test script search | Must browse UI to find tests | Cannot discover relevant tests programmatically |
| No Test Setup introspection | Cannot inspect what a Test Setup contains or requires | Cannot detect expected variables, fixtures, or parameters before execution |
| Polling-only status | Must poll every 4+ seconds | Inefficient; no real-time updates |

---

## Proposed Enhancements

### 1. List Test Setups Endpoint

**Endpoint:** `GET /api/testSetups`

**Purpose:** Retrieve available Test Setups for the authenticated user/organization.

**Response:**
```json
{
  "testSetups": [
    {
      "id": "setup-123",
      "name": "Patient-CRUD",
      "description": "Patient resource CRUD operations",
      "testSystem": "My-Dev-Server",
      "testScriptCount": 12,
      "lastExecuted": "2026-01-10T15:30:00Z"
    }
  ]
}
```

**Value:** Enables programmatic discovery of available test configurations.

---

### 2. Dynamic Test System Specification

**Enhancement:** Allow passing FHIR server URL at execution time.

**Current:** `POST /api/testExecution`
```json
{
  "testSetup": "SetupName"
}
```

**Proposed:** `POST /api/testExecution`
```json
{
  "testSetup": "SetupName",
  "targetEndpoint": "https://my-fhir-server.com/fhir"
}
```
Ideally, if `trargetEndpoint` is not yet found as a TestSytem, we create it (populating Org Name from the authenticated user's profile).
- We may need to return a prompt for some of the TestSystem info required.
- Need the proxy URL returned
 
**Value:** Enables testing against dynamic environments (dev, staging, PR previews) without pre-configuration.

---

### 3. Test Script Search Endpoint

**Endpoint:** `GET /api/testScripts?q=<search>&ig=<implementation-guide>`

**Purpose:** Search available test scripts by keyword or implementation guide.

**Response:**
```json
{
  "testScripts": [
    {
      "id": "script-456",
      "name": "Patient-read",
      "description": "Test Patient read operation",
      "implementationGuide": "US Core 6.1",
      "resourceTypes": ["Patient"]
    }
  ]
}
```

**Value:** Enables AI assistants to discover and recommend relevant tests.

---

### 4. Test Setup Introspection Endpoint

**Endpoint:** `GET /api/testSetups/{name}`

**Purpose:** Retrieve the full configuration of a Test Setup, including its TestScripts, required variables, fixtures, and destination Test System details. This enables callers to detect what user input is expected before launching an execution.

**Response:**
```json
{
  "name": "Patient-CRUD",
  "description": "Patient resource CRUD operations",
  "testSystem": {
    "name": "My-Dev-Server",
    "baseUrl": "https://my-fhir-server.com/fhir",
    "organization": "My Org"
  },
  "testScripts": [
    {
      "name": "Patient-client-id-xml",
      "path": "/FHIR3-0-2-Basic/P-R/Patient/Client Assigned Id/Patient-client-id-xml",
      "variables": [
        {
          "name": "searchParamIdentifier",
          "description": "Patient identifier for search operations",
          "defaultValue": "urn:oid:1.2.3.4.5.6.7"
        }
      ],
      "fixtures": [
        {
          "id": "patient-create",
          "resourceType": "Patient",
          "description": "Patient resource used for create operation"
        }
      ]
    }
  ]
}
```

**Value:** Enables AI assistants and automation tools to prompt users for required inputs before execution, validate configurations, and provide meaningful guidance about what a Test Setup will do.

---

### 5. Webhook Notifications

**Enhancement:** Register webhook URL for execution status updates.

**Endpoint:** `POST /api/webhooks`
```json
{
  "url": "https://my-server.com/touchstone-callback",
  "events": ["execution.completed", "execution.failed"]
}
```

**Callback Payload:**
```json
{
  "event": "execution.completed",
  "executionId": "12345",
  "status": "Passed",
  "summary": { "total": 50, "passed": 50, "failed": 0 }
}
```

**Value:** Eliminates polling; enables real-time CI/CD integration.

---

### 6. Batch Execution

**Enhancement:** Launch multiple Test Setups in a single request.

**Endpoint:** `POST /api/testExecution/batch`
```json
{
  "testSetups": ["Patient-CRUD", "Observation-CRUD", "Encounter-CRUD"]
}
```

**Response:**
```json
{
  "executions": [
    { "testSetup": "Patient-CRUD", "executionId": "123" },
    { "testSetup": "Observation-CRUD", "executionId": "124" },
    { "testSetup": "Encounter-CRUD", "executionId": "125" }
  ]
}
```

**Value:** Reduces API calls for comprehensive test runs.

---

## Priority Ranking

| Priority | Enhancement | Rationale |
|----------|-------------|-----------|
| **High** | List Test Setups | Fundamental for usability |
| **High** | Test Setup Introspection | Enables detecting required inputs before execution |
| **High** | Test Script Search | Enables intelligent test discovery |
| **Medium** | Dynamic Endpoint | Valuable for CI/CD workflows |
| **Medium** | Webhook Notifications | Improves efficiency |
| **Low** | Batch Execution | Convenience optimization |

---

## Next Steps

1. Review proposal with AEGIS Touchstone team
2. Prioritize based on feasibility and demand
3. Define detailed API specifications for approved enhancements
4. Plan implementation timeline

---

## Notes

*This document will be expanded based on discussions with the Touchstone team and feedback from the developer community.*
