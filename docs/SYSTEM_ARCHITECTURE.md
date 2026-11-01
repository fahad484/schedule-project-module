# System Architecture: Appointment Booking System

## 1. Architectural Overview

The **Appointment Booking System** is architected as a modern, unified full-stack application running on **Next.js 16 (App Router)** and **Node.js**. Rather than maintaining decoupled front-end and back-end microservices, the system adopts a modular **Layered Monolith Architecture**. 

This design leverages React Server Components (RSC) for data fetching, Next.js Server Actions for UI-driven mutations, and Route Handlers for public/partner REST APIs, all underpinned by an isolated **Domain Service Layer** and **Drizzle ORM** communicating with **PostgreSQL on Neon**.

---

## 2. System Architecture Diagram

The diagram below illustrates the end-to-end request flow, component interactions, authentication boundary, and data persistence layer:

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Browser / Consumer"]
        UI["React Server / Client Components<br/>(shadcn/ui + Tailwind CSS)"]
        Forms["Client Forms<br/>(React Hook Form + Zod)"]
        ExtClient["External API Consumer<br/>(Mobile / Third-Party)"]
    end

    subgraph EdgeLayer ["Edge & Middleware Boundary"]
        MW["Next.js Edge Middleware<br/>(src/middleware.ts)"]
        AuthCheck{"Session & Role Valid?"}
        RedirectLogin["Redirect to /login<br/>or Return 401/403"]
    end

    subgraph IngressLayer ["Next.js App Router Ingress"]
        Pages["App Router Server Components<br/>(src/app/(dashboard)/*)"]
        ServerActions["Server Actions<br/>(src/app/actions/*)"]
        RouteHandlers["REST API Route Handlers<br/>(src/app/api/v1/*)"]
    end

    subgraph AuthSubsystem ["Authentication Engine"]
        BetterAuth["Better Auth<br/>(src/lib/auth.ts)"]
        SessionStore["Session & Token Store<br/>(HTTP-only Cookies)"]
    end

    subgraph ServiceLayer ["Domain Service Layer (src/services/*)"]
        AppointmentSvc["AppointmentService<br/>(Booking, Locking, Status)"]
        AvailabilitySvc["AvailabilityService<br/>(Slot Calculation, Buffers)"]
        DoctorSvc["DoctorService<br/>(Profiles, Specialties)"]
        ReviewSvc["ReviewService<br/>(Ratings, Moderation)"]
        NotificationSvc["NotificationService<br/>(In-App, Emails)"]
        AuthSvc["AuthService<br/>(User & Role Logic)"]
    end

    subgraph DataAccessLayer ["Data Access Layer (Drizzle ORM)"]
        DrizzleClient["Drizzle Database Client<br/>(src/lib/db.ts)"]
        DrizzleSchema["Typed Schemas & Relations<br/>(src/db/schema/*)"]
    end

    subgraph StorageLayer ["Cloud Database Storage"]
        NeonPooler["Neon Connection Pooler<br/>(PgBouncer / Serverless)"]
        PostgresDB[("PostgreSQL Database<br/>(Neon Cloud Engine)")]
    end

    %% Client to Middleware
    UI -->|Navigation & Page Requests| MW
    Forms -->|Form Submit / Mutation| ServerActions
    ExtClient -->|HTTP GET/POST/PUT/DELETE| RouteHandlers

    %% Middleware flow
    MW --> AuthCheck
    AuthCheck -- No --> RedirectLogin
    AuthCheck -- Yes --> Pages
    AuthCheck -- Yes --> ServerActions
    AuthCheck -- Yes --> RouteHandlers

    %% Auth interactions
    MW -.->|Verify Session Cookie| BetterAuth
    BetterAuth <--> SessionStore
    BetterAuth <--> DrizzleClient

    %% Ingress to Service Layer
    Pages -->|Read Data via Services| ServiceLayer
    ServerActions -->|Execute Business Logic| ServiceLayer
    RouteHandlers -->|Handle REST Endpoints| ServiceLayer

    %% Service Layer to Data Access
    AppointmentSvc --> DrizzleClient
    AvailabilitySvc --> DrizzleClient
    DoctorSvc --> DrizzleClient
    ReviewSvc --> DrizzleClient
    NotificationSvc --> DrizzleClient
    AuthSvc --> DrizzleClient

    %% Drizzle to Database
    DrizzleClient --> DrizzleSchema
    DrizzleClient -->|Parameterized SQL Queries| NeonPooler
    NeonPooler --> PostgresDB
