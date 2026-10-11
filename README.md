# Volymoly Platform Admin

Separate Next.js application for Platform Super Admin access. Authentication is owned by the central Laravel API; this app keeps the browser session on its own origin through an allowlisted BFF route.

## Local setup

1. Install the pinned dependencies:

   ```powershell
   npm install
   ```

2. Copy `.env.example` to `.env.local`. The development defaults expect Laravel at `http://localhost:8000`.

3. In `backend-api`, run the new migration and create the first admin interactively:

   ```powershell
   php artisan migrate
   php artisan platform-admin:create
   ```

   There are no default or hard-coded credentials. The command requires a strong password and stores only its hash.

4. Start Laravel, then start this application:

   ```powershell
   npm run dev
   ```

5. Open `http://localhost:3001/login`.

## Authentication boundary

- Browser routes: `/api/platform/auth/{csrf-token,login,password/forgot,password/reset,me,logout}`
- Laravel routes: `/api/v1/platform/auth/{csrf-token,login,password/forgot,password/reset,me,logout}`
- Browser cookie: `platform_admin_session`
- Laravel guard: `platform`
- Laravel provider/model: `platform_admins` / `App\Models\PlatformAdmin`

The browser-facing session cookie is deliberately different from the Merchant Admin cookie, including during localhost development where ports do not isolate cookies.

Password-reset links use the separate `platform_admins` password broker and token table. Set `PLATFORM_ADMIN_FRONTEND_URL` in Laravel to this application's public origin. With Laravel's default database queue, a queue worker must be running for the reset email to be delivered.


## Verification

```powershell
npm test
npm run build
```
