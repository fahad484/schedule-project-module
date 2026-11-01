# REST API Documentation

This document provides exhaustive documentation for all REST API endpoints available in the Appointment Booking System under `/api/v1` and the authentication endpoints under `/api/auth`.

---

## 1. Global Standards & Conventions

### 1.1. Base URLs
- **Development**: `http://localhost:3000`
- **Production**: `https://<your-domain>.com`

### 1.2. Headers
All requests containing JSON bodies must include:
```http
Content-Type: application/json
```
For authenticated requests, session cookies are automatically transported by browsers and HTTP clients. Alternatively, Better Auth supports bearer tokens where configured.

### 1.3. Standard Response Formats

#### Success Response Envelope (`ApiResponse<T>`)
```json
{
  "success": true,
  "data": { ... }
}
```

#### Paginated Response Envelope (`PaginatedResponse<T>`)
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

#### Error Response Envelope
```json
{
  "success": false,
  "error": "Detailed error message"
}
```

### 1.4. HTTP Status Codes
| Status | Meaning | Typical Usage |
| :--- | :--- | :--- |
| `200 OK` | Request succeeded | Successful GET, PUT, or mutation. |
| `201 Created` | Resource created | Successful entity insertion (POST). |
| `400 Bad Request` | Client validation failure | Invalid Zod schema or missing required fields. |
| `401 Unauthorized` | Unauthenticated | No active session or missing auth cookie. |
| `403 Forbidden` | Insufficient permissions | Role insufficient (e.g. non-admin accessing admin route). |
| `404 Not Found` | Resource not located | Specified ID does not exist. |
| `409 Conflict` | Concurrency or business conflict | Double-booking slot conflict, duplicate email, etc. |
| `500 Server Error` | Internal exception | Unhandled server error or database disconnection. |

---

## 2. Authentication Endpoints (`/api/auth`)

Authentication is powered by [Better Auth](file:///c:/Users/Hp/OneDrive/Apps/appointment-booking/src/lib/auth.ts) and mounted under `/api/auth/*`.

### 2.1. Sign Up (Register New User)
- **Method**: `POST`
- **Path**: `/api/auth/sign-up` (or `/api/auth/sign-up/email`)
- **Authentication Required**: No
- **Role Required**: None

#### Request Body
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "password": "SecurePassword123!",
  "role": "patient",
  "phone": "+1-555-0199"
}
```

#### Response: `200 OK` / `201 Created`
```json
{
  "user": {
    "id": "usr_98a7bc12e4",
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "emailVerified": false,
    "role": "patient",
    "phone": "+1-555-0199",
    "createdAt": "2026-10-28T10:00:00.000Z"
  },
  "token": "sess_tok_991823abce"
}
```

---

### 2.2. Sign In (Login)
- **Method**: `POST`
- **Path**: `/api/auth/sign-in` (or `/api/auth/sign-in/email`)
- **Authentication Required**: No
- **Role Required**: None

#### Request Body
```json
{
  "email": "jane.doe@example.com",
  "password": "SecurePassword123!"
}
```

#### Response: `200 OK`
```json
{
  "user": {
    "id": "usr_98a7bc12e4",
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "role": "patient"
  },
  "token": "sess_tok_991823abce"
}
```

---

### 2.3. Get Current Session
- **Method**: `GET`
- **Path**: `/api/auth/get-session` (or `/api/auth/session`)
- **Authentication Required**: Yes
- **Role Required**: Any authenticated user

#### Response: `200 OK`
```json
{
  "session": {
    "id": "sess_987123",
    "userId": "usr_98a7bc12e4",
    "expiresAt": "2026-11-04T10:00:00.000Z"
  },
  "user": {
    "id": "usr_98a7bc12e4",
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "role": "patient",
    "phone": "+1-555-0199"
  }
}
```

---

### 2.4. Sign Out (Logout)
- **Method**: `POST`
- **Path**: `/api/auth/sign-out`
- **Authentication Required**: Yes
- **Role Required**: Any authenticated user

#### Response: `200 OK`
```json
{
  "success": true
}
```

---

## 3. Specialties Endpoints (`/api/v1/specialties`)

### 3.1. List All Specialties
- **Method**: `GET`
- **Path**: `/api/v1/specialties`
- **Authentication Required**: No
- **Role Required**: Public

#### Response: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "name": "Cardiology",
      "description": "Comprehensive cardiac and vascular care",
      "icon": "Heart",
      "createdAt": "2026-10-28T09:00:00.000Z"
    },
    {
      "id": "b1ffcd88-8b1a-4de7-aa5c-5aa8ac270b22",
      "name": "Dermatology",
      "description": "Skin health, surgery, and therapeutic care",
      "icon": "Sparkles",
      "createdAt": "2026-10-28T09:00:00.000Z"
    }
  ]
}
```

