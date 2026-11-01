# Contributing Guidelines: Appointment Booking System

Thank you for contributing to the **Appointment Booking System**! We welcome contributions from developers of all skill levels. To maintain code quality, security, and developer productivity, please read and follow these guidelines.

---

## 1. Code of Conduct

All contributors are expected to uphold a welcoming, respectful, and inclusive environment. Harassment, derogatory comments, and unprofessional conduct will not be tolerated.

---

## 2. Local Development Setup

### 2.1. Prerequisites
Ensure you have the following installed on your local development machine:
- **Node.js**: `v20.x` or later (LTS recommended)
- **Package Manager**: `npm` (comes with Node) or `pnpm`
- **Git**: Latest version
- **Neon PostgreSQL Database**: A free account and database instance on [Neon](https://neon.tech)

### 2.2. Getting Started Step-by-Step

#### 1. Fork & Clone
```bash
git clone https://github.com/your-username/appointment-booking.git
cd appointment-booking
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Configure Environment Variables
Copy the `.env.example` file to create a local `.env.local` configuration:
```bash
cp .env.example .env.local
```

Open `.env.local` and configure your credentials:
```env
# Neon PostgreSQL Connection String (Use connection pooler endpoint for serverless)
DATABASE_URL="postgresql://neondb_owner:your_password@ep-example-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Better Auth Configuration
BETTER_AUTH_SECRET="generate-a-random-32-byte-hex-secret-here"
BETTER_AUTH_URL="http://localhost:3000"

# Application Public URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> [!TIP]
> You can generate a secure `BETTER_AUTH_SECRET` using OpenSSL or Node:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

#### 4. Run Database Migrations
Generate and apply Drizzle database migrations to your Neon database:
```bash
# Push schema directly in development
npm run db:push

# Or generate and run versioned migrations
npm run db:generate
npm run db:migrate
```

#### 5. Launch the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The application should load the public landing page.

---

## 3. Git Workflow & Branch Naming

We follow a feature-branch workflow. All changes must be developed on a dedicated branch branched off `main`.

### 3.1. Branch Naming Convention
Branches should use lowercase letters, numbers, and hyphens, preceded by a category prefix:

```text
<type>/<short-description>
```

| Prefix | Description | Example |
| :--- | :--- | :--- |
| `feature/` | New feature or functional enhancement | `feature/double-booking-prevention` |
| `bugfix/` | Bug or issue fix | `bugfix/slot-timezone-offset` |
| `hotfix/` | Critical production fix | `hotfix/session-cookie-expiry` |
| `refactor/` | Code refactoring without changing functionality | `refactor/availability-service-cleanup` |
| `docs/` | Documentation additions or updates | `docs/update-architecture-diagram` |
| `test/` | Adding or improving automated tests | `test/appointment-locking-tests` |
| `chore/` | Tooling, dependency updates, or chore work | `chore/update-drizzle-version` |

---

## 4. Commit Message Standards

We strictly adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### 4.1. Commit Format
```text
<type>(<scope>): <short description in present imperative tense>

[optional body providing technical rationale]

[optional footer(s), e.g., Closes #123]
```

### 4.2. Commit Types
- `feat`: A new user-facing or API feature.
- `fix`: A bug fix.
- `docs`: Documentation only changes.
- `style`: Changes that do not affect code logic (formatting, missing semicolons).
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `perf`: Code change that improves performance.
- `test`: Adding missing tests or correcting existing tests.
- `chore`: Changes to build process, package dependencies, or auxiliary tools.

### 4.3. Examples

**Good Commits**:
- `feat(booking): add row-level locking to prevent simultaneous slot reservations`
- `fix(doctor): resolve UTC date boundary mismatch in availability query`
- `docs(api): document appointment cancellation endpoint in thunder client collection`
- `refactor(services): extract slot generator logic into dedicated AvailabilityService`

**Bad Commits**:
- `fixed bugs` *(Too vague)*
- `WIP` *(Never commit generic WIP messages to PR branches)*
- `made changes to booking` *(Missing type and imperative tone)*

---

## 5. Coding Standards & Conventions

### 5.1. TypeScript Strict Mode
- **Zero `any`**: Do not use `any`. Use `unknown` with runtime type narrowing, or define explicit TypeScript interfaces and types.
- **Inferred Drizzle Types**: Utilize Drizzle's `$inferSelect` and `$inferInsert` for database entities:
  ```ts
  import { appointments } from "@/db/schema/appointments";

  export type Appointment = typeof appointments.$inferSelect;
  export type NewAppointment = typeof appointments.$inferInsert;
  ```
- **Explicit Service Return Types**: All public service functions in `src/services/*` must specify explicit return types to preserve compiler contract clarity.

### 5.2. Next.js 16 & React Architecture
- **Server Components by Default**: Treat every component as a React Server Component unless client interactivity is strictly required.
- **Client Directives (`'use client'`)**: Place `'use client'` at the top of components that use browser APIs, React hooks (`useState`, `useEffect`), or form controllers.
- **Mutations via Server Actions**: Perform mutations using Server Actions located in `src/app/actions/*` or Route Handlers in `src/app/api/v1/*`. Never write inline database queries inside React components.
- **Validation**: Validate all incoming action or route inputs using Zod schemas located in `src/lib/validations/*`.

### 5.3. Styling & UI Conventions
- **Tailwind CSS Utility Classes**: Style components using Tailwind classes. Avoid writing custom CSS files or inline style objects.
- **Class Merging**: Always use `cn()` from `@/lib/utils` when combining conditional classes:
  ```tsx
  import { cn } from "@/lib/utils";

  <div className={cn("p-4 rounded-lg border", isSelected ? "border-primary bg-primary/5" : "border-border")} />
  ```
- **Icons**: Use **Lucide React** icons exclusively. Decorate purely visual icons with `aria-hidden="true"`.

### 5.4. Linting & Type Checking
Before pushing changes or submitting a PR, ensure all checks pass:

```bash
# Run ESLint
npm run lint

# Run TypeScript type check
npx tsc --noEmit
```

---

## 6. Pull Request (PR) Process

1. **Keep PRs Focused**: A single PR should address one feature or bug. Avoid bundling unrelated refactorings or formatting changes.
2. **Sync with Main**: Rebase your branch onto the latest `main` branch before opening or updating a PR:
   ```bash
   git fetch origin
   git rebase origin/main
   ```
3. **PR Description**: Fill out the pull request template completely:
   - **Summary**: Concise description of changes.
   - **Motivation**: Why this change is necessary.
   - **Verification**: Exact steps to test the changes locally.
   - **Screenshots / Recordings**: If UI changes were introduced.
4. **Code Review**:
   - At least one approval from a maintainer is required before merging.
   - Respond constructively to review comments.
   - Once approved, your PR will be squashed and merged into `main`.

---

## 7. Reporting Issues & Requesting Features

- **Bug Reports**: Open an issue detailing the steps to reproduce, expected vs. actual behavior, browser/OS version, and relevant terminal/console logs.
- **Feature Requests**: Open an issue describing the proposed feature, user persona benefiting from it, and potential implementation approach.
