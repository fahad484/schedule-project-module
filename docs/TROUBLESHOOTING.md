# Troubleshooting Runbook

This guide provides diagnostic procedures and resolutions for common issues encountered during development, testing, migration, and deployment of the Appointment Booking System.

---

## 1. Quick Triage Flowchart

```mermaid
flowchart TD
    Issue["System Issue Encountered"] --> Classify{"Where is the failure?"}
    
    Classify -->|Database / Drizzle| DBCheck["Check DATABASE_URL & SSL mode"]
    Classify -->|Authentication / Cookies| AuthCheck["Check BETTER_AUTH_URL & Secret Length"]
    Classify -->|Build / TypeScript| BuildCheck["Run 'npx tsc --noEmit'"]
    Classify -->|Scheduling / Slots| SchedCheck["Check doctor_availability & time_off"]

    DBCheck --> DBFixed["Append ?sslmode=require<br/>Use pooled connection string"]
    AuthCheck --> AuthFixed["Ensure 32+ char secret<br/>Check SameSite & domain match"]
    BuildCheck --> BuildFixed["Resolve TS strict errors<br/>Verify React 19 types"]
    SchedCheck --> SchedFixed["Check day_of_week enum<br/>Resolve time range conflict"]
```

---

## 2. Database Connection Errors (Neon PostgreSQL)

