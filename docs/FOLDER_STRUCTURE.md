# Project Folder Structure: Appointment Booking System

This document outlines the architectural organization, file taxonomy, naming conventions, and module boundaries for the **Appointment Booking System**.

---

## 1. Directory Tree Overview

```text
appointment-booking/
├── src/
│   ├── app/                     # Next.js App Router: Pages, Layouts, Actions, Route Handlers
│   │   ├── (auth)/              # Route group for unauthenticated flows (login, register)
│   │   ├── (dashboard)/         # Route group for protected role-based dashboards
│   │   ├── api/v1/              # REST API Route Handlers (public & partner integrations)
│   │   ├── actions/             # Next.js Server Actions for UI-driven mutations
│   │   ├── layout.tsx           # Global root layout (HTML shell, ThemeProvider, Toaster)
│   │   └── page.tsx             # Public landing page & doctor discovery showcase
│   ├── components/              # Reusable UI presentation layer
│   │   ├── ui/                  # Unstyled primitives from shadcn/ui (Radix UI wrappers)
│   │   ├── forms/               # Domain-specific interactive form components
│   │   ├── layout/              # Structural chrome (Navbar, Sidebar, Footer, MobileNav)
│   │   └── dashboard/           # Role-specific dashboard widgets and data tables
│   ├── lib/                     # Infrastructure clients, shared utilities, and schemas
│   │   ├── auth.ts              # Better Auth server-side configuration & plugins
│   │   ├── auth-client.ts       # Better Auth client hooks and browser methods
│   │   ├── db.ts                # Neon PostgreSQL connection pool and Drizzle client
│   │   ├── utils.ts             # Global helper functions (cn, date formatters, currency)
│   │   └── validations/         # Composable Zod validation schemas
│   ├── db/                      # Database definition layer
│   │   ├── schema/              # Modular table schemas (users, appointments, doctors)
│   │   └── index.ts             # Centralized schema barrel export for Drizzle
│   ├── services/                # Pure business logic and domain service functions
│   ├── types/                   # Shared TypeScript interfaces, enums, and Drizzle models
│   └── middleware.ts            # Edge middleware for session guards and role protection
├── drizzle/                     # Drizzle Kit generated SQL migrations & snapshot files
├── thunder-client/              # Thunder Client JSON collections & environment configs
├── docs/                        # Architecture, requirements, and engineering documentation
├── drizzle.config.ts            # Drizzle Kit configuration (credentials, schema paths)
├── .env.example                 # Template for required environment variables
└── package.json                 # Project dependencies, scripts, and package metadata
```

---

## 2. Deep Dive: Directory Breakdown

### 2.1. `src/app/` (Application Routing & Ingress)
The routing architecture uses the Next.js App Router. Parentheses in directory names denote **Route Groups**, which organize routes without affecting the URL path.

- **`(auth)/`**: Contains authentication views wrapped in a minimalist auth layout (centered card layout, distraction-free):
  - `login/page.tsx`: Patient, Doctor, and Admin login form.
  - `register/page.tsx`: Patient registration and initial Doctor onboarding request.
  - `forgot-password/page.tsx`: Password recovery request form.
- **`(dashboard)/`**: Protected user dashboards with authenticated sidebar and header layouts:
  - `patient/`: Patient appointment bookings, upcoming visit schedule, medical history, past reviews.
  - `doctor/`: Doctor schedule configuration, working hours, break times, appointment requests, consultation history.
  - `admin/`: Doctor credential verification queue, user management table, platform-wide metrics.
- **`api/v1/`**: RESTful Route Handlers (`route.ts`) returning JSON:
  - `api/v1/auth/`: Better Auth handler endpoint route.
  - `api/v1/doctors/`: Public endpoints to search doctors and query available time slots.
  - `api/v1/appointments/`: Endpoints to create, cancel, and retrieve appointments.
- **`actions/`**: Next.js Server Actions (`'use server'`). Server Actions act as thin RPC controllers that validate incoming inputs against Zod schemas and delegate directly to the `services/` layer.

### 2.2. `src/components/` (Component Presentation)
Components are organized strictly by scope and reusability:

- **`ui/`**: shadcn/ui components (`button.tsx`, `dialog.tsx`, `calendar.tsx`, `input.tsx`, `badge.tsx`, `table.tsx`, `dropdown-menu.tsx`). These are design system primitives that do not contain business logic.
- **`forms/`**: Self-contained form components (`LoginForm.tsx`, `AppointmentBookingForm.tsx`, `ScheduleSettingsForm.tsx`, `ReviewForm.tsx`) using React Hook Form and Zod.
- **`layout/`**: Persistent structural layout elements (`SiteHeader.tsx`, `DashboardSidebar.tsx`, `SiteFooter.tsx`, `UserNav.tsx`, `NotificationBell.tsx`).
- **`dashboard/`**: Specialized dashboard presentation components (`AppointmentCard.tsx`, `AvailabilityCalendar.tsx`, `MetricsOverview.tsx`, `DoctorVerificationRow.tsx`).

### 2.3. `src/lib/` (Infrastructure & Utilities)
Encapsulates low-level infrastructure instances and shared helper libraries:

