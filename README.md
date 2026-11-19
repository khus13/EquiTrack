# EquiTrack v2

Digital tracking system for institutional equipment and infrastructure, built for the
University of San Carlos – Talamban Campus (Cebu). Students and staff **report damaged
equipment**, maintenance staff **repair and close reports**, and a Super Admin **manages
users, reference data, the equipment directory and audit logs**.

This version extends the original EquiTrack project (same branding, campus buildings and demo
data) with roles, a normalized database, CSRF protection, audit logs, a Tailwind design system
and the PHP backend reorganised into `config / models / controllers / middleware / api`.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, React Router 6, Vite 5, Tailwind CSS 3 |
| Backend | Plain PHP 8.1+ (no framework), PDO + prepared statements, PHP sessions |
| Database | MySQL 5.7+ / MariaDB 10.3+ |

## Folder structure

```
equitrack/
├── .htaccess                 Apache routing: /api -> PHP, everything else -> React
├── database/
│   ├── schema.sql            tables, keys, indexes + seed data (import this)
│   └── migrate_from_legacy.sql   optional: copy data from the original EquiTrack DB
├── backend/
│   ├── api/                  index.php (front controller), Router.php, routes.php (ALL endpoints)
│   ├── config/               config.php (.env loader), Database.php (PDO)
│   ├── controllers/          Auth, Profile, User, Report, Equipment, Reference, Stats, Audit, File
│   ├── models/               User, Report, Equipment, Reference, Stats, AuditLog  (all SQL lives here)
│   ├── middleware/           Auth, Role, Csrf, Cors
│   ├── helpers/              Response, Request, Validator, Uploader, Paginator
│   ├── uploads/              report photos (blocked from direct web access)
│   ├── scripts/create_user.php   create real accounts from the command line
│   ├── router.php            for PHP's built-in dev server
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/ui/        Button, Form (inputs, select, file upload), Badges, Modal, Data (table,
│   │   │                         pagination, stat cards, timeline, breadcrumbs, search bar), Feedback (skeleton, empty, alert)
│   │   ├── components/layout/    Navbar, Sidebar, Footer, Layouts
│   │   ├── context/              Auth, Toast, Meta (reference data)
│   │   ├── hooks/ lib/           API client (CSRF), validators, formatters
│   │   └── pages/                Landing, Login, Register, FAQs, Directory, ReportDetail, 404/403
│   │       ├── user/ account/ admin/ superadmin/
│   ├── tailwind.config.js    design tokens
│   └── vite.config.js        dev proxy /api -> PHP :8000
└── tests/                    automated API tests (see "Testing")
```

## Test accounts (seed data)

| Role | E-mail | Password |
|------|--------|----------|
| Super Admin | `superadmin@usc.edu.ph` | `password123` |
| Admin | `admin@usc.edu.ph` | `password123` |
| User | `juan@usc.edu.ph` | `password123` |

> **Delete or change these before going live.** Create real accounts with
> `php backend/scripts/create_user.php super_admin you@usc.edu.ph "StrongPass123" First Last`.

## Setup on XAMPP / WAMP (development)

**Prerequisites:** XAMPP or WAMP with PHP 8.1+ (`pdo_mysql`, `fileinfo`, `mbstring` enabled) · Node.js 18+.

1. **Create the database.** Start Apache + MySQL, open phpMyAdmin → *Import* → choose
   `database/schema.sql` → *Go*. This creates the `equitrack` database, all tables and the seed data.
   (Command line alternative: `mysql -u root -p < database/schema.sql`)
2. **Configure the backend.** Copy `backend/.env.example` to `backend/.env` and set `DB_USER` / `DB_PASS`
   (XAMPP default: user `root`, empty password).
