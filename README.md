# MediNest

MediNest is a doctor appointment booking application with patient and doctor accounts, searchable doctor profiles, weekly availability, appointment booking, cancellation, completion, and in-app notification records.

## Local development

Requirements: Node.js 22+, npm, and PostgreSQL 14+ with permission to enable the `btree_gist` extension.

1. Create a PostgreSQL database and copy `backend/.env.example` to `backend/.env`. Set `DATABASE_URL`, a private `JWT_SECRET` of at least 32 characters, and a private `DOCTOR_SIGNUP_CODE`.
2. From `backend`, install dependencies, apply the schema migration, and start the API:

   ```bash
   npm ci
   npm run migration:run
   npm run start:dev
   ```

3. Copy `frontend/.env.example` to `frontend/.env.local`. The defaults proxy browser requests through Next.js to `http://localhost:3001`.
4. From `frontend`, run:

   ```bash
   npm ci
   npm run dev
   ```

Open `http://localhost:3000`. Patient accounts can register directly. Doctor accounts require the configured invitation code and must publish availability before patients can book.

`synchronize` is disabled. Use TypeORM migrations for schema changes; the deployment config runs migrations before starting the API.

## Verification

```bash
# frontend
cd frontend
npm run lint
npm run build

# backend
cd ../backend
npm run lint
npm run build
npm test -- --runInBand
```

The PostgreSQL concurrency/constraint suite requires a dedicated disposable database in `TEST_DATABASE_URL`:

```bash
cd backend
npm run test:postgres
```

The suite clears its test tables and must never be pointed at production data.

## Deployment

- **Frontend (Vercel):** import the repository and set the project root to `frontend`. Set `NEXT_PUBLIC_API_URL=/api` and `BACKEND_API_URL` to the Railway origin (for example, `https://your-api.up.railway.app`). Next.js proxies `/api/*` through the frontend origin so browser session cookies remain first-party.
- **API (Railway):** create a service with the project root set to `backend`. In the service settings set build command `npm ci && npm run build`, pre-deploy command `npm run migration:run`, start command `npm run start:prod`, and health check path `/api/health`.
- **Database (Neon):** create a PostgreSQL database and use its pooled or direct connection string as the Railway `DATABASE_URL`. Set `DATABASE_SSL=true` when the URL does not include SSL connection parameters.

Set these Railway environment variables before deployment:

- `DATABASE_URL`
- `JWT_SECRET` (at least 32 characters)
- `DOCTOR_SIGNUP_CODE`
- `FRONTEND_URL` (the exact Vercel origin; comma-separated if needed)
- `NODE_ENV=production`
- `DATABASE_SSL=true` when needed for the Neon connection

Railway supplies `PORT`. No real cloud credentials or live services are committed in this repository. Railway now deprecates `railway.json` config-as-code for new services, so configure the commands in service settings.