---

### 3.2. Create Specialty
- **Method**: `POST`
- **Path**: `/api/v1/specialties`
- **Authentication Required**: Yes
- **Role Required**: `admin`

#### Request Body
```json
{
  "name": "Neurology",
  "description": "Brain and central nervous system specialists",
  "icon": "Brain"
}
```

#### Response: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "c2eedd77-7a2b-4cd6-994b-4bb7bd160c33",
    "name": "Neurology",
    "description": "Brain and central nervous system specialists",
    "icon": "Brain",
    "createdAt": "2026-10-28T12:00:00.000Z"
  }
}
```

---

### 3.3. Get Specialty by ID
- **Method**: `GET`
- **Path**: `/api/v1/specialties/:id`
- **Authentication Required**: No
- **Role Required**: Public

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "name": "Cardiology",
    "description": "Comprehensive cardiac and vascular care",
    "icon": "Heart",
    "createdAt": "2026-10-28T09:00:00.000Z"
  }
}
```

---

### 3.4. Update Specialty
- **Method**: `PUT`
- **Path**: `/api/v1/specialties/:id`
- **Authentication Required**: Yes
- **Role Required**: `admin`

#### Request Body
```json
{
  "name": "Cardiovascular Medicine",
  "description": "Updated cardiac clinical scope"
}
```

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "name": "Cardiovascular Medicine",
    "description": "Updated cardiac clinical scope",
    "icon": "Heart"
  }
}
```

---

### 3.5. Delete Specialty
- **Method**: `DELETE`
- **Path**: `/api/v1/specialties/:id`
- **Authentication Required**: Yes
- **Role Required**: `admin`

#### Response: `200 OK`
```json
{
  "success": true,
  "message": "Specialty deleted successfully"
}
```

---

## 4. Doctor Public Discovery Endpoints (`/api/v1/doctors`)

### 4.1. Search & Filter Doctors
- **Method**: `GET`
- **Path**: `/api/v1/doctors`
- **Authentication Required**: No
- **Role Required**: Public
- **Query Parameters**:
  - `search` (string, optional): Doctor name search term.
  - `specialtyId` (UUID string, optional): Filter by specialty UUID.
  - `page` (number, optional, default: 1): Page number.
  - `limit` (number, optional, default: 10): Results per page.

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "d1a11111-2222-3333-4444-555555555555",
        "userId": "usr_doc_101",
        "name": "Dr. Sarah Jenkins",
        "email": "sarah.jenkins@hospital.org",
        "image": "https://example.com/avatar.jpg",
        "specialtyName": "Cardiology",
        "specialtyId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "bio": "Fellow of the American College of Cardiology with 14 years clinical experience.",
        "qualifications": "MD, FACC",
        "experienceYears": 14,
        "consultationFee": "150.00",
        "hospitalAffiliation": "Metropolitan Heart Institute",
        "isAcceptingPatients": true,
        "averageRating": "4.85",
        "totalReviews": 38
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 4.2. Get Doctor Details by ID
- **Method**: `GET`
- **Path**: `/api/v1/doctors/:id`
- **Authentication Required**: No
- **Role Required**: Public

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "d1a11111-2222-3333-4444-555555555555",
    "userId": "usr_doc_101",
    "bio": "Fellow of the American College of Cardiology...",
    "qualifications": "MD, FACC",
    "experienceYears": 14,
    "consultationFee": "150.00",
    "hospitalAffiliation": "Metropolitan Heart Institute",
    "isAcceptingPatients": true,
    "averageRating": "4.85",
    "totalReviews": 38,
    "user": {
      "id": "usr_doc_101",
      "name": "Dr. Sarah Jenkins",
      "email": "sarah.jenkins@hospital.org",
      "image": "https://example.com/avatar.jpg"
    },
    "specialty": {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "name": "Cardiology"
    }
  }
}
```

---

### 4.3. Get Doctor Weekly Availability
- **Method**: `GET`
- **Path**: `/api/v1/doctors/:id/availability`
- **Authentication Required**: No
- **Role Required**: Public

