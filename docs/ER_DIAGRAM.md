# Entity-Relationship (ER) Diagram

This document presents the formal Entity-Relationship (ER) model for the Appointment Booking System. The diagram and tables delineate the entities, key constraints, foreign key cardinalities, and data relationships powering the application.

---

## 1. Visual Entity-Relationship Diagram

```mermaid
erDiagram
    USER {
        text id PK "Better Auth User ID"
        text name "Full legal name"
        text email UK "Unique email address"
        boolean email_verified "Verification state"
        text image "Avatar URL"
        user_role role "patient | doctor | admin"
        varchar phone "Contact number"
        date date_of_birth "DOB"
        text address "Postal address"
        timestamp created_at "Creation timestamp"
        timestamp updated_at "Update timestamp"
    }

    SESSION {
        text id PK "Session ID"
        text token UK "Cryptographic token"
        timestamp expires_at "Session expiry"
        text ip_address "Audited IP"
        text user_agent "Client UA"
        text user_id FK "References USER.id"
        timestamp created_at "Created at"
        timestamp updated_at "Refreshed at"
    }

    ACCOUNT {
        text id PK "Account record ID"
        text account_id "Provider account ID"
        text provider_id "Provider name (e.g. credential)"
        text user_id FK "References USER.id"
        text access_token "OAuth token"
        text refresh_token "OAuth refresh"
        text password "Hashed password"
        timestamp created_at "Created at"
        timestamp updated_at "Updated at"
    }

    VERIFICATION {
        text id PK "Verification ID"
        text identifier "Email or phone"
        text value "Token secret"
        timestamp expires_at "Token expiry"
        timestamp created_at "Created at"
        timestamp updated_at "Updated at"
    }

    SPECIALTY {
        uuid id PK "UUID primary key"
        varchar name UK "Unique specialty title"
        text description "Clinical field summary"
        varchar icon "Lucide icon string"
        timestamp created_at "Created at"
    }

    DOCTOR_PROFILE {
        uuid id PK "Doctor Profile UUID"
        text user_id FK,UK "1-to-1 with USER.id"
        uuid specialty_id FK "References SPECIALTY.id"
        text bio "Physician biography"
        text qualifications "Degrees & certifications"
        integer experience_years "Years of medical practice"
        numeric consultation_fee "Standard fee (10,2)"
        varchar hospital_affiliation "Clinic or hospital"
        boolean is_accepting_patients "Active intake switch"
        numeric average_rating "Aggregate rating (3,2)"
        integer total_reviews "Count of reviews"
        timestamp created_at "Profile creation"
        timestamp updated_at "Profile update"
    }

    DOCTOR_AVAILABILITY {
        uuid id PK "Availability UUID"
        uuid doctor_id FK "References DOCTOR_PROFILE.id"
        day_of_week day_of_week "monday - sunday"
        time start_time "Shift start (HH:MM)"
        time end_time "Shift end (HH:MM)"
        integer slot_duration_minutes "Slot size in minutes"
        boolean is_active "Shift active toggle"
        timestamp created_at "Creation timestamp"
    }

    DOCTOR_TIME_OFF {
        uuid id PK "Time-off UUID"
        uuid doctor_id FK "References DOCTOR_PROFILE.id"
        date start_date "Leave start (YYYY-MM-DD)"
        date end_date "Leave end (YYYY-MM-DD)"
        text reason "Absence description"
        timestamp created_at "Submission timestamp"
    }

    APPOINTMENT {
        uuid id PK "Appointment UUID"
        text patient_id FK "References USER.id"
        uuid doctor_id FK "References DOCTOR_PROFILE.id"
        date appointment_date "Calendar date (YYYY-MM-DD)"
        time start_time "Consultation start (HH:MM)"
        time end_time "Consultation end (HH:MM)"
        appointment_status status "scheduled | confirmed | completed | cancelled | no_show"
        text reason "Chief medical complaint"
        text notes "Doctor clinical findings"
        timestamp cancelled_at "Cancellation time"
        text cancelled_by "User ID who cancelled"
        text cancellation_reason "Reason for cancellation"
        timestamp created_at "Booked timestamp"
        timestamp updated_at "Updated timestamp"
    }

    REVIEW {
        uuid id PK "Review UUID"
        uuid appointment_id FK,UK "1-to-1 with APPOINTMENT.id"
        text patient_id FK "References USER.id"
        uuid doctor_id FK "References DOCTOR_PROFILE.id"
        integer rating "Score 1 to 5"
        text comment "Testimonial commentary"
        timestamp created_at "Submission timestamp"
        timestamp updated_at "Edit timestamp"
    }

    NOTIFICATION {
        uuid id PK "Notification UUID"
        text user_id FK "References USER.id"
        notification_type type "Alert category"
        text title "Headline"
        text message "Content narrative"
        boolean is_read "Read receipt"
        text metadata "JSON string payload"
        timestamp created_at "Dispatched at"
    }

    %% Relationships
    USER ||--o{ SESSION : "authenticates via"
    USER ||--o{ ACCOUNT : "maintains credentials in"
    USER ||--o| DOCTOR_PROFILE : "extends as doctor"
    USER ||--o{ APPOINTMENT : "books as patient"
    USER ||--o{ REVIEW : "authors as patient"
    USER ||--o{ NOTIFICATION : "receives"

    SPECIALTY ||--o{ DOCTOR_PROFILE : "classifies"

    DOCTOR_PROFILE ||--o{ DOCTOR_AVAILABILITY : "configures weekly"
    DOCTOR_PROFILE ||--o{ DOCTOR_TIME_OFF : "declares leaves in"
    DOCTOR_PROFILE ||--o{ APPOINTMENT : "fulfills consultations in"
    DOCTOR_PROFILE ||--o{ REVIEW : "rated by"

    APPOINTMENT ||--o| REVIEW : "produces upon completion"
```

