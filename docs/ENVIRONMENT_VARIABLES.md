# Environment Variables Specification

This document details all environment variables utilized by the Appointment Booking System across local development, testing, staging, and production deployments.

---

## 1. Environment Variable Reference Table

| Variable Name | Required | Client-Exposed | Minimum Length | Example Value | Description |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | No | ~50 chars | `postgresql://user:pass@ep-cool-123.neon.tech/neondb?sslmode=require` | Neon PostgreSQL pooled connection string. |
| `BETTER_AUTH_SECRET` | **Yes** | No | 32 chars | `c47fb59f931d8e578c773950cfbf8ef732a93321` | Cryptographic secret for signing sessions & tokens. |
| `BETTER_AUTH_URL` | **Yes** | No | N/A | `http://localhost:3000` | Canonical origin used by Better Auth for CORS validation. |
| `NEXT_PUBLIC_APP_URL`| **Yes** | **Yes** | N/A | `http://localhost:3000` | Public base URL used by React client components & SDKs. |

---

## 2. In-Depth Variable Breakdown

### 2.1. `DATABASE_URL`
- **Purpose**: Establishes the connection between the application ([`src/lib/db.ts`](file:///c:/Users/Hp/OneDrive/Apps/appointment-booking/src/lib/db.ts)) and your cloud database on **Neon Serverless PostgreSQL**.
- **Standard Syntax**:
  ```text
  postgresql://<username>:<password>@<neon-endpoint-hostname>/<database-name>?sslmode=require
  ```
- **Connection Modes on Neon**:
  - **Pooled Connection (Recommended)**: Uses Neon's built-in PgBouncer pooler. The hostname typically contains `-pooler` (e.g., `ep-patient-hill-123456-pooler.us-east-2.aws.neon.tech`). Recommended for Next.js serverless functions to avoid connection exhaustion.
  - **Direct Connection**: Connects straight to the PostgreSQL compute instance.
- **Critical Requirement**:
  Neon strictly requires TLS/SSL. Ensure `?sslmode=require` is appended to the connection string. If omitted, connection attempts will be rejected with an SSL negotiation error.

---

### 2.2. `BETTER_AUTH_SECRET`
- **Purpose**: Primary cryptographic key used by [Better Auth](file:///c:/Users/Hp/OneDrive/Apps/appointment-booking/src/lib/auth.ts) to sign session tokens, encrypt secure cookie headers, and prevent token tampering.
- **Security Constraints**:
  - Must be **at least 32 characters** long with high Shannon entropy.
  - Must remain strictly server-side. Never prefix with `NEXT_PUBLIC_`.
- **Generation Commands**:
  ```bash
  # Option 1: OpenSSL
  openssl rand -base64 32

  # Option 2: Node.js Crypto CLI
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

---

### 2.3. `BETTER_AUTH_URL`
- **Purpose**: Defines the authoritative server origin where Better Auth route handlers are served. Better Auth utilizes this variable to validate incoming `Origin` and `Referer` headers, defending against Cross-Site Request Forgery (CSRF).
- **Environment Values**:
  - Local Development: `http://localhost:3000`
  - Staging: `https://staging.yourdomain.com`
  - Production: `https://appointments.yourdomain.com` (or `https://your-app.vercel.app`)

---

### 2.4. `NEXT_PUBLIC_APP_URL`
- **Purpose**: Configures the base HTTP destination for client-side API calls initiated by [`src/lib/auth-client.ts`](file:///c:/Users/Hp/OneDrive/Apps/appointment-booking/src/lib/auth-client.ts) and client navigation logic.
- **Client Exposure**:
  Because it is prefixed with `NEXT_PUBLIC_`, Next.js bakes this value into the browser JavaScript bundle during build time.
- **Environment Values**:
  Must match the publicly accessible domain:
  - Local Development: `http://localhost:3000`
  - Production: `https://appointments.yourdomain.com`

---

## 3. Configuration Files & Hierarchy

Next.js evaluates environment variables in the following descending order of precedence:

```mermaid
flowchart TD
    A[".env.local<br/>(Local machine overrides - NEVER committed)"] --> B[".env.production / .env.development<br/>(Environment-specific defaults)"]
    B --> C[".env<br/>(Base repository defaults)"]
    C --> D[".env.example<br/>(Committed developer template)"]
```

### 3.1. `.env.example` (Committed Template)
Located at the root of the project:
```ini
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@ep-example-123456.us-east-2.aws.neon.tech/appointment_booking?sslmode=require

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-min-32-characters-long-here
BETTER_AUTH_URL=http://localhost:3000

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3.2. `.env.local` (Local Active Settings)
Ignored by Git. Created by developers copying `.env.example` and substituting real credentials.

---

## 4. Security & Hygiene Best Practices

1. **Git Exclusion**: Ensure `.env.local`, `.env.*.local`, and `.env` containing sensitive credentials are listed in `.gitignore`.
2. **Key Rotation**: If `BETTER_AUTH_SECRET` is compromised or rotated, all active sessions in the database will be invalidated, prompting all users to re-authenticate.
3. **Never Log Variables**: Avoid printing `process.env` in logs or debug statements to prevent secret leakage in monitoring systems (e.g., Datadog, Sentry).
4. **Production Hosting Management**: In Vercel or other cloud hosts, configure these variables in the dashboard under **Project Settings > Environment Variables** rather than checking in `.env` files.