#### Response: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "av_1111-2222-3333",
      "doctorId": "d1a11111-2222-3333-4444-555555555555",
      "dayOfWeek": "monday",
      "startTime": "09:00:00",
      "endTime": "17:00:00",
      "slotDurationMinutes": 30,
      "isActive": true
    },
    {
      "id": "av_4444-5555-6666",
      "doctorId": "d1a11111-2222-3333-4444-555555555555",
      "dayOfWeek": "wednesday",
      "startTime": "10:00:00",
      "endTime": "16:00:00",
      "slotDurationMinutes": 30,
      "isActive": true
    }
  ]
}
```

---

### 4.4. Get Real-Time Time Slots for Date
- **Method**: `GET`
- **Path**: `/api/v1/doctors/:id/slots`
- **Authentication Required**: No
- **Role Required**: Public
- **Query Parameters**:
  - `date` (string, required): Target date in `YYYY-MM-DD` format (e.g. `?date=2026-11-02`).

#### Response: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "start": "09:00",
      "end": "09:30",
      "isAvailable": true
    },
    {
      "start": "09:30",
      "end": "10:00",
      "isAvailable": false
    },
    {
      "start": "10:00",
      "end": "10:30",
      "isAvailable": true
    }
  ]
}
```

---

### 4.5. Get Doctor Reviews
- **Method**: `GET`
- **Path**: `/api/v1/doctors/:id/reviews`
- **Authentication Required**: No
- **Role Required**: Public
- **Query Parameters**:
  - `page` (number, optional, default: 1)
  - `limit` (number, optional, default: 10)

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "rev_7777-8888-9999",
        "appointmentId": "apt_3333-4444-5555",
        "patientId": "usr_98a7bc12e4",
        "rating": 5,
        "comment": "Exceptional bedside manner, extremely thorough diagnostic check.",
        "createdAt": "2026-10-25T14:30:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

## 5. Doctor Profile & Schedule Management (`/api/v1/doctors/profile`, `/availability`)

### 5.1. Get Authenticated Doctor's Own Profile
- **Method**: `GET`
- **Path**: `/api/v1/doctors/profile`
- **Authentication Required**: Yes
- **Role Required**: `doctor`

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "d1a11111-2222-3333-4444-555555555555",
    "userId": "usr_doc_101",
    "specialtyId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "bio": "Detailed doctor credentials...",
    "consultationFee": "150.00",
    "experienceYears": 14,
    "isAcceptingPatients": true
  }
}
```

---

### 5.2. Create Doctor Profile (Onboarding)
- **Method**: `POST`
- **Path**: `/api/v1/doctors/profile`
- **Authentication Required**: Yes
- **Role Required**: `doctor`

#### Request Body
```json
{
  "specialtyId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "bio": "Board-certified specialist practicing in cardiology with over 10 years experience.",
  "qualifications": "MD, PhD",
  "experienceYears": 10,
  "consultationFee": 120.00,
  "hospitalAffiliation": "Saint Jude General Hospital",
  "isAcceptingPatients": true
}
```

#### Response: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "d1a11111-2222-3333-4444-555555555555",
    "userId": "usr_doc_101",
    "consultationFee": "120.00",
    "isAcceptingPatients": true
  }
}
```

---

### 5.3. Update Doctor Profile
- **Method**: `PUT`
- **Path**: `/api/v1/doctors/profile`
- **Authentication Required**: Yes
- **Role Required**: `doctor`

#### Request Body
```json
{
  "consultationFee": 140.00,
  "isAcceptingPatients": false
}
```

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "d1a11111-2222-3333-4444-555555555555",
    "consultationFee": "140.00",
    "isAcceptingPatients": false
  }
}
```

---

### 5.4. Set Weekly Shift Availability
- **Method**: `POST`
- **Path**: `/api/v1/doctors/availability`
- **Authentication Required**: Yes
- **Role Required**: `doctor`

#### Request Body
```json
{
  "dayOfWeek": "monday",
  "startTime": "09:00",
  "endTime": "17:00",
  "slotDurationMinutes": 30
}
```

#### Response: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "av_998877",
    "doctorId": "d1a11111-2222-3333-4444-555555555555",
    "dayOfWeek": "monday",
    "startTime": "09:00:00",
    "endTime": "17:00:00",
    "slotDurationMinutes": 30,
    "isActive": true
  }
}
```

---

### 5.5. Remove Availability Shift
- **Method**: `DELETE`
- **Path**: `/api/v1/doctors/availability/:id`
- **Authentication Required**: Yes
- **Role Required**: `doctor`

#### Response: `200 OK`
```json
{
  "success": true,
  "message": "Availability removed successfully"
}
```

---

## 6. Appointments Endpoints (`/api/v1/appointments`)

