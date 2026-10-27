# ScheduleProject

# Schedule Project Module
## ER Diagram Documentation
### 1. Project Overview
The Schedule Project Module is designed to manage user registration, patient and doctor profiles, doctor availability, and appointment scheduling. The system organizes user information and defines relationships between patients, doctors, availability slots, and appointments.

### 2. Objectives
- Manage user registration and authentication.
- Maintain separate patient and doctor profiles.
- Store doctors' weekly availability.
- Allow patients to book appointments with doctors.
- Track appointment statuses.
- Maintain clear relationships between database entities.
### 3. Database Entities
#### 3.1 User
Stores common information for authentication and user identification.

**Attributes:**

- `id`  — Primary Key
- `name` 
- `email`  — Unique
- `password` 
- `role`  — Patient, Doctor, or Admin
#### 3.2 Patient
Stores information specific to patients.

**Attributes:**

- `id`  — Primary Key
- `user_id`  — Foreign Key referencing User.id
- `phone` 
- `date_of_birth` 
- `gender` 
**Relationship:** Each patient profile belongs to one user.

#### 3.3 Doctor
Stores information specific to doctors.

**Attributes:**

- `id`  — Primary Key
- `user_id`  — Foreign Key referencing User.id
- `specialty` 
- `license_no` 
- `phone` 
**Relationship:** Each doctor profile belongs to one user.

#### 3.4 Availability
Stores the weekly availability schedule of doctors.

**Attributes:**

- `id`  — Primary Key
- `doctor_id`  — Foreign Key referencing Doctor.id
- `day_of_week` 
- `start_time` 
- `end_time` 
**Relationship:** One doctor can have multiple availability records.

#### 3.5 Appointment
Stores appointment details for patients and doctors.

**Attributes:**

- `id`  — Primary Key
- `patient_id`  — Foreign Key referencing Patient.id
- `doctor_id`  — Foreign Key referencing Doctor.id
- `availability_id`  — Foreign Key referencing Availability.id
- `appointment_date` 
- `status`  — Booked, Cancelled, Completed, or No-show
**Relationship:** Each appointment connects one patient, one doctor, and one availability slot.

### 4. Entity Relationships
1. **User → Patient:** One-to-one relationship.
2. **User → Doctor:** One-to-one relationship.
3. **Doctor → Availability:** One-to-many relationship.
4. **Patient → Appointment:** One-to-many relationship.
5. **Doctor → Appointment:** One-to-many relationship.
6. **Availability → Appointment:** One-to-many relationship.
### 5. Scheduling Rules
- Every appointment must be associated with a patient and a doctor.
- Every appointment must reference a specific availability record.
- Doctors can define recurring weekly availability.
- Appointment status can be Booked, Cancelled, Completed, or No-show.
- The system must prevent overlapping appointments for the same doctor.
- Appointment booking must be restricted to the doctor's available schedule.
### 6. Database Design Principles
- Primary keys uniquely identify records.
- Foreign keys maintain referential integrity.
- Unique constraints should be applied to user email and the one-to-one profile relationships.
- Passwords must be stored securely as hashes, not as plain text.
- Appropriate validation must prevent invalid appointment times and double-booking.
### 7. Technology Context
- **Backend:** NestJS
- **API Testing:** Hoppscotch
- **Database:** Relational database
- **Authentication:** Email or phone registration, with support for Google OAuth where required.
### 8. Conclusion
The ER diagram provides a simple database structure for the Schedule Project Module. It separates common user information from patient and doctor profiles while connecting doctor availability to patient appointments. This structure serves as a foundation for implementing registration, onboarding, availability management, and appointment scheduling.

