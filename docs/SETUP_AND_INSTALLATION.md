# Setup and Installation Guide

This guide walks you through setting up, configuring, migrating, and running the Appointment Booking System in your local development environment.

---

## 1. Prerequisites & System Requirements

Before starting, ensure your local workstation meets the following runtime requirements:

| Component | Minimum Version | Recommended Version | Verification Command | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Node.js** | `v18.17.0` | `v20.x` (LTS) or `v22.x` | `node -v` | App Router and React 19 support. |
| **npm** | `v9.x` | `v10.x` | `npm -v` | Or equivalent `pnpm` / `yarn`. |
| **Git** | `v2.30+` | Latest | `git --version` | Version control. |
| **Neon PostgreSQL** | Cloud Account | Serverless Tier | N/A | Free tier available at [neon.tech](https://neon.tech). |

---

## 2. Step-by-Step Installation

### Step 1: Clone the Repository
Clone the project repository to your local machine and navigate into the project directory:

```bash
git clone https://github.com/your-org/appointment-booking.git
cd appointment-booking
```

On Windows PowerShell:
```powershell
Set-Location -Path "c:\Users\Hp\OneDrive\Apps\appointment-booking"
```

---

### Step 2: Install Node Dependencies
Install all production and development dependencies using npm:

```bash
npm install
```

> [!NOTE]
> The installation includes Next.js 16, React 19, Better Auth, Drizzle ORM, Drizzle Kit, Tailwind CSS v4, Radix UI primitives, Lucide React, and Zod.

---

### Step 3: Configure Environment Variables
Copy the template [`.env.example`](file:///c:/Users/Hp/OneDrive/Apps/appointment-booking/.env.example) to create a local `.env.local` configuration file:

**macOS / Linux:**
```bash
cp .env.example .env.local
```

**Windows PowerShell:**
```powershell
Copy-Item .env.example .env.local
```

Open `.env.local` in your editor and configure the 4 core environment variables:

```ini
# Neon PostgreSQL Connection String (must include ?sslmode=require)
DATABASE_URL=postgresql://neondb_owner:npg_password@ep-cool-frost-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

# Better Auth Secret (minimum 32 characters)
BETTER_AUTH_SECRET=generate-a-secure-random-32-char-secret-key-here

# Better Auth Base URL (Canonical local origin)
BETTER_AUTH_URL=http://localhost:3000

# Client-side Public URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> [!TIP]
> You can quickly generate a secure 32+ character random string for `BETTER_AUTH_SECRET` via OpenSSL or Node.js:
> ```bash
> openssl rand -base64 32
> # or
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

### Step 4: Provision Neon PostgreSQL Database

1. Navigate to the [Neon Console](https://console.neon.tech/) and sign in.
2. Click **Create Project** and name it `appointment-booking`.
3. Choose your closest geographical cloud region (e.g., `AWS us-east-2` or `AWS eu-central-1`).
4. On the project dashboard, copy the **Connection string**. Ensure the dropdown is set to **Pooled connection** or direct connection, and append `?sslmode=require`.
5. Paste this connection string into your `.env.local` as `DATABASE_URL`.

---

### Step 5: Run Database Migrations with Drizzle Kit

Apply the database schema ([`src/db/schema/index.ts`](file:///c:/Users/Hp/OneDrive/Apps/appointment-booking/src/db/schema/index.ts)) directly to your Neon database instance:

```bash
# Push schema changes directly to Neon PostgreSQL
npx drizzle-kit push
```

Alternatively, if you prefer generating SQL migration files first:
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

To visually inspect your database tables, foreign keys, and indexes using Drizzle Studio:
```bash
npx drizzle-kit studio
```
This opens the web management interface at `https://local.drizzle.studio`.

---

### Step 6: Seed Initial Data

Populate the database with default medical specialties and seed accounts:

1. **Medical Specialties**: Cardiology, Dermatology, Pediatrics, Orthopedics, Neurology, General Medicine, Psychiatry.
2. **Initial Administrator Account**: Create an admin user to unlock `/admin/*` routes.

Run the seed script (or execute the initialization via Drizzle Studio or API):
```bash
npx tsx src/db/seed.ts
```

*Sample seed snippet if executing programmatically:*
```typescript
import { db } from "@/lib/db";
import { specialty } from "@/db/schema";

await db.insert(specialty).values([
  { name: "Cardiology", description: "Heart and vascular health", icon: "Heart" },
  { name: "Dermatology", description: "Skin, hair, and nail health", icon: "Sparkles" },
  { name: "Pediatrics", description: "Infant and child medicine", icon: "Baby" },
  { name: "Neurology", description: "Brain and nervous system care", icon: "Brain" },
]);
```

---

### Step 7: Launch the Development Server

Start the Next.js local development server with Turbopack:

```bash
npm run dev
```

The application will initialize at:
`http://localhost:3000`

---

## 3. Verifying Installation Health

Execute this quick verification checklist to ensure your environment is fully operational:

1. **Frontend Landing Page**: Visit `http://localhost:3000`. You should see the homepage layout and search bar.
2. **Authentication Flow**:
   - Navigate to `/register` (or trigger Sign Up).
   - Create a test account with role `patient`.
   - Confirm successful redirect to `/dashboard`.
3. **Database Check**: Inspect your Neon console or open `npx drizzle-kit studio` to verify that the `user` and `session` tables contain your registered record.
4. **Specialties API**: Execute `curl http://localhost:3000/api/v1/specialties` to verify JSON response `200 OK`.

---

## 4. Common Local Scripts Reference

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server on `localhost:3000`. |
| `npm run build` | Compiles the production build with type checking. |
| `npm run start` | Boots the compiled production server. |
| `npm run lint` | Runs ESLint 9 checks against source files. |
| `npx drizzle-kit push` | Synchronizes local Drizzle schema with the remote Neon database. |
| `npx drizzle-kit studio` | Opens local visual database GUI. |