---

## 2. Relational Cardinality & Participation Matrix

The following table summarizes the structural cardinalities, optionalities, and referential implications across all entities:

| Relationship | Cardinality | Parent Entity | Child Entity | Foreign Key Column | Nullable / Required |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **User to Session** | `1 : N` (Zero or Many) | `user` | `session` | `session.user_id` | Required (`NOT NULL`) |
| **User to Account** | `1 : N` (Zero or Many) | `user` | `account` | `account.user_id` | Required (`NOT NULL`) |
| **User to Doctor Profile** | `1 : 1` (Zero or One) | `user` | `doctor_profile` | `doctor_profile.user_id` | Required, Unique (`NOT NULL`, `UNIQUE`) |
| **Specialty to Doctor Profile** | `1 : N` (Zero or Many) | `specialty` | `doctor_profile` | `doctor_profile.specialty_id` | Required (`NOT NULL`) |
| **Doctor Profile to Availability** | `1 : N` (Zero or Many) | `doctor_profile` | `doctor_availability` | `doctor_availability.doctor_id` | Required (`NOT NULL`) |
| **Doctor Profile to Time-Off** | `1 : N` (Zero or Many) | `doctor_profile` | `doctor_time_off` | `doctor_time_off.doctor_id` | Required (`NOT NULL`) |
| **Patient to Appointment** | `1 : N` (Zero or Many) | `user` | `appointment` | `appointment.patient_id` | Required (`NOT NULL`) |
| **Doctor Profile to Appointment** | `1 : N` (Zero or Many) | `doctor_profile` | `appointment` | `appointment.doctor_id` | Required (`NOT NULL`) |
| **Appointment to Review** | `1 : 1` (Zero or One) | `appointment` | `review` | `review.appointment_id` | Required, Unique (`NOT NULL`, `UNIQUE`) |
| **Patient to Review** | `1 : N` (Zero or Many) | `user` | `review` | `review.patient_id` | Required (`NOT NULL`) |
| **Doctor Profile to Review** | `1 : N` (Zero or Many) | `doctor_profile` | `review` | `review.doctor_id` | Required (`NOT NULL`) |
| **User to Notification** | `1 : N` (Zero or Many) | `user` | `notification` | `notification.user_id` | Required (`NOT NULL`) |

---

## 3. Structural Analysis & Design Rationale

### 3.1. User Role Polymorphism vs. Specialized Extension
The design isolates base authentication concerns (`id`, `name`, `email`, `role`) within `user`, while extending medical domain properties (`specialty_id`, `consultation_fee`, `bio`) into the 1-to-1 child table `doctor_profile`:
- Patients remain lightweight records with no extraneous empty doctor fields.
- Administrators utilize the core `user` table without needing synthetic clinical rows.
- Doctors enjoy relational integrity (`doctor_profile.user_id` is both `NOT NULL` and `UNIQUE`).

### 3.2. Appointment Slot Integrity
Appointments link `patient_id` directly to `user.id`, and `doctor_id` to `doctor_profile.id`. The critical constraint `idx_unique_doctor_slot (doctor_id, appointment_date, start_time)` operates directly on the `appointment` table:
- Even if two patients request the same 10:00 AM slot on 2026-11-01 simultaneously, the PostgreSQL B-tree index rejects the second transaction with error code `23505` (unique violation).

### 3.3. Review Verification Boundary
The `review` table requires a non-null, unique foreign key `appointment_id`:
- Prevents spam reviews: A review can never exist without a corresponding valid consultation record.
- Prevents review duplication: An appointment cannot be evaluated twice.
- Enforces patient validity: The service layer asserts that `appointment.status == 'completed'` before permitting review creation.