3. **Start the PHP API** (keep this terminal open). With XAMPP's PHP on your PATH:
   ```bash
   cd backend
   php -S 127.0.0.1:8000 router.php
   ```
   Check <http://127.0.0.1:8000/api/auth/me> → `{"success":true,...,"data":{"user":null,"csrf_token":"..."}}`.
   *(Windows: use `C:\xampp\php\php.exe -S 127.0.0.1:8000 router.php`.)*
4. **Start the frontend** in a second terminal:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
5. Open <http://localhost:5173> and sign in with a test account.

Why it works: Vite forwards every `/api` request to PHP, so the browser sees ONE address and the
session cookie + CSRF token behave exactly as in production (no CORS headaches).

## Run without `npm run dev` (Apache serves everything)

```bash
cd frontend && npm run build          # creates frontend/dist
```
Copy the **contents of `frontend/dist`** next to `.htaccess` in the project root, then place the whole
project in `htdocs/equitrack` (XAMPP) and open `http://localhost/equitrack/`. Apache needs `mod_rewrite`
and `AllowOverride All`. If the site lives in a sub-folder, set `base: '/equitrack/'` in `vite.config.js`
and `RewriteBase /equitrack/` at the top of `.htaccess`.

## Deploying on the DCISM host (like the original project)

1. `npm run build`, upload `frontend/dist/*` + `.htaccess` + `backend/` + `database/` (database folder is blocked from the web).
2. Create the MySQL database in the hosting panel and import `schema.sql` in phpMyAdmin
   (remove the `CREATE DATABASE` / `USE` lines at the top if the panel pre-creates the DB for you).
3. On the server create `backend/.env`: `APP_ENV=production`, `APP_DEBUG=false`, and the DB credentials.
4. Make `backend/uploads/reports` writable (`chmod 775`).
5. Serve over **HTTPS** (the session cookie is automatically marked `Secure`).
6. Log in, **delete the demo accounts**.

## Moving data from the original EquiTrack database

See the header of `database/migrate_from_legacy.sql` (rename old tables → import `schema.sql` → run the
migration → copy old photos into `backend/uploads/reports/`).

## `.env` reference (`backend/.env`)

