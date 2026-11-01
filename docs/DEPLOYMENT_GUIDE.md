# Production Deployment Guide (Vercel & Neon)

This guide provides instructions for deploying the Appointment Booking System to production using **Vercel** for hosting the Next.js 16 application and **Neon** for the serverless PostgreSQL database.

---

## 1. Production Architecture Overview

```mermaid
flowchart TD
    subgraph Users ["Client Traffic"]
        Browser["Patient / Doctor Browser (HTTPS)"]
    end

    subgraph VercelEdge ["Vercel Global Edge Network"]
        CDN["Vercel CDN / Edge Ingress<br/>(appointments.yourdomain.com)"]
        EdgeMW["Next.js Edge Middleware<br/>(Session Cookie Guard)"]
        RSC["Next.js Serverless Functions<br/>(App Router & REST API /api/v1/*)"]
    end

    subgraph NeonCloud ["Neon Cloud PostgreSQL"]
        Pooler["Neon Connection Pooler<br/>(PgBouncer - Port 5432)"]
        PrimaryDB[("PostgreSQL 16 Engine<br/>(High Availability Primary)")]
    end

    Browser --> CDN
    CDN --> EdgeMW
    EdgeMW --> RSC
    RSC -->|HTTP Pooler Connection<br/>?sslmode=require| Pooler
    Pooler --> PrimaryDB
```

---

## 2. Pre-Deployment Checklist

Before deploying, verify the following prerequisites:
- [ ] Working Git repository pushed to GitHub, GitLab, or Bitbucket.
- [ ] Active [Neon Console](https://console.neon.tech/) account.
- [ ] Active [Vercel](https://vercel.com/) account.
- [ ] Local build passes with zero errors: `npm run build`.
- [ ] Strict type-checking passes: `npx tsc --noEmit`.

---

## 3. Step 1: Provision Neon Production Database

1. Log into your [Neon Console](https://console.neon.tech/).
2. Select your project (or create a dedicated production project `appointment-booking-prod`).
3. Under **Branches**, use the default `main` branch (or create a protected branch `production`).
4. Under **Connection Details**, select:
   - **Database**: `neondb`
   - **Role**: Primary owner role
   - **Connection Type**: **Pooled connection** (Host contains `-pooler`)
5. Copy the connection string. Ensure it ends with `?sslmode=require`:
   ```text
   postgresql://prod_owner:secret_password@ep-green-wind-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

---

## 4. Step 2: Apply Migrations to Production Database

Before linking to Vercel, push the Drizzle schema to your production Neon database:

```bash
# Set temporary production connection in your shell (PowerShell)
$env:DATABASE_URL="postgresql://prod_owner:secret_password@ep-green-wind-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Run schema push
npx drizzle-kit push
```

*On Linux / macOS Bash:*
```bash
DATABASE_URL="postgresql://prod_owner:secret_password@ep-green-wind-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require" npx drizzle-kit push
```

Verify that all 11 tables (`user`, `session`, `account`, `verification`, `specialty`, `doctor_profile`, `doctor_availability`, `doctor_time_off`, `appointment`, `review`, `notification`) and their unique indexes are created.

---

## 5. Step 3: Connect Repository to Vercel

1. Navigate to the [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New > Project**.
2. Select your Git provider and import the `appointment-booking` repository.
3. In the **Configure Project** screen:
   - **Framework Preset**: `Next.js` (detected automatically).
   - **Root Directory**: `./` (leave default).
   - **Build Command**: `next build` (leave default).
   - **Output Directory**: `.next` (leave default).
   - **Install Command**: `npm install` (leave default).

---

## 6. Step 4: Configure Production Environment Variables

In the **Environment Variables** section on Vercel, add the 4 required variables:

| Variable Name | Environment | Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | Production, Preview | `postgresql://prod_owner:...-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `BETTER_AUTH_SECRET` | Production, Preview | Generate a 32+ character key via `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Production | `https://your-domain.vercel.app` (or custom domain) |
| `NEXT_PUBLIC_APP_URL`| Production | `https://your-domain.vercel.app` (or custom domain) |

> [!WARNING]
> Ensure `BETTER_AUTH_URL` exactly matches your production domain (including `https://` and without a trailing slash). Better Auth uses this value to validate incoming origins and secure cookies.

---

## 7. Step 5: Deploy & Verify

1. Click **Deploy**. Vercel will clone the repo, install dependencies, run `npm run build`, and deploy edge and serverless functions.
2. Once the deployment succeeds, navigate to your public URL (e.g., `https://appointment-booking.vercel.app`).

### Smoke Test Checklist:
- [ ] Visit landing page and ensure assets, styles, and Lucide icons render without visual defects.
- [ ] Navigate to `/register` and create an administrator account.
- [ ] Test the health of the REST API: `https://your-domain.vercel.app/api/v1/specialties`.
- [ ] Log in as a patient and confirm secure HTTP-only cookies are issued (`better-auth.session_token`).
- [ ] Book a test appointment to confirm transactional persistence in Neon.

---

## 8. Step 6: Custom Domain & Production SSL

1. In the Vercel project dashboard, navigate to **Settings > Domains**.
2. Add your custom domain (e.g. `appointments.yourclinic.com`).
3. Configure the DNS records at your domain registrar:
   - **CNAME Record**: Name `appointments` -> Target `cname.vercel-dns.com`.
4. Vercel automatically generates and renews a free Let's Encrypt SSL/TLS certificate.
5. Update `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` in Vercel Environment Variables to point to `https://appointments.yourclinic.com` and trigger a re-deployment.

---

## 9. Zero-Downtime Migration Strategy

For subsequent schema updates:
1. Update schema definitions in [`src/db/schema/index.ts`](file:///c:/Users/Hp/OneDrive/Apps/appointment-booking/src/db/schema/index.ts).
2. Generate migration files: `npx drizzle-kit generate`.
3. In Neon, create a temporary preview branch to test migrations.
4. Run migrations against production before merging pull requests. Drizzle ORM additive migrations (adding nullable columns or new tables) execute without table locking or user disruption.