```

---

## 3. Detailed Architectural Layers

### 3.1. Client & Presentation Layer
- **React Server Components (RSC)**: Used by default for all page views, dashboards, and static content. RSC fetches data on the server with zero client JavaScript bundle overhead.
- **Client Components (`'use client'`)**: Isolated exclusively to interactive widgets:
  - Dynamic calendar date & slot pickers (`BookingCalendar.tsx`).
  - Interactive forms powered by `react-hook-form` and `@hookform/resolvers/zod`.
  - Notification popovers, modals, and dynamic filter dropdowns.
- **Styling & UI**: Built on **Tailwind CSS v4** and **shadcn/ui** (accessible primitives from Radix UI).
- **Client-Side Notifications**: Handled via **Sonner** toasts for responsive feedback on mutation success, validation errors, and async processes.

### 3.2. Middleware & Routing Protection Layer
The middleware (`src/middleware.ts`) operates on the Next.js Edge Runtime before requests reach any page or route handler:
1. **Public Route Matching**: Permits unrestricted access to marketing pages, landing pages, doctor public profiles, login, and registration.
2. **Session Verification**: Extracts session tokens from HTTP-only cookies and verifies authenticity using Better Auth.
3. **Role-Based Routing Guard (RBAC)**:
   - Routes under `/dashboard/patient/*` require role `patient` or `admin`.
   - Routes under `/dashboard/doctor/*` require role `doctor` (and active `VERIFIED` status).
   - Routes under `/dashboard/admin/*` require role `admin`.
   - Unauthenticated or unauthorized requests trigger redirection to `/login` or return `401 Unauthorized` / `403 Forbidden` for API requests.

### 3.3. Ingress Layer: Server Actions vs. Route Handlers
The application implements two distinct ingress patterns catering to different client needs:

```mermaid
flowchart LR
    subgraph UIClient ["Web Application UI"]
        Component["Client Component<br/>(Appointment Form)"]
    end

    subgraph APIClient ["External Integration / Mobile"]
        ThirdParty["REST API Consumer<br/>(Thunder Client / Mobile)"]
    end

    subgraph NextServer ["Next.js Server Runtime"]
        SA["Server Action<br/>bookAppointmentAction()"]
        RH["Route Handler<br/>POST /api/v1/appointments"]
        SVC["AppointmentService.bookSlot()"]
    end

    Component -->|Direct RPC Mutation| SA
    ThirdParty -->|JSON Payload over HTTP| RH
    SA -->|Calls Domain Logic| SVC
    RH -->|Calls Domain Logic| SVC
```

1. **Server Actions (`src/app/actions/*`)**:
   - Primary mutation mechanism for the web application.
   - Type-safe Remote Procedure Calls (RPC) directly callable from client components.
   - Built-in Progressive Enhancement and automatic cache revalidation (`revalidatePath`, `revalidateTag`).
2. **Route Handlers (`src/app/api/v1/*`)**:
   - Standard RESTful HTTP endpoints returning JSON responses with consistent HTTP status codes.
   - Supports external API consumers, automated integration testing (via Thunder Client), and mobile applications.

### 3.4. Domain Service Layer (`src/services/*`)
To avoid coupling business logic to either Server Actions or Route Handlers, all domain rules reside in the **Service Layer**:
- **Why a Service Layer?**
  - **DRY (Don't Repeat Yourself)**: Business logic, validation, and database operations are written once and shared across Server Actions and REST API endpoints.
  - **Transaction Boundary Management**: Complex multi-table operations (e.g., locking a slot, creating an appointment, logging an audit record, queuing an alert) are encapsulated in single service calls.
  - **Testability**: Service functions can be unit-tested in isolation without mocking HTTP requests or React component contexts.

**Core Services**:
- `AuthService`: User account registration, role queries, doctor verification status.
- `DoctorService`: Profile updates, specialty mappings, consultation fees, bio updates.
- `AvailabilityService`: Dynamic slot computation, buffer time calculation, holiday overrides.
- `AppointmentService`: Slot reservation, concurrency locking, cancellation, rescheduling.
- `ReviewService`: Post-consultation review submission, score calculation, response management.
- `NotificationService`: In-app notification creation, email dispatch coordination.

### 3.5. Data Access Layer (Drizzle ORM & Neon PostgreSQL)
- **Drizzle ORM**: Zero-runtime overhead TypeScript ORM.
  - Type-safe schema definition in `src/db/schema/*`.
  - Compile-time SQL query validation and inference of TypeScript types (`InsertAppointment`, `SelectAppointment`).
  - Drizzle Kit manages versioned database migrations in `drizzle/`.
- **Neon Serverless PostgreSQL**:
  - Connection pooling via Neon's connection pooler for serverless environments.
  - ACID transaction isolation guaranteeing data consistency.

---

## 4. Double-Booking Prevention & Concurrency Architecture

To guarantee that no two concurrent requests can reserve the same doctor slot, the system employs **pessimistic row-level locking** combined with **database transactions**:

```mermaid
sequenceDiagram
    autonumber
    actor PatientA as Patient A
    actor PatientB as Patient B
    participant Ingress as Server Action / API Handler
    participant Svc as AppointmentService
    participant DB as PostgreSQL (Neon)

    Note over PatientA,PatientB: Both click "Book 10:00 AM Slot" simultaneously

    PatientA->>Ingress: Submit booking (Doctor 1, 10:00 - 10:30)
    PatientB->>Ingress: Submit booking (Doctor 1, 10:00 - 10:30)

    Ingress->>Svc: bookAppointment(data)
    Svc->>DB: BEGIN TRANSACTION (ISOLATION LEVEL READ COMMITTED)
    
    rect rgb(240, 248, 255)
        Note over Svc,DB: Check slot conflict with FOR UPDATE lock
        Svc->>DB: SELECT * FROM appointments<br/>WHERE doctor_id = 1 AND status IN ('PENDING', 'CONFIRMED')<br/>AND (start_time < '10:30' AND end_time > '10:00')<br/>FOR UPDATE
        DB-->>Svc: 0 rows found (Slot is free!)
    end

    rect rgb(255, 245, 245)
        Note over PatientB,DB: Patient B's transaction waits or evaluates after Lock A
        Svc->>DB: INSERT INTO appointments (doctor_id, patient_id, 10:00, 10:30, 'CONFIRMED')
        Svc->>DB: COMMIT TRANSACTION
    end
    DB-->>Svc: Insert Success
    Svc-->>Ingress: Appointment Confirmed (APT-1001)
    Ingress-->>PatientA: Booking Success Toast & Confirmation

    Note over Svc,DB: Patient B transaction proceeds after commit
    Svc->>DB: SELECT * FROM appointments WHERE ... FOR UPDATE
    DB-->>Svc: 1 row found (Overlaps with APT-1001)
    Svc->>DB: ROLLBACK TRANSACTION
    Svc-->>Ingress: Throw SlotAlreadyBookedError
    Ingress-->>PatientB: Error Toast: "Slot already taken. Please choose another."
```

### Key Concurrency Safeguards:
1. **Database Exclusion Constraint / Overlap Check**: In addition to row-level locks, PostgreSQL range constraints (`tsrange` with `gist` index) can enforce non-overlapping time slots at the database storage engine level.
2. **Status Scoping**: Only appointments with active statuses (`PENDING`, `CONFIRMED`) hold reservations. Cancelled appointments (`CANCELLED`) release the time slot immediately.

---

## 5. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    users ||--o{ sessions : has
    users ||--o{ accounts : has
    users ||--o| doctor_profiles : has
    users ||--o{ appointments : "books as patient"
    doctor_profiles ||--o{ appointments : "receives as doctor"
    doctor_profiles ||--o{ availability_rules : defines
    doctor_profiles ||--o{ date_overrides : defines
    doctor_profiles }o--o{ doctor_specialties : maps
    specialties ||--o{ doctor_specialties : categorizes
    appointments ||--o| reviews : receives
    users ||--o{ notifications : receives

    users {
        uuid id PK
        string email UK
        string name
        string role "patient | doctor | admin"
        string password_hash
        timestamp created_at
    }

    doctor_profiles {
        uuid id PK
        uuid user_id FK, UK
        string title
        text bio
        decimal consultation_fee
        int slot_duration_minutes
        int buffer_minutes
        string verification_status "PENDING | VERIFIED | REJECTED"
        string clinic_address
    }

    specialties {
        uuid id PK
        string name UK
        string slug UK
        string description
    }

    doctor_specialties {
        uuid doctor_id FK
        uuid specialty_id FK
    }

    availability_rules {
        uuid id PK
        uuid doctor_id FK
        int day_of_week "0-6"
        time start_time
        time end_time
        boolean is_active
    }

    date_overrides {
        uuid id PK
        uuid doctor_id FK
        date override_date
        time start_time
        time end_time
        boolean is_day_off
    }

    appointments {
        uuid id PK
        string reference_code UK
        uuid patient_id FK
        uuid doctor_id FK
        timestamp start_time
        timestamp end_time
        string status "PENDING | CONFIRMED | COMPLETED | CANCELLED | RESCHEDULED"
        text reason_for_visit
        text cancellation_reason
        timestamp created_at
    }

    reviews {
        uuid id PK
        uuid appointment_id FK, UK
        uuid patient_id FK
        uuid doctor_id FK
        int rating "1 to 5"
        text comment
        text doctor_response
        timestamp created_at
    }

    notifications {
        uuid id PK
        uuid user_id FK
        string title
        text message
        string type "BOOKING | REMINDER | CANCEL | SYSTEM"
        boolean is_read
        timestamp created_at
    }
```

---

## 6. Authentication & Security Architecture

1. **Better Auth Engine**:
   - Handles password hashing via modern memory-hard cryptographic algorithms (Argon2id or bcrypt).
   - Issues cryptographically random session tokens stored in secure, HTTP-only, SameSite cookies.
   - Seamlessly integrates with the PostgreSQL `users`, `sessions`, and `accounts` tables via Drizzle ORM.
2. **Defensive API Design**:
   - Strict Zod schema parsing on all request bodies, query params, and route parameters.
   - Parameterized SQL generation via Drizzle prevents SQL injection vectors entirely.
   - Cross-Site Request Forgery (CSRF) protection built into Next.js Server Actions and validated Origin headers on Route Handlers.
   - Comprehensive error masking: Database connection errors and query failures are caught by the service layer and translated into sanitized, client-safe error messages.