### 6.1. List User Appointments
- **Method**: `GET`
- **Path**: `/api/v1/appointments`
- **Authentication Required**: Yes
- **Role Required**: `patient` (returns patient's bookings) or `doctor` (returns doctor's agenda)
- **Query Parameters**:
  - `status` (string, optional): `scheduled`, `confirmed`, `completed`, `cancelled`, or `all`.
  - `date` (string, optional, for doctors): Filter agenda by specific date (`YYYY-MM-DD`).

#### Response: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "appointment": {
        "id": "apt_3333-4444-5555",
        "appointmentDate": "2026-11-05",
        "startTime": "10:00:00",
        "endTime": "10:30:00",
        "status": "scheduled",
        "reason": "Annual cardiovascular wellness check"
      },
      "doctorName": "Dr. Sarah Jenkins",
      "doctorEmail": "sarah.jenkins@hospital.org",
      "specialtyName": "Cardiology",
      "consultationFee": "150.00"
    }
  ]
}
```

---

### 6.2. Book New Appointment
- **Method**: `POST`
- **Path**: `/api/v1/appointments`
- **Authentication Required**: Yes
- **Role Required**: `patient`

#### Request Body
```json
{
  "doctorId": "d1a11111-2222-3333-4444-555555555555",
  "appointmentDate": "2026-11-05",
  "startTime": "10:00",
  "endTime": "10:30",
  "reason": "Frequent palpitations and mild dizziness"
}
```

#### Response: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "apt_3333-4444-5555",
    "patientId": "usr_98a7bc12e4",
    "doctorId": "d1a11111-2222-3333-4444-555555555555",
    "appointmentDate": "2026-11-05",
    "startTime": "10:00:00",
    "endTime": "10:30:00",
    "status": "scheduled",
    "reason": "Frequent palpitations and mild dizziness",
    "createdAt": "2026-10-28T14:00:00.000Z"
  }
}
```

#### Error: `409 Conflict` (Double Booking Intercepted)
```json
{
  "success": false,
  "error": "This time slot was just booked by another patient. Please select a different time."
}
```

---

### 6.3. Get Appointment Details by ID
- **Method**: `GET`
- **Path**: `/api/v1/appointments/:id`
- **Authentication Required**: Yes
- **Role Required**: Owner (`patient`), assigned `doctor`, or `admin`

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "appointment": {
      "id": "apt_3333-4444-5555",
      "appointmentDate": "2026-11-05",
      "startTime": "10:00:00",
      "endTime": "10:30:00",
      "status": "scheduled",
      "reason": "Frequent palpitations and mild dizziness"
    },
    "patientName": "Jane Doe",
    "patientEmail": "jane.doe@example.com"
  }
}
```

---

### 6.4. Cancel Appointment
- **Method**: `POST`
- **Path**: `/api/v1/appointments/:id/cancel`
- **Authentication Required**: Yes
- **Role Required**: Owner (`patient`), assigned `doctor`, or `admin`

#### Request Body
```json
{
  "reason": "Unavoidable business trip schedule conflict"
}
```

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "apt_3333-4444-5555",
    "status": "cancelled",
    "cancelledAt": "2026-10-28T15:00:00.000Z",
    "cancellationReason": "Unavoidable business trip schedule conflict"
  }
}
```

---

### 6.5. Reschedule Appointment
- **Method**: `POST`
- **Path**: `/api/v1/appointments/:id/reschedule`
- **Authentication Required**: Yes
- **Role Required**: `patient` (or assigned `doctor`)

#### Request Body
```json
{
  "appointmentDate": "2026-11-08",
  "startTime": "11:00",
  "endTime": "11:30"
}
```

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "apt_new_9999-0000",
    "appointmentDate": "2026-11-08",
    "startTime": "11:00:00",
    "endTime": "11:30:00",
    "status": "scheduled"
  }
}
```

---

### 6.6. Confirm Appointment
- **Method**: `POST`
- **Path**: `/api/v1/appointments/:id/confirm`
- **Authentication Required**: Yes
- **Role Required**: `doctor`

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "apt_3333-4444-5555",
    "status": "confirmed"
  }
}
```

---

### 6.7. Complete Appointment
- **Method**: `POST`
- **Path**: `/api/v1/appointments/:id/complete`
- **Authentication Required**: Yes
- **Role Required**: `doctor`