| Key | Meaning | Default |
|-----|---------|---------|
| `APP_ENV` / `APP_DEBUG` | `production` + `false` hides error details | `development` / `true` |
| `DB_HOST` `DB_PORT` `DB_NAME` `DB_USER` `DB_PASS` | MySQL connection | `127.0.0.1` `3306` `equitrack` `root` *(empty)* |
| `CORS_ALLOWED_ORIGINS` | Extra front-end origins (comma-separated) | `http://localhost:5173,...` |
| `ALLOWED_EMAIL_DOMAINS` | Restrict self-registration, e.g. `usc.edu.ph` (empty = any) | *(empty)* |
| `MAX_UPLOAD_MB` | Photo size limit (PHP's `upload_max_filesize` must be ≥ this) | `2` |

Frontend (optional) `frontend/.env`: `VITE_API_BASE` – only if the API is on another address.

## API overview

All replies: `{ "success": true|false, "message": "...", "data": ... }`. Lists return
`data: { items: [...], pagination: { page, per_page, total, total_pages } }`.
Validation errors are `422` with `data.errors = { field: "message" }`. Codes used:
`200 201 401 403 404 405 409 419 422 429 500`.

Every write request must send the header `X-CSRF-Token` (get it from `GET /api/auth/me`).

| Area | Endpoint | Who |
|------|----------|-----|
| Auth | `GET /auth/me` · `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` | public |
| Account | `PATCH /profile` · `PATCH /profile/password` · `POST /profile/deactivate` · `DELETE /profile` | signed in |
| Reports | `GET /reports` (users: own only) · `POST /reports` (multipart) · `GET /reports/{id}` · `DELETE /reports/{id}` | signed in |
|  | `PATCH /reports/{id}/status` · `GET /report-images/{id}` | admin / owner |
| Directory | `GET /equipment` · `GET /equipment/{id}` | signed in |
|  | `POST/PUT/DELETE /equipment[/{id}]` | super admin |
| Reference | `GET /meta` | signed in |
|  | `GET/POST/PUT/DELETE /reference/{campuses|buildings|rooms|categories|equipment_types|damage_types}` | admin read · super admin write |
| Users | `GET/POST /users` · `GET/PUT/DELETE /users/{id}` · `PATCH /users/{id}/status` | super admin |
| Stats | `GET /stats/public` · `/stats/me` · `/stats/dashboard` (admin) · `/stats/overview` (super admin) | varies |
| Audit | `GET /audit-logs` | super admin |

## Security measures

Passwords hashed with `password_hash` (bcrypt) · PDO prepared statements everywhere · server-side validation
and `strip_tags` sanitising · session cookie `HttpOnly`, `SameSite=Lax`, `Secure` on HTTPS, new session id at
login · CSRF token on every write · role checks on the server for every route (the React guards are only UX) ·
users can only read their own reports and photos · uploads: size + real MIME type + image check, random file
names, stored outside public access and served through an authorised endpoint · CORS allow-list ·
login throttling (10 failures / 15 min / IP) · audit log of important actions · last Super Admin cannot be
removed · security headers (`nosniff`, `X-Frame-Options`).

## Testing

**Automated (backend):** `python3 tests/api_test.py` starts PHP's built-in server against a temporary SQLite copy of
`schema.sql` and runs 120+ checks (auth, roles, CSRF, validation, upload rules, search/filter/sort/pagination,
status workflow, audit log, CORS). Requires Python 3 + `pip install requests` and PHP with `pdo_sqlite`.
Run it before submitting changes.

**Manual checklist**

- [ ] Register with a bad e-mail / short password → inline errors; valid data → logged in as *User*
- [ ] Login with wrong password → error; correct → lands on the role's home page
- [ ] Visit `/admin` as User → *Unauthorized*; visit `/dashboard` logged out → redirected to login
- [ ] Submit report: empty form shows errors; GIF or >2 MB image rejected; valid report + photo → appears in *My reports*
- [ ] Campus → Building → Room dropdowns filter each other
- [ ] *My reports*: search, status filter, pagination, delete a **Pending** report
- [ ] Directory: filter by category / campus / building / type, keyword search, pagination, “Report a problem” pre-fills the form
- [ ] Admin dashboard counts match the table; “To repair” shows Urgent first
- [ ] Manage reports: search, filter, sort by priority/status/date, pagination
- [ ] Report detail: *Start work* → *Mark as solved* with remarks; timeline updates; user sees the remarks
- [ ] Super Admin: create / edit / deactivate / delete a user; the only Super Admin cannot be deleted
- [ ] Reference data: add campus → building → room; deleting a campus in use shows an error
- [ ] Directory management: add, edit, delete equipment
- [ ] Audit logs show login, report and user actions; filters work
- [ ] Statistics page loads; Account → change password, deactivate, delete
- [ ] Phone width (≈390 px): no sideways scrolling, menu opens, tables scroll inside their box
- [ ] Keyboard only: Tab reaches everything, focus ring visible, modals close with Esc

## Troubleshooting

| Problem | Fix |
|---------|-----|
| “Cannot reach the server” | PHP server (step 3) is not running, or wrong port |
| `Something went wrong` / DB error | Check `backend/.env` credentials; MySQL running; `schema.sql` imported |
| Photo upload fails | `upload_max_filesize`/`post_max_size` ≥ 2M in `php.ini`; `uploads/reports` writable |
| “Security token missing” (419) | Refresh the page (session expired) |
| Blank page after build on Apache | Enable `mod_rewrite` + `AllowOverride All` so `.htaccess` works |

## Credits

Original EquiTrack created for CIS 2102 (Web Development II), University of San Carlos, by Andrea Keisha To Chip,
Enoch Matugas, Khugo Sebastian Auditor and Nathan Braxton Candelario Ares. v2 extends their project.
