# Medrella HealthCare — Payment Gateway Documentation

**Suggested project path:** `docs/payment.md`  
**Gateway:** Razorpay Checkout (Test Mode)

> This documentation describes the Razorpay integration and a separate mock checkout option for UI demos. Mock checkout is not a real payment.

## 1. Payment flow

1. Patient selects doctor, date, slot, and reason.
2. Frontend calls `POST /api/v1/payments/create-order`.
3. Server authenticates the patient and validates booking details.
4. Server checks doctor/slot availability and consultation fee.
5. Server creates a Razorpay order.
6. Server saves the appointment as `pending_payment` and payment as `pending`.
7. Frontend opens Razorpay Checkout.
8. Checkout returns payment details to the frontend.
9. Frontend sends details to the payment verification endpoint.
10. Server verifies the Razorpay signature and updates payment/appointment status.

**Do not trust a frontend success callback alone.** Only mark a payment paid after server-side verification.

## 2. Stack

- Next.js App Router + TypeScript
- Drizzle ORM
- PostgreSQL / Neon
- Better Auth
- Razorpay Node SDK
- Project helpers: `requireAuth`, `requireRole`, `apiSuccess`, `apiError`, `withErrorHandler`

## 3. Environment variables

Add to project-root `.env.local`:

```env
RAZORPAY_KEY_ID=rzp_test_your_generated_key_id
RAZORPAY_KEY_SECRET=your_generated_test_key_secret
```

Replace placeholders with credentials generated in Razorpay Dashboard Test Mode.

### Get test credentials

1. Sign in to Razorpay Dashboard.
2. Switch to **Test Mode**.
3. Open **Account & Settings → API Keys** (dashboard wording can vary).
4. Generate a test key.
5. Copy both Key ID and Key Secret into `.env.local`.

Test keys are account-specific. There are no universal test credentials.

### Security

- Never commit `.env.local` to Git.
- Never expose `RAZORPAY_KEY_SECRET` in frontend code.
- Do not use `NEXT_PUBLIC_` for the secret.
- Do not share the secret in chat, screenshots, or logs.
- Keep Test and Live credentials separate.

Restart Next.js after updating environment variables:

```bash
npm run dev
```

## 4. Razorpay server initialization

Suggested file: `src/lib/razorpay.ts`

```ts
import "server-only";
import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID?.trim();
const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

if (!keyId || !keySecret) {
  throw new Error("Razorpay environment variables are missing");
}

export const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export const RAZORPAY_KEY_ID = keyId;
```

Import this module only from server-side code.

## 5. Create-order API

Suggested route:

`src/app/api/v1/payments/create-order/route.ts`

Responsibilities:

- Authenticate the user and restrict booking to the `patient` role.
- Validate request data using `bookAppointmentSchema`.
- Check that the doctor exists and accepts patients.
- Verify the requested slot is available.
- Check patient booking conflicts.
- Read the consultation fee from the database.
- Convert rupees to paise for Razorpay (₹500 = 50,000 paise).
- Create a Razorpay order.
- Insert the appointment with `pending_payment` status.
- Insert the payment record with `pending` status.
- Return order details to the frontend.

### API response wrapper

The project’s `apiSuccess()` returns:

```json
{
  "success": true,
  "data": {
    "appointmentId": "appointment-id",
    "orderId": "razorpay-order-id",
    "amount": 50000,
    "currency": "INR",
    "keyId": "rzp_test_example"
  }
}
```

The frontend should read `json.data`:

```ts
const json = await orderResponse.json();

if (!orderResponse.ok || !json.success) {
  throw new Error(json.error || "Unable to create payment order");
}

const orderData = json.data;
```

Use `orderData.orderId`, `orderData.amount`, `orderData.currency`, and `orderData.keyId`.

## 6. Frontend Checkout

Use the existing doctor booking page; do not create a duplicate page just for payments.

Add the Razorpay script:

```tsx
import Script from "next/script";
```

Render in the page JSX:

```tsx
<Script
  src="https://checkout.razorpay.com/v1/checkout.js"
  strategy="lazyOnload"
/>
```

Flow:

