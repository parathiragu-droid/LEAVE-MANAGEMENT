# Leave Management System

A robust, enterprise-ready full-stack Leave Management System engineered with **Spring Boot 3**, **Spring Security 6**, **MongoDB**, and **React 18** with **Vite**.

Designed with a unified authentication paradigm, role-based access control (RBAC), strict employee privacy protections, and production security readiness.

---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Roles & Permissions](#roles--permissions)
- [Architecture](#architecture)
  - [Single Shared Login Architecture](#single-shared-login-architecture)
  - [Employee Privacy Protections](#employee-privacy-protections)
  - [Employee Record Isolation](#employee-record-isolation)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Local Setup](#local-setup)
  - [Prerequisites](#prerequisites)
  - [MongoDB Setup](#mongodb-setup)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Running Tests](#running-tests)
- [Production Build](#production-build)
- [Deployment Configuration](#deployment-configuration)
  - [Deployment Architecture (Split Deployment)](#deployment-architecture-split-deployment)
  - [Step-by-Step Deployment Order](#step-by-step-deployment-order)
- [Security Notes & Production Readiness](#security-notes--production-readiness)

---

## Overview

The Leave Management System streamlines employee time-off workflows while giving administrators oversight and review controls. The system enforces strict separation of concerns, complete employee record isolation, and confidential administrator identity masking so employees never see private administrative emails or IDs.

---

## Features

- **Unified Authentication**: Single secure login entrypoint (`/login`) for both Employees and Administrators. Role determination and redirection occur automatically post-authentication.
- **Role-Based Access Control (RBAC)**: Secure endpoint authorization using Spring Security `@PreAuthorize("hasRole('...')")`.
- **Leave Request Management**: Full CRUD capabilities for employees (create, list, inspect, edit, cancel).
- **Admin Review Workflow**: Pending request queue, comprehensive request inspection, approve/reject actions with review comments.
- **Real-Time Leave Metrics**: Overview cards for total, pending, approved, and rejected leave requests for both administrators and employees.
- **Employee Privacy Shield**: Employees receive only `"Administrator"` as the reviewer display name; internal admin account emails and identifiers are strictly omitted from employee-facing payloads.
- **Escalation Guards**: Public user registration and profile self-service endpoints reject or ignore unauthorized role escalation attempts.
- **Production-Ready Configuration**: Dedicated `prod` profile with strict environment variable bindings and zero hardcoded fallback secrets.

---

## Roles & Permissions

| Capability | EMPLOYEE | ADMIN |
| :--- | :---: | :---: |
| Self-Registration (Public) | Yes (Always assigned `EMPLOYEE`) | No (Configured via deployment env) |
| Login via `/login` | Yes | Yes |
| Apply for Leave | Yes | No |
| View Own Leave Requests | Yes | No |
| Edit Pending Leave Request | Yes (Own requests only) | No |
| Cancel Pending Leave Request | Yes (Own requests only) | No |
| View Other Employee Requests | No (Secure 404/403) | Yes (All requests) |
| Approve / Reject Leave | No (Forbidden 403) | Yes |
| View Leave Summary Metrics | Yes (Personal metrics) | Yes (System-wide metrics) |
| View Employee Directory | No | Yes |
| Profile View & Update | Yes (Name only) | Yes (Name only) |

---

## Architecture

### Single Shared Login Architecture

The application strictly implements **ONE single login page**: `/login`.

```
                    ┌────────────────────────┐
                    │      Shared Login      │
                    │         /login         │
                    └───────────┬────────────┘
                                │ POST /api/auth/login
                                ▼
                    ┌────────────────────────┐
                    │  Spring Boot Backend   │
                    │  (Evaluates JWT & Role)│
                    └───────────┬────────────┘
                                │
             ┌──────────────────┴──────────────────┐
             │ Role: EMPLOYEE                      │ Role: ADMIN
             ▼                                     ▼
┌────────────────────────┐            ┌────────────────────────┐
│   Employee Dashboard   │            │    Admin Dashboard     │
│  /employee/dashboard   │            │    /admin/dashboard    │
└────────────────────────┘            └────────────────────────┘
```

- **No separate admin login page.**
- **No "Admin Login" button or selector dropdown.**
- **No public admin registration option.**
- When a user logs in, the backend evaluates credentials, issues a signed JWT containing the verified role, and the frontend React router navigates the user to their designated dashboard.

### Employee Privacy Protections

When an administrator reviews a leave request, the backend stores audit metadata (`reviewedBy`, `reviewedByName`, `reviewedAt`). However, when employee endpoints (`/api/leaves/**`) return leave data:
- `reviewedBy` (admin email) is omitted.
- `reviewedByName` is omitted.
- Internal admin IDs are omitted.
- `reviewerDisplayName` is set to `"Administrator"`.

Admin endpoints (`/api/admin/leaves/**`) retain complete audit trail visibility for managerial accountability.

### Employee Record Isolation

Every employee request is strictly filtered by the authenticated user's ID extracted from the validated JWT:
- Employee B attempting to access `GET /api/leaves/{employeeA_leaveId}` receives `404 Not Found`.
- Employee B attempting to update or cancel Employee A's request receives `404 Not Found`.
- No database existence leaks occur across tenant boundaries.

---

## Technology Stack

- **Frontend**:
  - React 18
  - Vite
  - React Router DOM v6
  - Axios (Centralized API client with interceptors)
  - Vanilla CSS (Tailored HSL design system, responsive cards, modals, toast notifications)
- **Backend**:
  - Java 21 LTS
  - Spring Boot 3.4.3
  - Spring Security 6 (Stateless JWT Bearer authentication)
  - Spring Data MongoDB
  - JJWT (JSON Web Token 0.12.6)
  - BCrypt Password Hashing
  - Lombok
  - Maven Wrapper
- **Database**:
  - MongoDB 7.0+ (Local standalone or MongoDB Atlas cluster)

---

## Project Structure

```
leave-management-system/
├── .env.example                     # Root environment variable template
├── .gitignore                       # Root Git ignore rules
├── README.md                        # Documentation and architecture guide
│
├── backend/
│   ├── .env.example                 # Backend environment variable template
│   ├── .gitignore                   # Backend Git ignore rules
│   ├── mvnw / mvnw.cmd              # Maven wrapper executables
│   ├── pom.xml                      # Maven project configuration
│   ├── start_backend.ps1            # Safe startup script (reads from env)
│   └── src/
│       ├── main/
│       │   ├── java/com/leavemanagement/
│       │   │   ├── config/          # CorsConfig, AdminAccountInitializer, MongoIndexInitializer
│       │   │   ├── controller/      # Auth, Leave, AdminLeave, Profile, Health
│       │   │   ├── dto/             # Request & Response Data Transfer Objects
│       │   │   ├── exception/       # GlobalExceptionHandler & custom exceptions
│       │   │   ├── model/           # MongoDB Documents (User, LeaveRequest, Role, LeaveStatus)
│       │   │   ├── repository/      # Mongo Repositories
│       │   │   ├── security/        # JwtService, JwtAuthFilter, SecurityConfig
│       │   │   └── service/         # Business logic & implementation
│       │   └── resources/
│       │       ├── application.properties       # Base/development configuration
│       │       └── application-prod.properties  # Strict production profile
│       └── test/                    # 48 Automated unit & controller slice tests
│
└── frontend/
    ├── .env                         # Local frontend environment file
    ├── .env.example                 # Frontend environment template
    ├── .gitignore                   # Frontend Git ignore rules
    ├── index.html                   # HTML template
    ├── package.json                 # Node dependencies and scripts
    ├── vite.config.js               # Vite configuration
    └── src/
        ├── components/              # Navbar, NotificationToast, StatCard, Modal, StatusBadge
        ├── context/                 # AuthContext (state management, session persistence)
        ├── pages/                   # Login, Register, Employee Dashboard, Admin Dashboard, Profile
        ├── services/                # api.js (Axios instance), authService, leaveService, adminService
        └── utils/                   # Constants, date helpers, status validators
```

---

## Environment Variables

### Backend Configuration Variables

| Variable Name | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `MONGODB_URI` | **Yes** | `mongodb://localhost:27017/leave_management_db` (Dev) | MongoDB connection string (Atlas URI in production). |
| `JWT_SECRET` | **Yes** | *(Min 256-bit secure secret)* | HMAC-SHA secret for signing and validating JWT tokens. |
| `JWT_EXPIRATION` | No | `86400000` (24 hours) | Token validity lifespan in milliseconds. |
| `FRONTEND_URL` | **Yes** | `http://localhost:5173` (Dev) | Trusted frontend origin for strict CORS authorization. |
| `ADMIN1_EMAIL` | Optional | `admin1@yourcompany.com` | Primary initial administrator account email. |
| `ADMIN1_PASSWORD`| Optional | *(Strong password)* | Initial password for primary admin (BCrypt-hashed on creation). |
| `ADMIN2_EMAIL` | Optional | `admin2@yourcompany.com` | Secondary initial administrator account email. |
| `ADMIN2_PASSWORD`| Optional | *(Strong password)* | Initial password for secondary admin (BCrypt-hashed on creation). |
| `PORT` | No | `8080` | Server listening port. |
| `SPRING_PROFILES_ACTIVE` | No | `prod` (Production) | Set to `prod` to activate strict production validation. |

### Frontend Configuration Variables

| Variable Name | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | **Yes** | `http://localhost:8080/api` | Target Spring Boot backend API base URL (no trailing slash). |

> [!IMPORTANT]
> Never commit actual passwords, tokens, or MongoDB credentials to GitHub or version control. Store actual production values exclusively in secure deployment environment variables or secret vaults.

---

## Local Setup

### Prerequisites
- **Java**: JDK 21 LTS installed and configured (`java -version`)
- **Node.js**: Node.js 18+ and npm installed (`node -v`)
- **MongoDB**: MongoDB 7.0+ running locally on port `27017`

### MongoDB Setup
Ensure local MongoDB daemon is running:
```bash
mongod --dbpath <data-directory-path>
```
Default connection URI: `mongodb://localhost:27017/leave_management_db`.

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd leave-management-system/backend
   ```
2. Copy `.env.example` to `.env` (optional for local development, as local fallbacks are provided for dev):
   ```bash
   cp .env.example .env
   ```
3. Set your environment variables (or supply them in PowerShell):
   ```powershell
   $env:ADMIN1_EMAIL = "parathiragu@gmail.com"
   $env:ADMIN1_PASSWORD = "YourSecurePasswordHere"
   $env:FRONTEND_URL = "http://localhost:5173"
   ```
4. Start the backend:
   ```powershell
   .\mvnw.cmd spring-boot:run
   ```
5. Confirm backend is operational:
   ```bash
   curl http://localhost:8080/api/health
   # Expected response: {"status":"UP"}
   ```

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd leave-management-system/frontend
   ```
2. Ensure `.env` is configured:
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Launch the development server:
   ```bash
   npm run dev
   ```
5. Open your browser at `http://localhost:5173`.

---

## Running Tests

### Backend Automated Test Suite
The backend contains 48 automated tests covering controller slices, security authentication, RBAC authorization, exception handlers, and business logic.

```bash
cd backend
./mvnw.cmd clean test
```

Expected result:
```
[INFO] Results:
[INFO] Tests run: 48, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

---

## Production Build

### 1. Backend Production Packaging
Compile and package the Spring Boot application into a standalone executable JAR:
```bash
cd backend
./mvnw.cmd clean package
```
The production archive will be generated at:
`backend/target/leave-management-backend-0.0.1-SNAPSHOT.jar`

To execute the packaged JAR with the production profile:
```bash
java -Dspring.profiles.active=prod -jar target/leave-management-backend-0.0.1-SNAPSHOT.jar
```
*(In production profile, missing `MONGODB_URI` or `JWT_SECRET` will immediately fail startup rather than using insecure defaults).*

### 2. Frontend Production Bundle
Create optimized static client assets:
```bash
cd frontend
npm run build
```
The production bundle will be generated in `frontend/dist/`.

---

## Deployment Configuration

### Deployment Architecture (Split Deployment)

A modern cloud architecture separating static frontend hosting from the Spring Boot API backend and managed database:

```
[ User Browser ]
       │
       ├─────────────────────────────────┐
       ▼                                 ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│  React Frontend Hosting  │   │   Spring Boot Backend    │
│  (Vercel / Cloudflare /  │   │  (Render / Railway / AWS │
│   Netlify / AWS S3)      │   │   ECS / App Runner)      │
│                          │   │                          │
│ VITE_API_BASE_URL =      │   │ FRONTEND_URL =           │
│ https://api.domain.com/api│   │ https://app.domain.com   │
└──────────────────────────┘   └─────────────┬────────────┘
                                             │
                                             ▼
                               ┌──────────────────────────┐
                               │     MongoDB Atlas        │
                               │    (Managed Cluster)     │
                               │                          │
                               │ MONGODB_URI =            │
                               │ mongodb+srv://...        │
                               └──────────────────────────┘
```

### Step-by-Step Deployment Order

1. **Provision Production MongoDB**:
   - Create a MongoDB Atlas cluster (M0 or dedicated).
   - Create a database user with readWrite privileges.
   - Configure Network Access (whitelist backend IP or `0.0.0.0/0` if deploying to dynamic cloud platforms).
   - Copy the SRV connection string: `mongodb+srv://<USER>:<PASS>@<CLUSTER>.mongodb.net/leave_management_db?retryWrites=true&w=majority`.

2. **Configure Backend Environment Variables**:
   Set the following environment variables in your cloud hosting environment (Render, Railway, AWS ECS, Heroku):
   ```
   SPRING_PROFILES_ACTIVE=prod
   PORT=8080
   MONGODB_URI=mongodb+srv://<USER>:<PASSWORD>@<CLUSTER>.mongodb.net/leave_management_db
   JWT_SECRET=<Generate a strong 256-bit cryptographic secret>
   JWT_EXPIRATION=86400000
   FRONTEND_URL=https://app.yourdomain.com
   ADMIN1_EMAIL=admin@yourdomain.com
   ADMIN1_PASSWORD=<StrongAdminPassword1>
   ADMIN2_EMAIL=admin2@yourdomain.com
   ADMIN2_PASSWORD=<StrongAdminPassword2>
   ```

3. **Deploy Backend**:
   - Deploy backend from GitHub or container image.
   - Verify health check endpoint:
     ```bash
     curl https://api.yourdomain.com/api/health
     # Expected response: {"status":"UP"}
     ```

4. **Configure & Deploy Frontend**:
   - In your frontend hosting platform (Vercel, Netlify, Cloudflare Pages), configure the environment variable:
     ```
     VITE_API_BASE_URL=https://api.yourdomain.com/api
     ```
   - Build command: `npm run build`
   - Output directory: `dist`
   - Deploy frontend and note your live URL (e.g., `https://app.yourdomain.com`).

5. **Finalize Backend CORS Configuration**:
   - Ensure the backend's `FRONTEND_URL` environment variable matches your live frontend domain (`https://app.yourdomain.com`).
   - If hosting on a preview domain, update `FRONTEND_URL` accordingly.

6. **End-to-End Verification**:
   - Navigate to `https://app.yourdomain.com/login`.
   - Test Employee flow: Register -> Login -> View Dashboard -> Apply Leave -> Edit Leave -> View Profile.
   - Test Admin flow: Login with `ADMIN1_EMAIL` / `ADMIN1_PASSWORD` -> View Admin Dashboard -> Approve/Reject Leave -> View Directory.
   - Verify employee view displays `"Administrator"` without leaking admin emails.

---

## Security Notes & Production Readiness

### Production Credential Rotation Policy
> [!WARNING]
> Because temporary development passwords and fallback keys may have been used locally during initial coding and debugging:
> 1. **Rotate Admin 1 Password**: Choose a unique, high-entropy password for production.
> 2. **Rotate Admin 2 Password**: Choose a unique, high-entropy password for production.
> 3. **Generate Fresh JWT Secret**: Generate a 256-bit or 512-bit cryptographically secure random key for `JWT_SECRET`.
> 4. **Use Dedicated MongoDB Atlas User**: Never reuse local development MongoDB credentials.

### Security Guarantees
- **No Production Secrets in Git**: All `.gitignore` files prevent `.env`, `.env.*`, `target/`, `node_modules/`, `dist/`, and `*.log` from tracking.
- **Fail-Fast Production Startup**: `application-prod.properties` requires `MONGODB_URI` and `JWT_SECRET`; omitting them prevents application startup.
- **No Wildcard CORS**: Authenticated endpoints explicitly restrict origins to `FRONTEND_URL` in production; wildcard origins (`*`) are disallowed.
- **Masked Stack Traces**: `GlobalExceptionHandler` returns sanitized, structured JSON error responses; internal database exceptions, stack traces, and filesystem paths are never leaked to clients.
- **No Passwords Logged**: Logging statements throughout controllers, services, and initializers exclusively log operational event IDs and sanitized emails.