### Issue 2.1: `DATABASE_URL environment variable is not set`
- **Symptom**: Server crashes immediately on boot with `Error: DATABASE_URL environment variable is not set` originating from [`src/lib/db.ts`](file:///c:/Users/Hp/OneDrive/Apps/appointment-booking/src/lib/db.ts#L6).
- **Cause**: `.env.local` is missing, incorrectly named, or placed in a subdirectory.
- **Resolution**:
  1. Ensure the file is named strictly `.env.local` at the project root (`c:\Users\Hp\OneDrive\Apps\appointment-booking\.env.local`).
  2. Verify that `DATABASE_URL` is uncommented and contains the valid PostgreSQL URI.

---

### Issue 2.2: `SSL connection is required` / `self-signed certificate`
- **Symptom**: Connection fails during Drizzle queries or migration execution with `NeonDbError: SSL connection is required`.
- **Cause**: Neon strictly requires TLS/SSL encryption. The connection string is missing the SSL parameter.
- **Resolution**:
  Ensure `?sslmode=require` is present at the end of `DATABASE_URL`:
  ```ini
  DATABASE_URL=postgresql://user:password@ep-example-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
  ```

---

### Issue 2.3: `Connection pool exhausted` or ETIMEDOUT during High Traffic
- **Symptom**: Database queries stall or timeout during concurrent API requests.
- **Cause**: The application is connecting directly to the PostgreSQL compute engine instead of Neon's connection pooler.
- **Resolution**:
  In your Neon console, switch your connection string to **Pooled connection**. The endpoint host should contain `-pooler`:
  ```text
  ep-patient-hill-123456-pooler.us-east-2.aws.neon.tech
  ```

---

## 3. Authentication & Session Issues (Better Auth)

### Issue 3.1: Session Cookie Not Persisting / Continuous `401 Unauthorized`
- **Symptom**: User logs in successfully, but immediate subsequent requests to `/dashboard` or `/api/v1/appointments` return `401 Unauthorized`.
- **Causes & Fixes**:
  1. **Cross-Origin Mismatch**: If running on `localhost:3000`, ensure `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` are both set to `http://localhost:3000` (not `127.0.0.1:3000`).
  2. **Browser Blocking Third-Party Cookies**: If accessing the app via an iframe or external viewer, browsers may block cookies. Open directly in a standalone browser tab.
  3. **Insecure Cookies on HTTP**: Ensure you are not forcing `secure: true` on cookies while testing over plain `http://localhost:3000`.

---

### Issue 3.2: `BETTER_AUTH_SECRET must be at least 32 characters`
- **Symptom**: Better Auth initialization throws an error indicating the secret is too short or weak.
- **Resolution**:
  Generate a new 32-character key using OpenSSL or Node:
  ```bash
  openssl rand -base64 32
  ```
  Update `BETTER_AUTH_SECRET` in `.env.local` and restart the server.

---

## 4. Drizzle Kit & Migration Problems

### Issue 4.1: `type "user_role" already exists` during `drizzle-kit push`
- **Symptom**: Drizzle push reports an error stating a PostgreSQL enum or index already exists.
- **Cause**: An earlier push partially applied the types, or migrations were run out of order.
- **Resolution**:
  Inspect the database schema in Drizzle Studio:
  ```bash
  npx drizzle-kit studio
  ```
  If schema drift is irrecoverable in development, push with the `--force` flag:
  ```bash
  npx drizzle-kit push --force
  ```

---

### Issue 4.2: Migration Timeout on Serverless Database
- **Symptom**: `npx drizzle-kit push` hangs for over 30 seconds when Neon compute has scaled down to zero.
- **Cause**: Neon auto-suspend feature requires 1-2 seconds to wake up the compute instance.
- **Resolution**:
  Run a simple query first or wait 5 seconds before retrying `npx drizzle-kit push`.

---

## 5. Next.js 16 & TypeScript Build Errors

### Issue 5.1: `Type error: Route Handler export is not a valid Route export`
- **Symptom**: `npm run build` fails on an API route.
- **Cause**: The Route Handler is exporting an unrecognized function name or incorrect signature.
- **Resolution**:
  Next.js App Router route handlers in `src/app/api/.../route.ts` must export uppercase HTTP method functions:
  ```typescript
  export async function GET(request: Request) { ... }
  export async function POST(request: Request) { ... }
  ```

---

### Issue 5.2: `Dynamic server usage: headers() should be awaited`
- **Symptom**: Warning or error when calling `headers()` in Next.js 16.
- **Cause**: In Next.js 15+, `headers()` returns a Promise and must be awaited.
- **Resolution**:
  Ensure all invocations in [`src/lib/server-utils.ts`](file:///c:/Users/Hp/OneDrive/Apps/appointment-booking/src/lib/server-utils.ts#L12) await the headers call:
  ```typescript
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  ```

---

## 6. Appointment Booking & Double-Booking Errors

### Issue 6.1: `409 Conflict: This time slot was just booked by another patient`
- **Symptom**: User receives a 409 conflict error when submitting a booking.
- **Explanation**: This is the intended behavior of the atomic double-booking prevention engine. Another user secured the exact same slot milliseconds earlier.
- **Resolution**: The frontend UI should notify the patient and prompt them to select another available slot from the calendar.

---

### Issue 6.2: Doctor Shows "No Slots Available" on Configured Days
- **Symptom**: A doctor has set Monday shifts, but `GET /api/v1/doctors/:id/slots?date=2026-11-02` returns `[]`.
- **Diagnostic Checklist**:
  1. **Day-of-Week Case**: Check if the date string is valid `YYYY-MM-DD`.
  2. **Active Toggle**: Verify that `doctor_availability.is_active` is set to `true`.
  3. **Time-Off Overlap**: Check `doctor_time_off` table to ensure an active vacation or absence range does not encompass that date.
  4. **Accepting Patients**: Confirm that `doctor_profile.is_accepting_patients` is `true`.

---

## 7. Diagnostic Scripts

### Quick Database Health Probe
Create a temporary scratch script at `src/db/probe.ts` to test connectivity:

```typescript
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function probe() {
  console.log("Testing connection to Neon PostgreSQL...");
  const start = Date.now();
  const res = await db.execute(sql`SELECT NOW() as current_time, version()`);
  console.log("Success! Response in", Date.now() - start, "ms");
  console.log(res[0]);
  process.exit(0);
}

probe().catch((err) => {
  console.error("Connection failed:", err);
  process.exit(1);
});
```

Execute via `npx tsx`:
```bash
npx tsx src/db/probe.ts
```