1. Submit booking details.
2. Call `POST /api/v1/payments/create-order`.
3. Check the response and read `json.data`.
4. Open Razorpay Checkout using the returned order ID, amount, currency, and public Key ID.
5. On Checkout success, send `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature` to the verify API.
6. Show success/navigate to appointments only after server verification.

The Key ID may be used by the frontend; the Key Secret must remain server-side.

## 7. Payment verification

Suggested route:

`src/app/api/v1/payments/verify/route.ts`

The verification endpoint should:

- Require authentication.
- Validate submitted payment fields.
- Verify that the order/payment belongs to the current user's appointment.
- Verify the Razorpay signature on the server using the Key Secret.
- Match the order ID against the stored payment record.
- Update payment status to `paid`.
- Save Razorpay payment ID/signature if schema fields exist.
- Update appointment status to the project’s confirmed/scheduled state.
- Return success only after updates complete.

Consider Razorpay webhooks, idempotency, refunds, failed payments, and reconciliation for production.

## 8. Initial and successful statuses

After order creation:

| Record | Status |
|---|---|
| Appointment | `pending_payment` |
| Payment | `pending` |

After successful server-side verification:

| Record | Status |
|---|---|
| Appointment | Project’s confirmed/scheduled status |
| Payment | `paid` |

Payment cancellation/failure must not mark payment as paid. Define expiry/cancellation rules for pending appointments.

## 9. Slot concurrency

An availability check alone cannot prevent simultaneous requests from racing. Keep a database constraint/index to prevent duplicate doctor/date/start-time bookings, after checking your existing schema/indexes:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_doctor_slot
ON public.appointment (
  doctor_id,
  appointment_date,
  start_time
)
WHERE status <> 'cancelled';
```

This prevents duplicate start times but does not prevent overlapping time ranges. Additional overlap checks may be needed.

Pending appointments may reserve slots. Add an expiry policy so abandoned payments do not block availability indefinitely.

## 10. Razorpay authentication error

Observed error:

```text
Razorpay BAD_REQUEST_ERROR
Authentication failed
POST /api/v1/payments/create-order 500
```

Possible causes:

- Placeholder credentials are still present.
- Key ID and Key Secret are mismatched.
- Test and Live keys are mixed.
- Keys were regenerated but the old secret is still configured.
- Environment variables were changed without restarting Next.js.

Troubleshooting:

1. Generate credentials in Test Mode.
2. Confirm both values are from the same key pair.
3. Check for accidental whitespace.
4. Restart the dev server.
5. Retry order creation.
6. Never expose the Key Secret while debugging.

## 11. UI-only mock checkout

If only a payment-looking interface is needed for a project presentation:

- Build a Medrella-branded mock checkout dialog.
- Show doctor, appointment, and consultation fee.
- Optionally display mock UPI/card/net-banking options.
- Label it **Demo payment — not processed**.
- Do not call it a Razorpay payment.
- Do not mark appointment/payment as paid or confirmed.
- Keep mock mode separate from the real Razorpay API flow.

The create-order API will still fail without valid Razorpay credentials. A mock UI needs a separate demo-only path.

## 12. Testing checklist

### Razorpay Test Mode

- [ ] Generated Test Mode credentials and added them to `.env.local`.
- [ ] `.env.local` is ignored by Git.
- [ ] Restarted the dev server.
- [ ] Patient can select a valid slot.
- [ ] Create-order API returns an order ID.
- [ ] Frontend reads `json.data`.
- [ ] Razorpay Checkout opens.
- [ ] Test payment is completed or cancelled.
- [ ] Frontend calls payment verification after checkout.
- [ ] Backend verifies signature.
- [ ] Payment and appointment status update only after verification.
- [ ] Failed/cancelled payments remain unpaid.
- [ ] Duplicate booking attempts are handled safely.

### Mock demo

- [ ] Mock is clearly labeled as demo-only.
- [ ] No real payment is processed.
- [ ] Mock success does not set payment to `paid`.
- [ ] Mock success does not falsely confirm an appointment.

## 13. Razorpay Test Mode vs mock UI

- **Razorpay Test Mode:** actual Razorpay Checkout interface, simulated payments, requires generated test credentials.
- **Mock Checkout:** custom application UI, works without Razorpay credentials, does not process or verify payments.

Never use mock checkout as a production payment mechanism.