#### Request Body
```json
{
  "notes": "Patient advised to reduce caffeine intake. Resting ECG normal. Follow up in 6 months."
}
```

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "apt_3333-4444-5555",
    "status": "completed",
    "notes": "Patient advised to reduce caffeine intake..."
  }
}
```

---

## 7. Reviews Endpoints (`/api/v1/reviews`)

### 7.1. Submit Appointment Review
- **Method**: `POST`
- **Path**: `/api/v1/reviews`
- **Authentication Required**: Yes
- **Role Required**: `patient` (who attended the appointment)

#### Request Body
```json
{
  "appointmentId": "apt_3333-4444-5555",
  "rating": 5,
  "comment": "Doctor Jenkins was attentive, punctual, and reassuring."
}
```

#### Response: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "rev_7777-8888-9999",
    "appointmentId": "apt_3333-4444-5555",
    "doctorId": "d1a11111-2222-3333-4444-555555555555",
    "patientId": "usr_98a7bc12e4",
    "rating": 5,
    "comment": "Doctor Jenkins was attentive, punctual, and reassuring.",
    "createdAt": "2026-10-28T16:00:00.000Z"
  }
}
```

---

## 8. Notifications Endpoints (`/api/v1/notifications`)

### 8.1. Get User Notifications
- **Method**: `GET`
- **Path**: `/api/v1/notifications`
- **Authentication Required**: Yes
- **Role Required**: Any authenticated user
- **Query Parameters**:
  - `page` (number, optional, default: 1)
  - `limit` (number, optional, default: 20)

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "notif_112233",
        "userId": "usr_98a7bc12e4",
        "type": "appointment_booked",
        "title": "Appointment Booked",
        "message": "Your appointment with Dr. Sarah Jenkins on 2026-11-05 at 10:00 has been booked.",
        "isRead": false,
        "createdAt": "2026-10-28T14:00:00.000Z"
      }
    ],
    "total": 1,
    "unread": 1
  }
}
```

---

### 8.2. Mark Notification as Read
- **Method**: `POST`
- **Path**: `/api/v1/notifications/:id/read`
- **Authentication Required**: Yes
- **Role Required**: Owner of notification

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "notif_112233",
    "isRead": true
  }
}
```

---

### 8.3. Mark All Notifications as Read
- **Method**: `POST`
- **Path**: `/api/v1/notifications/read-all`
- **Authentication Required**: Yes
- **Role Required**: Any authenticated user

#### Response: `200 OK`
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## 9. Administrator Endpoints (`/api/v1/admin`)

All administrator endpoints require session validation with `role === 'admin'`. Unauthorized or non-admin attempts receive `401 Unauthorized` or `403 Forbidden: insufficient permissions`.

### 9.1. Get Administrative Overview Metrics
- **Method**: `GET`
- **Path**: `/api/v1/admin/stats`
- **Authentication Required**: Yes
- **Role Required**: `admin`

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "totalUsers": 128,
    "totalDoctors": 18,
    "totalPatients": 110,
    "totalAppointments": 420,
    "upcomingAppointments": 64,
    "completedAppointments": 312,
    "cancelledAppointments": 44,
    "totalRevenue": 46800.00
  }
}
```

---

### 9.2. List All Users (Paginated)
- **Method**: `GET`
- **Path**: `/api/v1/admin/users`
- **Authentication Required**: Yes
- **Role Required**: `admin`
- **Query Parameters**:
  - `page` (number, default: 1)
  - `limit` (number, default: 10)

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "usr_98a7bc12e4",
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "role": "patient",
        "createdAt": "2026-10-28T10:00:00.000Z"
      }
    ],
    "total": 128
  }
}
```

---

### 9.3. Update User Role
- **Method**: `PUT`
- **Path**: `/api/v1/admin/users/:id/role`
- **Authentication Required**: Yes
- **Role Required**: `admin`

#### Request Body
```json
{
  "role": "doctor"
}
```

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "usr_98a7bc12e4",
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "role": "doctor"
  }
}
```

---

### 9.4. List All Appointments (System-wide)
- **Method**: `GET`
- **Path**: `/api/v1/admin/appointments`
- **Authentication Required**: Yes
- **Role Required**: `admin`
- **Query Parameters**:
  - `status` (string, optional): `scheduled`, `confirmed`, `completed`, `cancelled`, or `all`
  - `page` (number, default: 1)
  - `limit` (number, default: 10)

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "apt_3333-4444-5555",
        "patientId": "usr_98a7bc12e4",
        "doctorId": "d1a11111-2222-3333-4444-555555555555",
        "appointmentDate": "2026-11-05",
        "startTime": "10:00:00",
        "endTime": "10:30:00",
        "status": "scheduled",
        "reason": "Frequent palpitations"
      }
    ],
    "total": 420
  }
}
```
