# Saga Health LMN API

Generate a Letter of Medical Necessity (LMN) on behalf of a customer. The API drafts the LMN, routes it to a licensed nurse practitioner for e-signature, and emails the signed PDF to the customer when complete. An optional webhook fires once the signed letter has been delivered to the customer.

**Base URL:** `https://api.mysagahealth.com`

**Note:** This documentation is subject to change as this API is currently being implemented.

---

## Authentication

All requests must include an API key in the `Authorization` header:

```
Authorization: Bearer sk_live_xxxxxxxxxxxxxxxx
```

Contact `partners@mysagahealth.com` to provision an API key.

---

## POST `/api/v1/lmn`

Submit a customer's intake and trigger the LMN flow. The request returns once the unsigned LMN has been emailed to the nurse practitioner for signature. The signed letter is delivered to the customer asynchronously (typically within 24 hours).

### Request

**Headers**

| Header | Value |
|---|---|
| `Authorization` | `Bearer <your-api-key>` |
| `Content-Type` | `application/json` |

**Body**

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@example.com",
  "age": 32,
  "sex": "Female",
  "pregnant": "No",
  "hsaProvider": "HealthEquity",
  "state": "NY",
  "diagnosedConditions": ["Anxiety", "Chronic Pain"],
  "familyHistory": ["Depression"],
  "riskFactors": ["Stress"],
  "preventiveTargets": "stress management",
  "desiredProduct": "Massage therapy",
  "businessName": "Tension Intervention",
  "attestation": true,
  "webhookUrl": "https://partner.example.com/webhooks/saga-lmn"
}
```

**Field reference**

| Field | Type | Required | Notes |
|---|---|---|---|
| `firstName` | string | yes | Customer's legal first name. |
| `lastName` | string | yes | Customer's legal last name. |
| `email` | string | yes | Customer's email — the signed LMN PDF is delivered here. |
| `age` | integer | yes | Positive integer. |
| `sex` | string | yes | `"Male"`, `"Female"`, or `"Other"`. |
| `pregnant` | string | no | `"Yes"`, `"No"`, or `"N/A"`. If `"Yes"`, `"Pregnancy"` is appended to `diagnosedConditions` automatically. |
| `hsaProvider` | string | yes | HSA/FSA administrator. See [supported providers](#supported-hsa-providers). |
| `state` | string | yes | Two-letter US state code (e.g., `"NY"`). Used to route to a nurse practitioner licensed in that state. |
| `diagnosedConditions` | string[] | yes | At least one condition required. See [supported conditions](#supported-conditions); `"Other"` is allowed for free-text follow-up. |
| `familyHistory` | string[] | no | Family medical history. Same allowed values as [supported conditions](#supported-conditions). Defaults to `[]`. |
| `riskFactors` | string[] | no | Lifestyle/environmental risk factors. Same allowed values as [supported conditions](#supported-conditions). Defaults to `[]`. |
| `preventiveTargets` | string | no | Free-text description of the customer's preventive health goals (e.g., `"reduce stress and improve sleep"`). Defaults to `""`. |
| `desiredProduct` | string | yes | The wellness product/service the LMN is being written for (e.g., `"Massage therapy"`, `"Pilates"`). |
| `businessName` | string | yes | The provider/business that will fulfill the service. Surfaced in the letter body. |
| `attestation` | boolean | yes | Must be `true`. Confirms the customer attests the intake info is accurate. |
| `webhookUrl` | string | no | HTTPS URL that will receive a POST when the signed LMN is delivered to the customer. See [Webhook](#webhook-optional). |

### Response

**`200 OK`** — LMN drafted and sent to a nurse practitioner for signature.

```json
{
  "success": true,
  "requestId": "lmn_01HXY8K2P4N7QZ9R3V6W2J5T8B",
  "documentGroupId": "doc_grp_8aB3kLm",
  "nursePractitioner": {
    "firstName": "Derek",
    "lastName": "Smith",
    "state": "NY"
  },
  "message": "LMN drafted and sent to nurse practitioner for signature."
}
```

| Field | Description |
|---|---|
| `requestId` | Stable identifier for this LMN request. Use this to correlate with webhook events. |
| `documentGroupId` | Internal SignWell document group ID. Useful for support escalations. |
| `nursePractitioner` | The licensed NP the LMN was routed to. |

### Errors

| Status | Error code | When |
|---|---|---|
| `400` | `missing_fields` | One or more required fields are missing. `details` lists them. |
| `400` | `invalid_field` | A field has the wrong type or fails validation (e.g., `age` is not a positive integer, `state` is not a 2-letter code). |
| `400` | `attestation_required` | `attestation` is not `true`. |
| `401` | `unauthorized` | Missing or invalid API key. |
| `500` | `lmn_generation_failed` | Drafting the LMN failed. Safe to retry. |
| `502` | `signature_provider_error` | Sending to the e-signature provider failed. Safe to retry. |

Error response shape:

```json
{
  "success": false,
  "error": "missing_fields",
  "details": "Missing fields: email, state"
}
```

---

## Webhook (optional)

If `webhookUrl` is included in the request, Saga will POST to it once the signed LMN PDF has been emailed to the customer. This event fires **after** the nurse practitioner signs and the email is successfully delivered to the customer's inbox queue.

### Delivery

- Method: `POST`
- Content-Type: `application/json`
- Timeout: 10 seconds
- Retries: up to 5 attempts with exponential backoff (1m, 5m, 30m, 2h, 6h) on non-2xx responses or timeouts.
- Your endpoint should respond with any `2xx` status to acknowledge receipt.

### Payload

```json
{
  "event": "lmn.client_letter_sent",
  "requestId": "lmn_01HXY8K2P4N7QZ9R3V6W2J5T8B",
  "clientEmail": "jane.doe@example.com",
  "clientName": "Jane Doe",
  "sentAt": "2026-05-22T18:42:17.523Z"
}
```

| Field | Description |
|---|---|
| `event` | Always `"lmn.client_letter_sent"` for this event. |
| `requestId` | Matches the `requestId` returned from the original `POST /api/v1/lmn` response. |
| `clientEmail` | Customer email the signed LMN was delivered to. |
| `clientName` | Customer's full name. |
| `sentAt` | ISO 8601 UTC timestamp of when the email was dispatched. |

### Verifying webhooks

We sign every webhook with HMAC-SHA256 using your account's webhook secret. The signature is in the `X-Saga-Signature` header:

```
X-Saga-Signature: sha256=<hex-encoded-hmac>
```

To verify, compute `HMAC-SHA256(webhookSecret, rawRequestBody)` and compare to the header value using a constant-time comparison.

---

## Reference

### Supported HSA providers

`HealthEquity`, `Fidelity`, `Lively`, `HSA Bank`, `Optum Bank`, `Further`, `Bank of America`, `WageWorks`, `FSA Feds`, `PA Group`, `WEX`, `PayFlex`, `HealthSavings Administrators`, `ConnectYourCare`, `Other`.

### Supported conditions

Used by `diagnosedConditions`, `familyHistory`, and `riskFactors`:

`Anxiety`, `Depression`, `Chronic Pain`, `Arthritis`, `High Blood Pressure`, `Diabetes`, `Heart Disease`, `Obesity`, `Sleep Disorders`, `Stress`, `Other`. `Pregnancy` is added automatically to `diagnosedConditions` when `pregnant === "Yes"`.

---

## Example

```bash
curl -X POST https://api.mysagahealth.com/api/v1/lmn \
  -H "Authorization: Bearer sk_live_xxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane.doe@example.com",
    "age": 32,
    "sex": "Female",
    "hsaProvider": "HealthEquity",
    "state": "NY",
    "diagnosedConditions": ["Anxiety"],
    "desiredProduct": "Massage therapy",
    "businessName": "Tension Intervention",
    "attestation": true,
    "webhookUrl": "https://partner.example.com/webhooks/saga-lmn"
  }'
```
