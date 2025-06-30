# RISK Markets API Docs

Last Updated: 2025-06-30

This document provides details for interacting with the Manifold Risk Markets API, offering functionalities for credit scoring, insurance fee calculation, transaction execution, historical data retrieval, and partner code validation.

The website and API are open source, [view source code](https://github.com/crowlsyong/rcr)

## API Refactor Notice (June 2025)

The RISK API has been refactored to improve security, clarity, and functionality. Please review the new endpoints below. While the old endpoints are still available for backward compatibility, they are now considered deprecated and will be removed in a future version.

**Key Changes:**

*   **New Endpoints:** We have introduced new, more specific endpoints for fetching scores (`/credit-score`), calculating insurance quotes (`/insurance/quote`), and executing transactions (`/insurance/execute`).
*   **User Identification:** New endpoints now support lookup by either `username` or `userId` for greater flexibility.
*   **Security:** All transaction-related logic is now handled exclusively by secure, server-side endpoints.

### Base URL

All API endpoints are accessed relative to the following base URL: `https://risk.markets/api/v0`

For local development and testing, replace `https://risk.markets` with `http://localhost:8000`.

### Authentication

All `POST` requests to this API that perform Manifold Markets transactions (e.g., sending mana, adding bounties) require a valid Manifold Markets API Key. This key should be provided in the JSON request body as the `apikey` field.

**Note:** This API does not store your API key. It is used only for the duration of the
transaction.

### CORS (Cross-Origin Resource Sharing)

This API is configured with CORS middleware to allow requests from any origin (`*`). This enables seamless integration from various web applications. Preflight `OPTIONS` requests, common for complex requests (like `POST` with `Content-Type: application/json`), are handled automatically.

## API Endpoints

## 1. GET /api/v0/credit-score

**Purpose**

To calculate and retrieve a user's current credit score (MMR) and associated risk base fee based on their Manifold Markets activity and portfolio. This is the new, preferred endpoint for all score-related lookups.

### Usage

**Request**`GET` requests are made by appending a `username` or `userId` query parameter to the endpoint URL.

`GET https://risk.markets/api/v0/credit-score?username={username}`
`GET https://risk.markets/api/v0/credit-score?userId={userId}`

**Parameters**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | `string` | `Conditional` | The Manifold Markets username. Required if `userId` is not provided. |
| `userId` | `string` | `Conditional` | The Manifold Markets user ID. Required if `username` is not provided. |

### **Example GET Request**

`curl "https://risk.markets/api/v0/credit-score?username=RISKBOT"`

**Example Response (Success: `200 OK`)**

```json
{
  "username": "RISKBOT",
  "userId": "6QIP88QnoqcYeePMrbTojs42JOM2",
  "creditScore": 827,
  "riskBaseFee": 0.03,
  "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocKaN9-RDIt18AYUbA3im5d3HcSLt8JI2MZ81Ep8t_HY=s96-c",
  "userExists": true,
  "fetchSuccess": true,
  "userDeleted": false,
  "details": {
    "latestRank": 5,
    "outstandingDebtImpact": -1024,
    "calculatedProfit": 30082.3079871295,
    "balance": 18188.9684821406,
    "rawMMR": 16931.1670463976
  },
  "historicalDataSaved": false
}
```

**Error Responses**

- `400 Bad Request`:
    - `Username or userId parameter is required`
- `200 OK` (User Not Found / Deleted):
    - Returns a `200 OK` status with `userExists: false` and `creditScore: 0`.
- `500 Internal Server Error`:
    - `Internal server error: [error message]`

### Data Model (interface)

```tsx
export interface CreditScoreOutput {
  username: string;
  userId: string;
  creditScore: number;
  riskBaseFee: number;
  avatarUrl: string | null;
  userExists: boolean;
  fetchSuccess: boolean;
  userDeleted: boolean;
  details: {
    latestRank: number | null;
    outstandingDebtImpact: number;
    calculatedProfit: number;
    balance: number;
    rawMMR: number;
  };
  historicalDataSaved: boolean;
}
```

## 2. POST /api/v0/insurance/quote

**Purpose**

To calculate the Manifold Risk insurance fee and provide detailed breakdowns of all associated costs. This endpoint is purely for calculation and does not perform any transactions. This is the new, preferred endpoint for fee calculation.

### Usage

**Request**`POST` requests send a JSON body to the endpoint URL.

`POST https://risk.markets/api/v0/insurance/quote`

**Parameters (JSON Request Body)**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `borrowerUsername` | `string` | `Conditional` | Borrower's username. Required if `borrowerId` is not provided. |
| `borrowerId` | `string` | `Conditional` | Borrower's user ID. Required if `borrowerUsername` is not provided. |
| `lenderUsername` | `string` | `Conditional` | Lender's username. Required if `lenderId` is not provided. |
| `lenderId` | `string` | `Conditional` | Lender's user ID. Required if `lenderUsername` is not provided. |
| `loanAmount` | `number` | `Yes` | The amount of Mana (M) being loaned. |
| `coverage` | `number` | `Yes` | Valid values: `25`, `50`, `75`, or `100`. |
| `dueDate` | `string` | `Yes` | The loan due date in `YYYY-MM-DD` format. |
| `partnerCode` | `string` | `No` | Optional partner discount code. |
| `lenderFee` | `number` | `No` | Optional lender fee (percentage if < 100, flat mana if >= 100). |

### **Example POST Request**

```bash
curl -X POST "https://risk.markets/api/v0/insurance/quote" \
-H "Content-Type: application/json" \
-d '{
  "borrowerUsername": "RISKBOT",
  "lenderUsername": "Bob",
  "loanAmount": 1000,
  "coverage": 50,
  "dueDate": "2026-06-27",
  "partnerCode": "RISK25",
  "lenderFee": 5
}'
```

**Example Response (Success: `200 OK`)**

```json
{
  "success": true,
  "borrowerProfile": {
    "username": "RISKBOT",
    "userId": "SOME_BORROWER_USER_ID",
    "creditScore": 713,
    "riskBaseFee": 0.05,
    "avatarUrl": "https://example.com/RISKBOT_avatar.jpg",
    "userExists": true,
    "userDeleted": false
  },
  "lenderProfile": {
    "username": "Bob",
    "userId": "SOME_LENDER_USER_ID",
    "userExists": true,
    "userDeleted": false
  },
  "feeDetails": {
    "riskFee": 50,
    "coverageFee": 50,
    "durationFee": 100,
    "totalInitialFee": 200,
    "discountApplied": true,
    "discountAmount": 50,
    "finalFee": 150
  },
  "lenderFeeMana": 50,
  "loanAmount": 1000,
  "coverage": 50,
  "dueDate": "2026-06-27"
}
```

## 3. POST /api/v0/insurance/execute

**Purpose**

To securely execute the loan transaction and insurance fee payment. This is the new, preferred endpoint for all insurance-related transactions.

### Usage

**Request**`POST` requests send a JSON body to the endpoint URL.

`POST https://risk.markets/api/v0/insurance/execute`

**Parameters (JSON Request Body)**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `apiKey` | `string` | `Yes` | Your Manifold Markets API Key. |
| `borrowerUsername` | `string` | `Conditional` | Borrower's username. Required if `borrowerId` is not provided. |
| `borrowerId` | `string` | `Conditional` | Borrower's user ID. Required if `borrowerUsername` is not provided. |
| `lenderUsername` | `string` | `Conditional` | Lender's username. Required if `lenderId` is not provided. |
| `lenderId` | `string` | `Conditional` | Lender's user ID. Required if `lenderUsername` is not provided. |
| `loanAmount` | `number` | `Yes` | The amount of Mana (M) being loaned. |
| `coverage` | `number` | `Yes` | Valid values: `25`, `50`, `75`, or `100`. |
| `dueDate` | `string` | `Yes` | The loan due date in `YYYY-MM-DD` format. |
| `institution` | `string` | `No` | Optional. Valid values: `"IMF"`, `"BANK"`, `"RISK"`, `"OFFSHORE"`. |
| `commentId` | `string` | `Conditional` | Required if `institution` is provided. |
| `dryRun` | `boolean` | `No` | If `true`, simulates the transaction without executing it. |
| ... | ... | ... | Other optional parameters from the `/quote` endpoint (`partnerCode`, `lenderFee`, `managramMessage`). |

### **Example POST Request**

```bash
curl -X POST "https://risk.markets/api/v0/insurance/execute" \
-H "Content-Type: application/json" \
-d '{
  "apiKey": "YOUR_MANIFOLD_API_KEY",
  "borrowerUsername": "RISKBOT",
  "lenderUsername": "Bob",
  "loanAmount": 500,
  "coverage": 100,
  "dueDate": "2026-07-27"
}'
```

**Example Response (Success: `200 OK`)**

```json
{
  "success": true,
  "message": "Loan and insurance fee processed successfully.",
  "loanTransactionId": "loan_txn_SOME_UUID",
  "insuranceTransactionId": "ins_txn_SOME_OTHER_UUID",
  "receiptCommentId": "comment_SOME_THIRD_UUID",
  "marketUrl": "https://manifold.markets/market/QEytQ5ch0P"
}
```

## 4. POST /api/v0/limits/execute

**Purpose**

To securely place multiple limit orders on a Manifold Market, with server-side rollback logic. This is the new, preferred endpoint for placing multiple limit orders.

### Usage

**Request**`POST` requests send a JSON body to the endpoint URL.

`POST https://risk.markets/api/v0/limits/execute`

**Parameters (JSON Request Body)**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `apiKey` | `string` | `Yes` | Your Manifold Markets API Key. |
| `contractId` | `string` | `Yes` | The ID of the market to place bets on. |
| `orders` | `ApiOrder[]` | `Yes` | An array of objects, each representing a single limit order. |
| `answerId` | `string` | `No` | Required for MULTIPLE_CHOICE markets. |
| `expiresMillisAfter` | `number` | `No` | Optional. Orders expire after this duration in milliseconds. |
| `expiresAt` | `number` | `No` | Optional. Orders expire at this Unix timestamp (in milliseconds). |

**`ApiOrder` Structure:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `amount` | `number` | `Yes` | The amount of Mana (M) to bet. Must be `>= 1`. |
| `outcome` | `"YES" \| "NO"` | `Yes` | The outcome to bet on. |
| `limitProb` | `number` | `Yes` | The probability at which the bet should be placed (e.g., 0.75 for 75%). |

### Example POST Request

```bash
curl -X POST "https://risk.markets/api/v0/limits/execute" \
-H "Content-Type: application/json" \
-d '{
  "apiKey": "YOUR_MANIFOLD_API_KEY",
  "contractId": "YOUR_MARKET_ID",
  "orders": [
    { "amount": 10, "outcome": "YES", "limitProb": 0.70 },
    { "amount": 15, "outcome": "NO", "limitProb": 0.35 }
  ],
  "expiresMillisAfter": 3600000
}'
```

**Example Response (Success: `200 OK`)**

```json
{
  "success": true,
  "message": "Successfully placed 2 limit orders.",
  "betIds": ["bet_id_1", "bet_id_2"]
}
```

**Error Responses**

- `400 Bad Request`:
    - `Missing API Key or Contract ID`
    - `No orders provided for execution`
    - `Invalid individual order parameters`
- `500 Internal Server Error`:
    - `A bet failed: [error message]. Attempted to cancel X prior successful bet(s). Please verify your position on Manifold.` (Includes rollback attempt message)
    - `Internal server error: [error message]`

## 5. POST /api/v0/arbitrage/execute

**Purpose**

To securely execute an arbitrage bet pair across two Manifold Markets, with server-side rollback logic. This is the new, preferred endpoint for executing arbitrage.

### Usage

**Request**`POST` requests send a JSON body to the endpoint URL.

`POST https://risk.markets/api/v0/arbitrage/execute`

**Parameters (JSON Request Body)**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `apiKey` | `string` | `Yes` | Your Manifold Markets API Key. |
| `betA` | `BetPayload` | `Yes` | The payload for the first bet. |
| `betB` | `BetPayload` | `Yes` | The payload for the second bet. |

**`BetPayload` Structure:** (As defined by Manifold API)

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `amount` | `number` | `Yes` | The amount of Mana (M) to bet. Must be `>= 1`. |
| `contractId` | `string` | `Yes` | The ID of the market. |
| `outcome` | `"YES" \| "NO"` | `Yes` | The outcome to bet on. |
| `limitProb` | `number` | `No` | Optional. The probability at which the bet should be placed (for limit orders). |
| `answerId` | `string` | `No` | Optional. Required for MULTIPLE_CHOICE markets. |
| `expiresMillisAfter` | `number` | `No` | Optional. Orders expire after this duration in milliseconds. |
| `expiresAt` | `number` | `No` | Optional. Orders expire at this Unix timestamp (in milliseconds). |

### Example POST Request

```bash
curl -X POST "https://risk.markets/api/v0/arbitrage/execute" \
-H "Content-Type: application/json" \
-d '{
  "apiKey": "YOUR_MANIFOLD_API_KEY",
  "betA": {
    "contractId": "market_id_A",
    "amount": 100,
    "outcome": "YES"
  },
  "betB": {
    "contractId": "market_id_B",
    "amount": 105,
    "outcome": "NO"
  }
}'
```

**Example Response (Success: `200 OK`)**

```json
{
  "success": true,
  "message": "Arbitrage bets processed successfully!",
  "betDetails": [
    { "market": "Market A", "status": "placed", "amount": 100 },
    { "market": "Market B", "status": "placed", "amount": 105 }
  ]
}
```

**Error Responses**

- `400 Bad Request`:
    - `Missing required parameters`
- `500 Internal Server Error`:
    - `Bet on Market A failed: [error message]`
    - `Bet on Market B failed: [error message]. The successful bet on Market A was automatically canceled.` (Includes rollback attempt)
    - `Internal server error: [error message]`

## 6. GET /api/v0/history

**Purpose**

To retrieve a user's historical credit score data, allowing for trend analysis and tracking of score changes over time.

### Usage

**Request**`GET` requests are made by appending either a `username` or `userId` query parameter to the endpoint URL. At least one is required.

`GET https://risk.markets/api/v0/history?username={username}`
`GET https://risk.markets/api/v0/history?userId={userId}`

**Parameters**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | `string` | `No` | The Manifold Markets username. If `userId` is not provided, the API will attempt to resolve the `userId` from this username. |
| `userId` | `string` | `No` | The Manifold Markets user ID. If provided, this takes precedence over `username` for direct lookup. |

At least one of `username` or `userId` must be provided.

**Example GET Requests**

1. Fetch by Username:
`curl "https://risk.markets/api/v0/history?username=RISKBOT"`
2. Fetch by User ID:
`curl "https://risk.markets/api/v0/history?userId=6QIP88QnoqcYeePMrbTojs42JOM2"`

**Example Response (Success: `200 OK`)**

An array of historical credit score data points, sorted chronologically by `timestamp`.

```json
[
  {
    "userId": "SOME_USER_ID",
    "username": "RISKBOT",
    "creditScore": 650,
    "timestamp": 1700000000000
  },
  {
    "userId": "SOME_USER_ID",
    "username": "RISKBOT",
    "creditScore": 675,
    "timestamp": 1705000000000
  },
  {
    "userId": "SOME_USER_ID",
    "username": "RISKBOT",
    "creditScore": 713,
    "timestamp": 1710000000000
  }
]

```

**Error Responses**

- `400 Bad Request`:
    - `Username or userId is required`
- `404 Not Found`:
    - `User [username] not found` (If fetching by username and the user is not found on Manifold).
- `500 Internal Server Error`:
    - `Error fetching user data for [username]` (If there's a Manifold API error when resolving username to ID).
    - `Error fetching historical data` (For internal database errors).
    - `Could not determine user ID`

### Data Model (interface)

```tsx
export interface CreditScoreDataPoint {
  userId: string;
  username: string;
  creditScore: number;
  timestamp: number;
}

```

## 7. GET /api/v0/market/{slug}

**Purpose**

To retrieve up-to-date information for a specific Manifold Market by its slug. This endpoint acts as a server-side proxy for Manifold's public market data API.

### Usage

**Request**`GET` requests are made by including the market slug directly in the path.

`GET https://risk.markets/api/v0/market/{slug}`

**Parameters**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `slug` | `string` | `Yes` | The unique slug of the Manifold Market (e.g., `risk-at-500k-mana-market-cap-before`). |

### Example GET Request

`curl "https://risk.markets/api/v0/market/risk-at-500k-mana-market-cap-before"`

**Example Response (Success: `200 OK`)**

```json
{
  "id": "SOME_MARKET_ID",
  "question": "Will RISK hit $500k mana market cap by July 1st?",
  "slug": "risk-at-500k-mana-market-cap-before",
  "url": "https://manifold.markets/some-user/risk-at-500k-mana-market-cap-before",
  "outcomeType": "BINARY",
  "volume": 12345,
  "totalLiquidity": 5000,
  "probability": 0.65,
  "answers": null
}
```

**Error Responses**

- `400 Bad Request`:
    - `Market slug is required`
- `404 Not Found`:
    - `Market not found`
- `500 Internal Server Error`:
    - `Internal server error: [error message]`

### Data Model (interface)

(Uses `MarketData` interface, as defined in your existing `manifold_types.ts`.)

## 8. POST /api/v0/validate-partner-code

**Purpose**

To validate a provided partner discount code. This endpoint checks the code against a list of valid codes configured on the server.

### Usage

**Request**`POST` requests send a JSON body containing the `code` to be validated.

`POST https://risk.markets/api/v0/validate-partner-code`

**Parameters (JSON Request Body)**

| **Parameter** | **Type** | **Required** | **Description** |
| --- | --- | --- | --- |
| `code` | `string` | `Yes` | The partner code to be validated. |

### **Example POST Request (cURL)**

`curl -X POST "https://risk.markets/api/v0/validate-partner-code" -H "Content-Type: application/json" -d '{"code": "RISK25"}'`

**Example Responses (Success `200 OK` for both valid/invalid codes)**

1. Valid Partner Code:
    
    ```json
    {
      "isValid": true,
      "message": "Partner discount applied!",
      "discountType": "GENERIC_DISCOUNT"
    }
    ```
    
2. Invalid Partner Code:
    
    ```json
    {
      "isValid": false,
      "message": "Invalid partner code",
      "discountType": null
    }
    ```

**Error Responses**

- `500 Internal Server Error`:
    - (Generic server error if JSON parsing fails or an unhandled exception occurs).

### Data Model (interface)

```tsx
export interface PartnerCodeValidationResult {
  isValid: boolean;
  message: string;
  discountType: string | null;
}
```

## 9. POST /api/v0/creditcard (Credit Card Insurance)

**Purpose**

To facilitate direct payment of the calculated insurance fee for "credit card" type loans to the RISK Payment Portal. This endpoint handles only the insurance transaction and receipt generation; it does not disburse the credit loan amount itself or involve Manifold Mana transfers for the loan principal. It also supports a `dryRun` mode for testing and previewing without performing actual transactions.

### Usage

**Request**`POST` requests send a JSON body to the endpoint URL.

`POST https://risk.markets/api/v0/creditcard`

**Parameters (JSON Request Body)**

| **Parameter** | **Type** | **Required** | **Description** |
| --- | --- | --- | --- |
| `creditcard` | `boolean` | `Yes` | Must be `true` to signify a credit card insurance request. |
| `policy` | `string` | `Yes` | The coverage percentage for the loan. Valid string values: `"C25"`, `"C50"`, `"C75"`, or `"C100"`. |
| `apikey` | `string` | `Conditional` | Your Manifold Markets API Key. **Required for live transactions; optional if `dryRun` is `true`.** |
| `lenderUsername` | `string` | `Conditional` | The Manifold Markets username of the individual or bot initiating the credit loan. Either `lenderUsername` or `lenderId` is required. Cannot provide both. |
| `lenderId` | `string` | `Conditional` | The Manifold Markets user ID of the individual or bot initiating the credit loan. Either `lenderUsername` or `lenderId` is required. Cannot provide both. |
| `borrowerUsername` | `string` | `Conditional` | The Manifold Markets username of the individual receiving the credit loan. Either `borrowerUsername` or `borrowerId` is required. Cannot provide both. |
| `borrowerId` | `string` | `Conditional` | The Manifold Markets user ID of the individual receiving the credit loan. Either `borrowerUsername` or `borrowerId` is required. Cannot provide both. |
| `amount` | `number` | `Yes` | The original Mana (M) amount of the credit loan. Must be greater than 0. This value is used for insurance fee calculation and receipt generation, but no Mana is transferred for the loan principal through this endpoint. |
| `discountcode` | `string` | `No` | An optional partner discount code. If a valid code (configured in the `PARTNER_CODES` environment variable) is provided, a 25% discount will be applied to the total insurance fee. |
| `loanDue` | `number` | `Yes` | The date the loan is due, as a Unix timestamp (seconds since epoch). This date must be in the future, otherwise a `400` error will be returned. Used to calculate the duration fee and policy end date. |
| `dryRun` | `boolean` | `No` | If `true`, the endpoint will perform all calculations, but **will not execute any actual Manifold Markets transactions**. The `insuranceActivated` field will be `false`, and `dryRunReceiptContent` will be omitted. Useful for testing and previewing fees. Defaults to `false`. |

### **Example POST Request (cURL)**

```bash
# Example 1: Live transaction (using usernames)
curl -X POST "https://risk.markets/api/v0/creditcard" \
-H "Content-Type: application/json" \
-d '{
  "creditcard": true,
  "policy": "C100",
  "apikey": "YOUR_MANIFOLD_API_KEY",
  "lenderUsername": "crowlsyong",
  "borrowerUsername": "RISKBOT",
  "amount": 50,
  "discountcode": "OFFSHORE",
  "loanDue": 1722230400
}'

# Example 2: Live transaction (using user IDs)
curl -X POST "https://risk.markets/api/v0/creditcard" \
-H "Content-Type: application/json" \
-d '{
  "creditcard": true,
  "policy": "C100",
  "apikey": "YOUR_MANIFOLD_API_KEY",
  "lenderId": "luefhuehaljsdhfnzcvx",
  "borrowerId": "zwdrztdofiopifejfej",
  "amount": 50,
  "discountcode": "OFFSHORE",
  "loanDue": 1722230400
}'

# Example 3: Dry Run (using usernames)
curl -X POST "https://risk.markets/api/v0/creditcard" \
-H "Content-Type: application/json" \
-d '{
  "creditcard": true,
  "policy": "C50",
  "apikey": "ANY_API_KEY_OR_LEAVE_EMPTY_FOR_DRYRUN",
  "lenderUsername": "your_lender_bot",
  "borrowerUsername": "testuser",
  "amount": 100,
  "loanDue": 1730000000,
  "dryRun": true
}'

# Example 4: Dry Run (using user IDs)
curl -X POST "https://risk.markets/api/v0/creditcard" \
-H "Content-Type: application/json" \
-d '{
  "creditcard": true,
  "policy": "C50",
  "apikey": "ANY_API_KEY_OR_LEAVE_EMPTY_FOR_DRYRUN",
  "lenderId": "SOME_LENDER_USER_ID",
  "borrowerId": "SOME_BORROWER_USER_ID",
  "amount": 100,
  "loanDue": 1730000000,
  "dryRun": true
}'
```

*(Note: `1722230400` and `1730000000` are example Unix timestamps for future dates)*

**Example Response (Success: `200 OK` - Live Transaction)**

```json
{
  "insuranceActivated": true,
  "covered": 50,
  "totalFee": 8,
  "totalFeeBeforeDiscount": 10,
  "baseFee": 4,
  "coverageFee": 6,
  "durationFee": 1,
  "discountCodeSuccessful": true,
  "discountMessage": "25% off applied to order",
  "receipt": "Successfully placed on the RISK Payment Portal.",
  "loanDue": 1722230400,
  "policyEnds": 1722835200,
  "dryRunMode": false,
  "dryRunInsuranceTxId": null,
  "dryRunReceiptContent": null
}
```

**Example Response (Dry Run Success: `200 OK`)**

```json
{
  "insuranceActivated": false,
  "covered": 50,
  "totalFee": 8,
  "totalFeeBeforeDiscount": 10,
  "baseFee": 4,
  "coverageFee": 6,
  "durationFee": 1,
  "discountCodeSuccessful": true,
  "discountMessage": "25% off applied to order",
  "receipt": "no receipt in dryRun mode",
  "loanDue": 1722230400,
  "policyEnds": 1722835200,
  "dryRunMode": true,
  "dryRunInsuranceTxId": "simulated-TXN-ID-234567"
  // dryRunReceiptContent is omitted from the response
}
```

**Error Responses**

- `400 Bad Request`:
    - `Request must signify 'creditcard: true'`
    - `Missing required parameter: 'borrowerUsername' or 'borrowerId'.`
    - `Please provide either 'borrowerUsername' or 'borrowerId', but not both.`
    - `Missing required parameter: 'lenderUsername' or 'lenderId'.`
    - `Please provide either 'lenderUsername' or 'lenderId', but not both.`
    - `Missing required parameters: amount, policy, loanDue`
    - `Invalid policy value. Must be C25, C50, C75, or C100.`
    - `Loan amount must be greater than zero.`
    - `Loan due date must be a valid future date (Unix timestamp).`
- `401 Unauthorized`:
    - `API key is required for non-dryRun requests.`
- `500 Internal Server Error`:
    - `Failed to calculate insurance details.` (e.g., borrower/lender not found, or an issue with the internal fee calculation.)
    - `Failed to pay insurance fee: [Manifold API error]` (An error occurred while attempting to pay the insurance bounty to the RISK Payment Portal, only for non-dryRun requests.)
    - Server error: [General system error]

### **Data Model (interface)**

```tsx
export interface CreditInsuranceResponse {
  insuranceActivated: boolean; // Will be `true` for live transactions, `false` for dry runs.
  covered: number;
  totalFee: number; // This is the final fee (after discount)
  totalFeeBeforeDiscount?: number; // The total insurance fee before any discounts were applied
  baseFee: number;
  coverageFee: number;
  durationFee: number;
  discountCodeSuccessful: boolean;
  discountMessage: string;
  receipt: string; // Describes the outcome of posting the receipt comment
  loanDue: number; // Original loan due date (Unix timestamp)
  policyEnds: number; // Policy end date (Unix timestamp)
  dryRunMode?: boolean; // Indicates if the response is from a dry run
  dryRunInsuranceTxId?: string; // Placeholder for simulated transaction ID in dry run
  // dryRunReceiptContent is omitted (undefined) for dry runs, present for live transactions
}
```

---

## Deprecated Endpoints

The following endpoints are deprecated and will be removed in a future version. Please migrate to the new endpoints listed above.

### GET /api/v0/score

> **DEPRECATED:** This endpoint will be removed in a future version. Please use the new, more comprehensive `GET /api/v0/credit-score` endpoint.

**Purpose**

To calculate and retrieve a user's current credit score (MMR) and associated risk base fee based on their Manifold Markets activity and portfolio.

### Usage

**Request**`GET` requests are made by appending a `username` query parameter to the endpoint URL.

`GET https://risk.markets/api/v0/score?username={username}`

**Parameters**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | `string` | `Yes` | The Manifold Markets username of the user whose score is to be retrieved. |

### **Example GET Request**

`curl "https://risk.markets/api/v0/score?username=RISKBOT"`

**Example Response (Success: `200 OK`)**

```json
{
  "username": "RISKBOT",
  "creditScore": 827,
  "riskBaseFee": 0.03,
  "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocKaN9-RDIt18AYUbA3im5d3HcSLt8JI2MZ81Ep8t_HY=s96-c",
  "userExists": true,
  "fetchSuccess": true,
  "latestRank": 5,
  "outstandingDebtImpact": -1024,
  "calculatedProfit": 30082.3079871295,
  "balance": 18188.9684821406,
  "rawMMR": 16931.1670463976,
  "historicalDataSaved": false,
  "userId": "6QIP88QnoqcYeePMrbTojs42JOM2",
  "userDeleted": false
}
```

**Error Responses**

- `400 Bad Request`:
    - `Username missing or too short`
- `200 OK` (User Not Found / Deleted):
    - Returns a `200 OK` status with `userExists: false` and `creditScore: 0` if the username is not found or the user is deleted on Manifold Markets.
    - Example:
        
        ```json
        {
          "username": "NonExistentUser123",
          "creditScore": 0,
          "riskBaseFee": 0,
          "avatarUrl": null,
          "userExists": false,
          "fetchSuccess": true,
          "historicalDataSaved": false,
          "userDeleted": false
        }
        ```
        
- `500 Internal Server Error`:
    - `Internal server error processing data for [username]` (for unexpected server-side issues or Manifold API fetch failures).

### Data Model (interface)

```tsx
export interface CreditScoreOutput {
  username: string;
  creditScore: number;
  riskBaseFee: number;
  avatarUrl: string | null;
  userExists: boolean;
  fetchSuccess: boolean;
  latestRank: number | null;
  outstandingDebtImpact: number;
  calculatedProfit: number;
  balance: number;
  rawMMR: number;
  historicalDataSaved: boolean;
  userId: string;
  userDeleted: boolean;
}
```

### GET /api/v0/score/{username}/lite

> **DEPRECATED:** This endpoint will be removed in a future version. Please use the new, more comprehensive `GET /api/v0/credit-score` endpoint.

**Purpose**

To retrieve a user's credit score and basic identification data with a lightweight response.

### Usage

**Request**`GET` requests are made by including the username directly in the path. 

`GET https://risk.markets/api/v0/score/{username}/lite`

**Parameters**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | `string` | `Yes` | The Manifold Markets username of the user whose lite score is to be retrieved. |

### **Example GET Request**

`curl "https://risk.markets/api/v0/score/RISKBOT/lite"`

**Example Response (Success: `200 OK`)**

```json
{
  "username": "RISKBOT",
  "creditScore": 827,
  "userId": "6QIP88QnoqcYeePMrbTojs42JOM2",
  "userDeleted": false
}
```

**Error Responses**

- `400 Bad Request`:
    - `Username missing or too short`
- `200 OK` (User Not Found):
    - Returns a `200 OK` status with `creditScore: 0`, `userId: null`, and `userDeleted` indicating the user's status if they are not found or deleted on Manifold Markets.
    - Example (User Not Found):
        
        ```json
        {
          "username": "NonExistentUser123",
          "creditScore": 0,
          "userId": null,
          "userDeleted": false
        }
        ```
        
    - Example (User Found but Deleted):
        
        ```json
        {
          "username": "DeletedUser",
          "creditScore": 0,
          "userId": "someDeletedUserId",
          "userDeleted": true
        }
        ```
        
- `500 Internal Server Error`:
    - `Internal server error: Could not process user data` (for issues fetching Manifold API data for the user).
    - `Internal server error processing lite score for [username]` (for unexpected server-side issues).

### Data Model (interface)

(This endpoint uses a subset of `CreditScoreOutput` for its response.)

```tsx
export interface LiteCreditScoreOutput {
  username: string;
  creditScore: number;
  userId: string;
  userDeleted: boolean;
}
```

### GET /api/v0/insurance

> **DEPRECATED:** This endpoint will be removed in a future version. For fee calculation, please use the new `POST /api/v0/insurance/quote` endpoint.

**Purpose**

To calculate the Manifold Risk insurance fee and provide detailed breakdowns of all associated costs based on loan parameters, borrower's credit score, and selected coverage. This endpoint is purely for calculation and does not perform any transactions.

### Usage

**Request**`GET` requests are made by appending query parameters to the endpoint URL.

`GET https://risk.markets/api/v0/insurance?borrowerUsername={...}&lenderUsername={...}&loanAmount={...}&coverage={...}&dueDate={...}[&partnerCode={...}][&lenderFee={...}]`

**Parameters**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `borrowerUsername` | `string` | `Yes` | The Manifold Markets username of the individual receiving the loan. The API will fetch their credit score to determine the risk fee. |
| `lenderUsername` | `string` | `Yes` | Your Manifold Markets username (the individual initiating the loan). Used for receipt generation and validation. |
| `loanAmount` | `number` | `Yes` | The amount of Mana (M) being loaned to the borrower. Must be greater than 0. |
| `coverage` | `number` | `Yes` | The percentage of the loan that will be insured by RISK. Valid values are `25`, `50`, `75`, or `100`. |
| `dueDate` | `string` | `Yes` | The date the loan is due, in `YYYY-MM-DD` format. This date must be in the future, otherwise a `400` error will be returned. Used to calculate the duration fee. |
| `partnerCode` | `string` | `No` | An optional partner discount code. If a valid code (configured in the `PARTNER_CODES` environment variable) is provided, a 25% discount will be applied to the total insurance fee. |
| `lenderFee` | `number` | `No` | An optional fee for the lender. If the value is less than 100, it is interpreted as a percentage of the `loanAmount`. If the value is 100 or greater, it is interpreted as a flat Mana amount. This fee is included in the Managram message (if applicable) and the total amount due back to the lender. |

### **Example GET Requests**

1. Basic Calculation:
(Calculate insurance for a M1000 loan to `@RISKBOT`, from `@Bob`, 50% coverage, due in a year.)
`curl "https://risk.markets/api/v0/insurance?borrowerUsername=RISKBOT&lenderUsername=Bob&loanAmount=1000&coverage=50&dueDate=2026-06-27"`
2. With Partner Code and Lender Fee (as Percentage):
(Same as above, but with a partner discount code `RISK25` and a 5% lender fee.)
`curl "https://risk.markets/api/v0/insurance?borrowerUsername=RISKBOT&lenderUsername=Bob&loanAmount=1000&coverage=50&dueDate=2026-06-27&partnerCode=RISK25&lenderFee=5"`

**Example Response (Success: `200 OK`)**

```json
{
  "success": true,
  "borrowerProfile": {
    "username": "RISKBOT",
    "userId": "SOME_BORROWER_USER_ID",
    "creditScore": 713,
    "riskBaseFee": 0.05,
    "avatarUrl": "https://example.com/RISKBOT_avatar.jpg",
    "userExists": true,
    "userDeleted": false
  },
  "lenderProfile": {
    "username": "Bob",
    "userId": "SOME_LENDER_USER_ID",
    "userExists": true,
    "userDeleted": false
  },
  "feeDetails": {
    "riskFee": 50,
    "coverageFee": 50,
    "durationFee": 100,
    "totalInitialFee": 200,
    "discountApplied": true,
    "discountAmount": 50,
    "finalFee": 150
  },
  "lenderFeeMana": 50,
  "loanAmount": 1000,
  "coverage": 50,
  "dueDate": "2026-06-27"
}
```

**Error Responses**

- `400 Bad Request`:
    - `Missing required parameters: borrowerUsername, lenderUsername, loanAmount, coverage, dueDate`
    - `Invalid number format for loanAmount or coverage`
    - `Coverage must be one of 25, 50, 75, 100`
    - `Due date must be in the future`
- `500 Internal Server Error`:
    - `Server error: Failed to fetch portfolio for 'borrowerUsername'.` (If Manifold API fetch fails)
    - `Calculation failed`
    - `Borrower not found or is deleted`
    - `Lender not found or is deleted`

### Data Model (interface)

```tsx
export interface InsuranceCalculationResult {
  success: boolean;
  error?: string;
  borrowerProfile?: {
    username: string;
    userId: string;
    creditScore: number;
    riskBaseFee: number;
    avatarUrl: string | null;
    userExists: boolean;
    userDeleted: boolean;
  };
  lenderProfile?: {
    username: string;
    userId: string;
    userExists: boolean;
    userDeleted: boolean;
  };
  feeDetails?: {
    riskFee: number;
    coverageFee: number;
    durationFee: number;
    totalInitialFee: number;
    discountApplied: boolean;
    discountAmount: number;
    finalFee: number;
  };
  lenderFeeMana?: number;
  loanAmount?: number;
  coverage?: number;
  dueDate?: string;
}
```

### POST /api/v0/insurance

> **DEPRECATED:** This endpoint will be removed in a future version. For executing transactions, please use the new `POST /api/v0/insurance/execute` endpoint.

**Purpose**

To execute the actual loan transaction and simultaneously pay the insurance fee to the RISK Payment Portal. The loan can be disbursed either directly to the borrower's Manifold account or by awarding a bounty on a specified institution's market. This endpoint also supports a `dryRun` mode for testing without executing actual transactions.

### Usage

**Request**`POST` requests send a JSON body to the endpoint URL.

`POST https://risk.markets/api/v0/insurance`

**Parameters (JSON Request Body)**

| **Parameter** | **Type** | **Required** | **Description** |
| --- | --- | --- | --- |
| `apiKey` | `string` | `Conditional` | Your Manifold Markets API Key. **Required for live transactions; optional if `dryRun` is `true`.** |
| `borrowerUsername` | `string` | `Conditional` | The Manifold Markets username of the individual receiving the loan. Either `borrowerUsername` or `borrowerId` is required. Cannot provide both. |
| `borrowerId` | `string` | `Conditional` | The Manifold Markets user ID of the individual receiving the loan. Either `borrowerUsername` or `borrowerId` is required. Cannot provide both. |
| `lenderUsername` | `string` | `Conditional` | Your Manifold Markets username (the individual initiating the loan). Either `lenderUsername` or `lenderId` is required. Cannot provide both. |
| `lenderId` | `string` | `Conditional` | Your Manifold Markets user ID (the individual initiating the loan). Either `lenderUsername` or `lenderId` is required. Cannot provide both. |
| `loanAmount` | `number` | `Yes` | The amount of Mana (M) being loaned. |
| `coverage` | `number` | `Yes` | The percentage of the loan covered by insurance (25, 50, 75, or 100). |
| `dueDate` | `string` | `Yes` | The loan due date in `YYYY-MM-DD` format. |
| `partnerCode` | `string` | `No` | An optional partner discount code. If a valid code (configured in the `PARTNER_CODES` environment variable) is provided, a 25% discount will be applied to the total insurance fee. |
| `lenderFee` | `number` | `No` | The lender's fee, either as a percentage (value < 100) or flat Mana amount (value M100). This fee is included in the Managram message (if applicable) and the total amount due back to the lệnder. |
| `managramMessage` | `string` | `No` | An optional custom message (max 100 characters) to be included with the loan managram. If omitted, a default message will be generated. This is only applicable for direct managram loans (when `institution` is not provided). |
| `institution` | `string` | `No` | Specifies an institution for the loan disbursement. If provided, the loan will be awarded as a bounty on the institution's market. Valid values: `"IMF"`, `"BANK"`, `"RISK"`, `"OFFSHORE"`. If this parameter is provided, `commentId` is also required (unless `dryRun` is `true`). If omitted, the loan will be sent directly via managram. |
| `commentId` | `string` | `Conditional` | The ID of the specific comment on the `institution`'s market to which the loan bounty will be awarded. **Required if `institution` is provided and `dryRun` is `false`.** |
| `dryRun` | `boolean` | `No` | If `true`, the endpoint will perform all calculations, but **will not execute any actual Manifold Markets transactions** (no mana transferred, no bounties awarded, no comments posted). The `success` field will be `true`, `message` will indicate a dry run, and transaction/receipt IDs will be simulated. Useful for testing and previewing fees. Defaults to `false`. |

**Important Note on Fees:** The API re-calculates all fees server-side based on the provided parameters. It does not trust any fee amounts sent from the client in the POST request to prevent tampering.

**Loan Disbursement Methods:**

1. **Institutional Funding** (if `institution` and `commentId` are provided):
    - The loan amount will be awarded as a bounty on the Manifold market associated with the specified `institution`.
    - The `commentId` specifies which comment on that market the bounty will be awarded to.
2. **Direct Managram** (if `institution` and `commentId` are omitted):
    - The loan amount will be sent directly to the borrower's Manifold account as a managram.

**Insurance Fee Payment:** In both scenarios, the calculated insurance fee will always be paid to the RISK Payment Portal (`INSURANCE_MARKET_ID: "QEytQ5ch0P"`) as a bounty.

### **Example POST Requests (cURL)**

```bash
# Example 1: Direct Managram Loan (No Institution, Live Transaction - Using Username)
# (Loan M500 directly to @RISKBOT, from @Bob, with 100% coverage, M25 lender fee.)
curl -X POST "https://risk.markets/api/v0/insurance" \
-H "Content-Type: application/json" \
-d '{
  "apiKey": "YOUR_MANIFOLD_API_KEY",
  "borrowerUsername": "RISKBOT",
  "lenderUsername": "Bob",
  "loanAmount": 500,
  "coverage": 100,
  "dueDate": "2026-07-27",
  "lenderFee": 25,
  "managramMessage": "Your direct loan from Bob."
}'

# Example 2: Direct Managram Loan (No Institution, Live Transaction - Using User ID)
# (Loan M500 directly to @RISKBOT, from @Bob, with 100% coverage, M25 lender fee.)
curl -X POST "https://risk.markets/api/v0/insurance" \
-H "Content-Type: application/json" \
-d '{
  "apiKey": "YOUR_MANIFOLD_API_KEY",
  "borrowerId": "SOME_BORROWER_USER_ID",
  "lenderId": "SOME_LENDER_USER_ID",
  "loanAmount": 500,
  "coverage": 100,
  "dueDate": "2026-07-27",
  "lenderFee": 25,
  "managramMessage": "Your direct loan from Bob."
}'

# Example 3: Institutional Loan (Via "RISK" Market, Live Transaction - Using Username)
# (Loan M1000 via the RISK market, awarding bounty to a specific comment,
# with 75% coverage and a partner discount.)
curl -X POST "https://risk.markets/api/v0/insurance" \
-H "Content-Type: application/json" \
-d '{
  "apiKey": "YOUR_MANIFOLD_API_KEY",
  "borrowerUsername": "RISKBOT",
  "lenderUsername": "Bob",
  "loanAmount": 1000,
  "coverage": 75,
  "dueDate": "2026-09-01",
  "partnerCode": "RISK25",
  "institution": "RISK",
  "commentId": "some-valid-comment-id-on-risk-market"
}'

# Example 4: Dry Run (No actual transaction, API key can be dummy or omitted - Using User ID)
# (Simulate a M500 loan via direct managram with 100% coverage.)
curl -X POST "https://risk.markets/api/v0/insurance" \
-H "Content-Type: application/json" \
-d '{
  "apiKey": "ANY_API_KEY_OR_LEAVE_EMPTY_FOR_DRYRUN",
  "borrowerId": "SOME_BORROWER_USER_ID",
  "lenderId": "SOME_LENDER_USER_ID",
  "loanAmount": 500,
  "coverage": 100,
  "dueDate": "2027-01-15",
  "dryRun": true
}'
```

**Example POST Response (Success: `200 OK`)**

*(Responses vary based on whether `dryRun` is `true` or `false`)*

**Response for a Live Transaction (`dryRun: false`):**

```json
{
  "success": true,
  "message": "Loan and insurance fee processed successfully.",
  "loanTransactionId": "loan_txn_SOME_UUID",
  "insuranceTransactionId": "ins_txn_SOME_OTHER_UUID",
  "receiptCommentId": "comment_SOME_THIRD_UUID",
  "marketUrl": "https://manifold.markets/market/QEytQ5ch0P"
}
```

**Response for a Dry Run (`dryRun: true`):**

```json
{
  "success": true,
  "message": "Dry run successful. No transactions were executed.",
  "dryRunMode": true,
  "dryRunLoanTxId": "simulated-loan-TXN-ID-123456",
  "dryRunInsuranceTxId": "simulated-ins-TXN-ID-789012"
  // receiptCommentId and marketUrl are omitted
}
```

**Error Responses**

- `400 Bad Request`:
    - `Missing required parameter: 'borrowerUsername' or 'borrowerId'.`
    - `Please provide either 'borrowerUsername' or 'borrowerId', but not both.`
    - `Missing required parameter: 'lenderUsername' or 'lenderId'.`
    - `Please provide either 'lenderUsername' or 'lenderId', but not both.`
    - `Missing required parameters in POST body (loanAmount, coverage, dueDate)`
    - `Invalid institution specified`
    - `Comment ID is required for institutional funding in non-dryRun mode`
    - Any validation errors from the GET calculation step (e.g., `Due date must be in the future`).
- `401 Unauthorized`:
    - `API key is required for non-dryRun POST requests`
- `500 Internal Server Error`:
    - `Server error: Failed to fetch portfolio for 'borrowerUsername'.` (If Manifold API fetch fails)
    - `Failed to pay insurance fee: [Manifold API error]`
    - `Failed to process loan transaction: [Manifold API error]`
    - `Failed to validate loan details before execution` (If the internal `calculateInsuranceDetails` call fails)
    - `Server error: [General system error]`

### **Data Model (interface)**

```tsx
export interface TransactionExecutionResult {
  success: boolean;
  message?: string;
  error?: string;
  loanTransactionId?: string; // Present only for live transactions
  insuranceTransactionId?: string; // Present only for live transactions
  receiptCommentId?: string; // Present only for live transactions
  marketUrl?: string; // Present only for live transactions
  dryRunMode?: boolean; // Indicates if the response is from a dry run
  dryRunLoanTxId?: string; // Placeholder for simulated loan Tx ID in dry run
  dryRunInsuranceTxId?: string; // Placeholder for simulated insurance Tx ID in dry run
}

```

---

## Deprecated Endpoints

The following endpoints are deprecated and will be removed in a future version. Please migrate to the new endpoints listed above.

### GET /api/v0/score

> **DEPRECATED:** This endpoint will be removed in a future version. Please use the new, more comprehensive `GET /api/v0/credit-score` endpoint.

**Purpose**

To calculate and retrieve a user's current credit score (MMR) and associated risk base fee based on their Manifold Markets activity and portfolio.

### Usage

**Request**`GET` requests are made by appending a `username` query parameter to the endpoint URL.

`GET https://risk.markets/api/v0/score?username={username}`

**Parameters**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | `string` | `Yes` | The Manifold Markets username of the user whose score is to be retrieved. |

### **Example GET Request**

`curl "https://risk.markets/api/v0/score?username=RISKBOT"`

**Example Response (Success: `200 OK`)**

```json
{
  "username": "RISKBOT",
  "creditScore": 827,
  "riskBaseFee": 0.03,
  "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocKaN9-RDIt18AYUbA3im5d3HcSLt8JI2MZ81Ep8t_HY=s96-c",
  "userExists": true,
  "fetchSuccess": true,
  "latestRank": 5,
  "outstandingDebtImpact": -1024,
  "calculatedProfit": 30082.3079871295,
  "balance": 18188.9684821406,
  "rawMMR": 16931.1670463976,
  "historicalDataSaved": false,
  "userId": "6QIP88QnoqcYeePMrbTojs42JOM2",
  "userDeleted": false
}
```

**Error Responses**

- `400 Bad Request`:
    - `Username missing or too short`
- `200 OK` (User Not Found / Deleted):
    - Returns a `200 OK` status with `userExists: false` and `creditScore: 0` if the username is not found or the user is deleted on Manifold Markets.
    - Example:
        
        ```json
        {
          "username": "NonExistentUser123",
          "creditScore": 0,
          "riskBaseFee": 0,
          "avatarUrl": null,
          "userExists": false,
          "fetchSuccess": true,
          "historicalDataSaved": false,
          "userDeleted": false
        }
        ```
        
- `500 Internal Server Error`:
    - `Internal server error processing data for [username]` (for unexpected server-side issues or Manifold API fetch failures).

### Data Model (interface)

```tsx
export interface CreditScoreOutput {
  username: string;
  creditScore: number;
  riskBaseFee: number;
  avatarUrl: string | null;
  userExists: boolean;
  fetchSuccess: boolean;
  latestRank: number | null;
  outstandingDebtImpact: number;
  calculatedProfit: number;
  balance: number;
  rawMMR: number;
  historicalDataSaved: boolean;
  userId: string;
  userDeleted: boolean;
}
```

### GET /api/v0/score/{username}/lite

> **DEPRECATED:** This endpoint will be removed in a future version. Please use the new, more comprehensive `GET /api/v0/credit-score` endpoint.

**Purpose**

To retrieve a user's credit score and basic identification data with a lightweight response.

### Usage

**Request**`GET` requests are made by including the username directly in the path. 

`GET https://risk.markets/api/v0/score/{username}/lite`

**Parameters**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | `string` | `Yes` | The Manifold Markets username of the user whose lite score is to be retrieved. |

### **Example GET Request**

`curl "https://risk.markets/api/v0/score/RISKBOT/lite"`

**Example Response (Success: `200 OK`)**

```json
{
  "username": "RISKBOT",
  "creditScore": 827,
  "userId": "6QIP88QnoqcYeePMrbTojs42JOM2",
  "userDeleted": false
}
```

**Error Responses**

- `400 Bad Request`:
    - `Username missing or too short`
- `200 OK` (User Not Found):
    - Returns a `200 OK` status with `creditScore: 0`, `userId: null`, and `userDeleted` indicating the user's status if they are not found or deleted on Manifold Markets.
    - Example (User Not Found):
        
        ```json
        {
          "username": "NonExistentUser123",
          "creditScore": 0,
          "userId": null,
          "userDeleted": false
        }
        ```
        
    - Example (User Found but Deleted):
        
        ```json
        {
          "username": "DeletedUser",
          "creditScore": 0,
          "userId": "someDeletedUserId",
          "userDeleted": true
        }
        ```
        
- `500 Internal Server Error`:
    - `Internal server error: Could not process user data` (for issues fetching Manifold API data for the user).
    - `Internal server error processing lite score for [username]` (for unexpected server-side issues).

### Data Model (interface)

(This endpoint uses a subset of `CreditScoreOutput` for its response.)

```tsx
export interface LiteCreditScoreOutput {
  username: string;
  creditScore: number;
  userId: string;
  userDeleted: boolean;
}
```

### GET /api/v0/insurance

> **DEPRECATED:** This endpoint will be removed in a future version. For fee calculation, please use the new `POST /api/v0/insurance/quote` endpoint.

**Purpose**

To calculate the Manifold Risk insurance fee and provide detailed breakdowns of all associated costs based on loan parameters, borrower's credit score, and selected coverage. This endpoint is purely for calculation and does not perform any transactions.

### Usage

**Request**`GET` requests are made by appending query parameters to the endpoint URL.

`GET https://risk.markets/api/v0/insurance?borrowerUsername={...}&lenderUsername={...}&loanAmount={...}&coverage={...}&dueDate={...}[&partnerCode={...}][&lenderFee={...}]`

**Parameters**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `borrowerUsername` | `string` | `Yes` | The Manifold Markets username of the individual receiving the loan. The API will fetch their credit score to determine the risk fee. |
| `lenderUsername` | `string` | `Yes` | Your Manifold Markets username (the individual initiating the loan). Used for receipt generation and validation. |
| `loanAmount` | `number` | `Yes` | The amount of Mana (M) being loaned to the borrower. Must be greater than 0. |
| `coverage` | `number` | `Yes` | The percentage of the loan that will be insured by RISK. Valid values are `25`, `50`, `75`, or `100`. |
| `dueDate` | `string` | `Yes` | The date the loan is due, in `YYYY-MM-DD` format. This date must be in the future, otherwise a `400` error will be returned. Used to calculate the duration fee. |
| `partnerCode` | `string` | `No` | An optional partner discount code. If a valid code (configured in the `PARTNER_CODES` environment variable) is provided, a 25% discount will be applied to the total insurance fee. |
| `lenderFee` | `number` | `No` | An optional fee for the lender. If the value is less than 100, it is interpreted as a percentage of the `loanAmount`. If the value is 100 or greater, it is interpreted as a flat Mana amount. This fee is included in the Managram message (if applicable) and the total amount due back to the lender. |

### **Example GET Requests**

1. Basic Calculation:
(Calculate insurance for a M1000 loan to `@RISKBOT`, from `@Bob`, 50% coverage, due in a year.)
`curl "https://risk.markets/api/v0/insurance?borrowerUsername=RISKBOT&lenderUsername=Bob&loanAmount=1000&coverage=50&dueDate=2026-06-27"`
2. With Partner Code and Lender Fee (as Percentage):
(Same as above, but with a partner discount code `RISK25` and a 5% lender fee.)
`curl "https://risk.markets/api/v0/insurance?borrowerUsername=RISKBOT&lenderUsername=Bob&loanAmount=1000&coverage=50&dueDate=2026-06-27&partnerCode=RISK25&lenderFee=5"`

**Example Response (Success: `200 OK`)**

```json
{
  "success": true,
  "borrowerProfile": {
    "username": "RISKBOT",
    "userId": "SOME_BORROWER_USER_ID",
    "creditScore": 713,
    "riskBaseFee": 0.05,
    "avatarUrl": "https://example.com/RISKBOT_avatar.jpg",
    "userExists": true,
    "userDeleted": false
  },
  "lenderProfile": {
    "username": "Bob",
    "userId": "SOME_LENDER_USER_ID",
    "userExists": true,
    "userDeleted": false
  },
  "feeDetails": {
    "riskFee": 50,
    "coverageFee": 50,
    "durationFee": 100,
    "totalInitialFee": 200,
    "discountApplied": true,
    "discountAmount": 50,
    "finalFee": 150
  },
  "lenderFeeMana": 50,
  "loanAmount": 1000,
  "coverage": 50,
  "dueDate": "2026-06-27"
}
```

**Error Responses**

- `400 Bad Request`:
    - `Missing required parameters: borrowerUsername, lenderUsername, loanAmount, coverage, dueDate`
    - `Invalid number format for loanAmount or coverage`
    - `Coverage must be one of 25, 50, 75, 100`
    - `Due date must be in the future`
- `500 Internal Server Error`:
    - `Server error: Failed to fetch portfolio for 'borrowerUsername'.` (If Manifold API fetch fails)
    - `Calculation failed`
    - `Borrower not found or is deleted`
    - `Lender not found or is deleted`

### Data Model (interface)

```tsx
export interface InsuranceCalculationResult {
  success: boolean;
  error?: string;
  borrowerProfile?: {
    username: string;
    userId: string;
    creditScore: number;
    riskBaseFee: number;
    avatarUrl: string | null;
    userExists: boolean;
    userDeleted: boolean;
  };
  lenderProfile?: {
    username: string;
    userId: string;
    userExists: boolean;
    userDeleted: boolean;
  };
  feeDetails?: {
    riskFee: number;
    coverageFee: number;
    durationFee: number;
    totalInitialFee: number;
    discountApplied: boolean;
    discountAmount: number;
    finalFee: number;
  };
  lenderFeeMana?: number;
  loanAmount?: number;
  coverage?: number;
  dueDate?: string;
}
```

### POST /api/v0/insurance

> **DEPRECATED:** This endpoint will be removed in a future version. For executing transactions, please use the new `POST /api/v0/insurance/execute` endpoint.

**Purpose**

To execute the actual loan transaction and simultaneously pay the insurance fee to the RISK Payment Portal. The loan can be disbursed either directly to the borrower's Manifold account or by awarding a bounty on a specified institution's market. This endpoint also supports a `dryRun` mode for testing without executing actual transactions.

### Usage

**Request**`POST` requests send a JSON body to the endpoint URL.

`POST https://risk.markets/api/v0/insurance`

**Parameters (JSON Request Body)**

| **Parameter** | **Type** | **Required** | **Description** |
| --- | --- | --- | --- |
| `apiKey` | `string` | `Conditional` | Your Manifold Markets API Key. **Required for live transactions; optional if `dryRun` is `true`.** |
| `borrowerUsername` | `string` | `Conditional` | The Manifold Markets username of the individual receiving the loan. Either `borrowerUsername` or `borrowerId` is required. Cannot provide both. |
| `borrowerId` | `string` | `Conditional` | The Manifold Markets user ID of the individual receiving the loan. Either `borrowerUsername` or `borrowerId` is required. Cannot provide both. |
| `lenderUsername` | `string` | `Conditional` | Your Manifold Markets username (the individual initiating the loan). Either `lenderUsername` or `lenderId` is required. Cannot provide both. |
| `lenderId` | `string` | `Conditional` | Your Manifold Markets user ID (the individual initiating the loan). Either `lenderUsername` or `lenderId` is required. Cannot provide both. |
| `loanAmount` | `number` | `Yes` | The amount of Mana (M) being loaned. |
| `coverage` | `number` | `Yes` | The percentage of the loan covered by insurance (25, 50, 75, or 100). |
| `dueDate` | `string` | `Yes` | The loan due date in `YYYY-MM-DD` format. |
| `partnerCode` | `string` | `No` | An optional partner discount code. If a valid code (configured in the `PARTNER_CODES` environment variable) is provided, a 25% discount will be applied to the total insurance fee. |
| `lenderFee` | `number` | `No` | The lender's fee, either as a percentage (value < 100) or flat Mana amount (value M100). This fee is included in the Managram message (if applicable) and the total amount due back to the lender. |
| `managramMessage` | `string` | `No` | An optional custom message (max 100 characters) to be included with the loan managram. If omitted, a default message will be generated. This is only applicable for direct managram loans (when `institution` is not provided). |
| `institution` | `string` | `No` | Specifies an institution for the loan disbursement. If provided, the loan will be awarded as a bounty on the institution's market. Valid values: `"IMF"`, `"BANK"`, `"RISK"`, `"OFFSHORE"`. If this parameter is provided, `commentId` is also required (unless `dryRun` is `true`). If omitted, the loan will be sent directly via managram. |
| `commentId` | `string` | `Conditional` | The ID of the specific comment on the `institution`'s market to which the loan bounty will be awarded. **Required if `institution` is provided and `dryRun` is `false`.** |
| `dryRun` | `boolean` | `No` | If `true`, the endpoint will perform all calculations, but **will not execute any actual Manifold Markets transactions** (no mana transferred, no bounties awarded, no comments posted). The `success` field will be `true`, `message` will indicate a dry run, and transaction/receipt IDs will be simulated. Useful for testing and previewing fees. Defaults to `false`. |

**Important Note on Fees:** The API re-calculates all fees server-side based on the provided parameters. It does not trust any fee amounts sent from the client in the POST request to prevent tampering.

**Loan Disbursement Methods:**

1. **Institutional Funding** (if `institution` and `commentId` are provided):
    - The loan amount will be awarded as a bounty on the Manifold market associated with the specified `institution`.
    - The `commentId` specifies which comment on that market the bounty will be awarded to.
2. **Direct Managram** (if `institution` and `commentId` are omitted):
    - The loan amount will be sent directly to the borrower's Manifold account as a managram.

**Insurance Fee Payment:** In both scenarios, the calculated insurance fee will always be paid to the RISK Payment Portal (`INSURANCE_MARKET_ID: "QEytQ5ch0P"`) as a bounty.

### **Example POST Requests (cURL)**

```bash
# Example 1: Direct Managram Loan (No Institution, Live Transaction - Using Username)
# (Loan M500 directly to @RISKBOT, from @Bob, with 100% coverage, M25 lender fee.)
curl -X POST "https://risk.markets/api/v0/insurance" \
-H "Content-Type: application/json" \
-d '{
  "apiKey": "YOUR_MANIFOLD_API_KEY",
  "borrowerUsername": "RISKBOT",
  "lenderUsername": "Bob",
  "loanAmount": 500,
  "coverage": 100,
  "dueDate": "2026-07-27",
  "lenderFee": 25,
  "managramMessage": "Your direct loan from Bob."
}'

# Example 2: Direct Managram Loan (No Institution, Live Transaction - Using User ID)
# (Loan M500 directly to @RISKBOT, from @Bob, with 100% coverage, M25 lender fee.)
curl -X POST "https://risk.markets/api/v0/insurance" \
-H "Content-Type: application/json" \
-d '{
  "apiKey": "YOUR_MANIFOLD_API_KEY",
  "borrowerId": "SOME_BORROWER_USER_ID",
  "lenderId": "SOME_LENDER_USER_ID",
  "loanAmount": 500,
  "coverage": 100,
  "dueDate": "2026-07-27",
  "lenderFee": 25,
  "managramMessage": "Your direct loan from Bob."
}'

# Example 3: Institutional Loan (Via "RISK" Market, Live Transaction - Using Username)
# (Loan M1000 via the RISK market, awarding bounty to a specific comment,
# with 75% coverage and a partner discount.)
curl -X POST "https://risk.markets/api/v0/insurance" \
-H "Content-Type: application/json" \
-d '{
  "apiKey": "YOUR_MANIFOLD_API_KEY",
  "borrowerUsername": "RISKBOT",
  "lenderUsername": "Bob",
  "loanAmount": 1000,
  "coverage": 75,
  "dueDate": "2026-09-01",
  "partnerCode": "RISK25",
  "institution": "RISK",
  "commentId": "some-valid-comment-id-on-risk-market"
}'

# Example 4: Dry Run (No actual transaction, API key can be dummy or omitted - Using User ID)
# (Simulate a M500 loan via direct managram with 100% coverage.)
curl -X POST "https://risk.markets/api/v0/insurance" \
-H "Content-Type: application/json" \
-d '{
  "apiKey": "ANY_API_KEY_OR_LEAVE_EMPTY_FOR_DRYRUN",
  "borrowerId": "SOME_BORROWER_USER_ID",
  "lenderId": "SOME_LENDER_USER_ID",
  "loanAmount": 500,
  "coverage": 100,
  "dueDate": "2027-01-15",
  "dryRun": true
}'
```

**Example POST Response (Success: `200 OK`)**

*(Responses vary based on whether `dryRun` is `true` or `false`)*

**Response for a Live Transaction (`dryRun: false`):**

```json
{
  "success": true,
  "message": "Loan and insurance fee processed successfully.",
  "loanTransactionId": "loan_txn_SOME_UUID",
  "insuranceTransactionId": "ins_txn_SOME_OTHER_UUID",
  "receiptCommentId": "comment_SOME_THIRD_UUID",
  "marketUrl": "https://manifold.markets/market/QEytQ5ch0P"
}
```

**Response for a Dry Run (`dryRun: true`):**

```json
{
  "success": true,
  "message": "Dry run successful. No transactions were executed.",
  "dryRunMode": true,
  "dryRunLoanTxId": "simulated-loan-TXN-ID-123456",
  "dryRunInsuranceTxId": "simulated-ins-TXN-ID-789012"
  // receiptCommentId and marketUrl are omitted
}
```

**Error Responses**

- `400 Bad Request`:
    - `Missing required parameter: 'borrowerUsername' or 'borrowerId'.`
    - `Please provide either 'borrowerUsername' or 'borrowerId', but not both.`
    - `Missing required parameter: 'lenderUsername' or 'lenderId'.`
    - `Please provide either 'lenderUsername' or 'lenderId', but not both.`
    - `Missing required parameters in POST body (loanAmount, coverage, dueDate)`
    - `Invalid institution specified`
    - `Comment ID is required for institutional funding in non-dryRun mode`
    - Any validation errors from the GET calculation step (e.g., `Due date must be in the future`).
- `401 Unauthorized`:
    - `API key is required for non-dryRun POST requests`
- `500 Internal Server Error`:
    - `Server error: Failed to fetch portfolio for 'borrowerUsername'.` (If Manifold API fetch fails)
    - `Failed to pay insurance fee: [Manifold API error]`
    - `Failed to process loan transaction: [Manifold API error]`
    - `Failed to validate loan details before execution` (If the internal `calculateInsuranceDetails` call fails)
    - `Server error: [General system error]`

### **Data Model (interface)**

```tsx
export interface TransactionExecutionResult {
  success: boolean;
  message?: string;
  error?: string;
  loanTransactionId?: string; // Present only for live transactions
  insuranceTransactionId?: string; // Present only for live transactions
  receiptCommentId?: string; // Present only for live transactions
  marketUrl?: string; // Present only for live transactions
  dryRunMode?: boolean; // Indicates if the response is from a dry run
  dryRunLoanTxId?: string; // Placeholder for simulated loan Tx ID in dry run
  dryRunInsuranceTxId?: string; // Placeholder for simulated insurance Tx ID in dry run
}

```