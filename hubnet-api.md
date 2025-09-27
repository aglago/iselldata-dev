# Hubnet API Documentation

## Overview

This document provides details for interacting with the Hubnet API.

⚠️ **Rate limit**: All endpoints allow up to 5 requests per minute.

---

## Endpoints

### 1. Check Balance

**Method:** `GET`

**Endpoint:**

```
https://console.hubnet.app/live/api/context/business/transaction/check_balance
```

---

### 2. Make Transaction

**Method:** `POST`

**Endpoint:**

```
https://console.hubnet.app/live/api/context/business/transaction/{network}-new-transaction
```

**Headers:**

```json
{
  "token": "Bearer YOUR_API_KEY",
  "Content-Type": "application/json"
}
```

**Payload:**

```json
{
  "phone": "0240123456",
  "volume": "2000",
  "reference": "ABEDC-BBADE-ABBCDD-AABCE",
  "referrer": "0270123456",
  "webhook": "https://your-webhook/url"
}
```

---

## Key Parameters

| Key       | Type   | Required | Length              | Description                                     |
| --------- | ------ | -------- | ------------------- | ----------------------------------------------- |
| network   | String | Yes      | 3–10 digits maximum | Allowed networks: `mtn`, `at`, `big-time`       |
| volume    | String | Yes      | Between 1–100       | Number of megabytes to be transferred           |
| phone     | String | Yes      | Strictly 10 digits  | Valid national phone number (e.g. 0241234567)   |
| reference | String | Yes      | 6–25 characters     | Unique reference ID for each transaction        |
| referrer  | String | Optional | Strictly 10 digits  | Buyer's number to receive alert                 |
| webhook   | String | Optional | —                   | URL to receive POST requests for status updates |

---

## Sample Response

```json
{
  "status": true,
  "reason": "Successful",
  "code": "transaction initiated successfully.",
  "message": "0000",
  "transaction_id": "TXN-TEST",
  "payment_id": "PSH-TEST",
  "ip_address": "192.278.321.001",
  "reference": "TEST",
  "data": {
    "status": true,
    "code": "0000",
    "message": "Order successfully placed."
  }
}
```

---

## Status Codes

| Code | Meaning                              |
| ---- | ------------------------------------ |
| 0000 | Transaction initialized successfully |
| 1001 | Invalid network                      |
| 1002 | Invalid volume                       |

---

## Example cURL Request

```bash
curl https://console.hubnet.app/live/api/context/business/transaction/{network}-new-transaction \
    -H "token: Bearer YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
        "phone": "0241234567",
        "volume": "2000",
        "reference": "ABEDC-BBADE-ABBCDD-AABCE",
        "referrer": "0300123456",
        "webhook": "https://your-webhook/url"
    }' \
    -X POST
```