- **`auth.ts`**: Better Auth server instance configured with the Drizzle adapter, password hashers, session cookies, and role plugins.
- **`auth-client.ts`**: Better Auth client instance exported for client components (e.g., `useSession()`, `signIn()`, `signOut()`).
- **`db.ts`**: Initializes the Neon PostgreSQL connection pool using `@neondatabase/serverless` or standard Postgres driver, exporting the typed `db` instance:
  ```ts
  import { drizzle } from "drizzle-orm/neon-http";
  import * as schema from "@/db";
  export const db = drizzle(process.env.DATABASE_URL!, { schema });
  ```
- **`utils.ts`**: Common utility functions including `cn()` (combining `clsx` and `tailwind-merge`), date formatters, and currency formatters.
- **`validations/`**: Central repository for Zod schemas (`auth.schema.ts`, `appointment.schema.ts`, `doctor.schema.ts`). Shared across both client forms and server validations.

### 2.4. `src/db/` (Database & Schema Definitions)
- **`schema/`**: Schema definitions broken into modular domain files:
  - `auth.ts`: Users, sessions, accounts, and verification tokens.
  - `doctors.ts`: Doctor profiles, medical specialties, doctor-specialty mappings.
  - `availability.ts`: Weekly recurring schedule rules, day-off overrides, time windows.
  - `appointments.ts`: Appointment records, status enums, visit notes.
  - `reviews.ts`: Patient ratings, review text, doctor replies.
  - `notifications.ts`: In-app notification queues and read statuses.
- **`index.ts`**: Re-exports all table schemas and Drizzle relations in a single barrel export so Drizzle and migrations can locate all definitions reliably.

### 2.5. `src/services/` (Domain Business Logic)
The service layer contains **pure business logic**. Services interact with `db` directly, execute ACID transactions, handle double-booking prevention locks, and throw typed domain errors.
- `appointment.service.ts`: Booking transactions, row-level locking, cancellation, reschedule logic.
- `availability.service.ts`: Real-time vacant slot generation based on doctor rules minus existing appointments.
- `doctor.service.ts`: Doctor directory queries, profile updates, credential verification workflows.
- `review.service.ts`: Review validation (checking completed status), rating calculations.
- `notification.service.ts`: In-app alerts and transactional email triggers.

### 2.6. `src/types/` (TypeScript Definitions)
Contains cross-cutting type definitions:
- Domain models inferred from Drizzle schemas (`type Appointment = typeof appointments.$inferSelect;`).
- API request/response contract interfaces.
- Enumerated types for appointment statuses, user roles, and verification states.

### 2.7. `src/middleware.ts` (Edge Route Guard)
The single edge middleware entrypoint configured via Next.js `middleware.ts`. It extracts the Better Auth session cookie, decodes user credentials, verifies route access permissions, and redirects unauthorized requests.

---

## 3. Root Files & Tooling Configuration

- **`drizzle/`**: Migration directory managed automatically by Drizzle Kit. Contains incremental SQL migration scripts (`0000_init.sql`, etc.) and snapshot schema state (`_journal.json`).
- **`thunder-client/`**: Exported API request collections and environment variables for local testing with Thunder Client (VS Code) or Postman.
- **`docs/`**: Complete technical documentation suite (Architecture, Requirements, UI/UX, Folder Structure, Contributing).
- **`drizzle.config.ts`**: Configuration file for Drizzle Kit telling the CLI where the schema lives, where to output migrations, and how to read `DATABASE_URL`.
- **`.env.example`**: Committed template defining all required environment variables:
  ```env
  DATABASE_URL="postgresql://user:password@ep-example-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
  BETTER_AUTH_SECRET="your-32-character-secret"
  BETTER_AUTH_URL="http://localhost:3000"
  NEXT_PUBLIC_APP_URL="http://localhost:3000"
  ```
- **`package.json`**: NPM package configuration and execution scripts (`dev`, `build`, `start`, `lint`, `db:generate`, `db:migrate`, `db:studio`).

---

## 4. File Naming & Organization Conventions

| Target | Convention | Example |
| :--- | :--- | :--- |
| **React Components** | PascalCase | `AppointmentCard.tsx`, `BookingForm.tsx` |
| **Page / Layout Files** | kebab-case / Next.js standard | `page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx` |
| **Service Modules** | kebab-case or camelCase with suffix | `appointment.service.ts`, `doctor.service.ts` |
| **Zod Schemas** | kebab-case with `.schema.ts` | `appointment.schema.ts`, `auth.schema.ts` |
| **Database Schemas** | kebab-case matching tables | `appointments.ts`, `doctor-profiles.ts` |
| **Utility Functions** | camelCase | `formatDate()`, `calculateSlotAvailability()` |
| **Type Files** | kebab-case with `.types.ts` | `appointment.types.ts`, `auth.types.ts` |

---

## 5. Import Path Aliases

TypeScript module path aliases are configured via `tsconfig.json` to avoid fragile relative paths (e.g., `../../`):

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Common imports:
```ts
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { appointments } from "@/db/schema/appointments";
import { AppointmentService } from "@/services/appointment.service";
import { bookingSchema } from "@/lib/validations/appointment.schema";
```
