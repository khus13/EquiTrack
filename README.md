# EquiTrack – Digital Equipment Tracking System

React (Vite) + PHP 8 (PDO) + MySQL. Users sign up, browse/filter reports of broken facilities & equipment, and file new reports with a required photo.

```
database/schema.sql      tables + seed data (categories, buildings, locations, demo reports/users)
backend/public/index.php API front controller (+ .htaccess for Apache), uploads/ for photos
backend/src/             config, helpers, auth.php, reports.php
frontend/                React app (login, register, browse+filters, file report, detail, FAQs)
```

## Run (development)
1. **Database**: `mysql -u root -p < database/schema.sql`
2. **API** (needs PHP 8.1+ with pdo_mysql, fileinfo):
   ```
   cd backend
   php -S 127.0.0.1:8000 -t public public/index.php
   ```
   Keep this terminal open. Set your MySQL user/password by editing the defaults in `backend/src/config.php`
   (or env vars DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS). XAMPP users: enable `pdo_mysql` and `fileinfo` in php.ini.
   Check it works: open http://127.0.0.1:8000/api/auth/me — you should see `{"user":null}`.
3. **Frontend**: `cd frontend && npm install && npm run dev` → http://localhost:5173
   (Vite proxies `/api` and `/uploads` to port 8000.)

Demo logins (password `password123`): `juan@usc.edu.ph` (user), `admin@usc.edu.ph` (admin – can change report status).
**Delete these demo accounts before deploying.**

## Production
`npm run build`, serve `frontend/dist` and route `/api` + `/uploads` to `backend/public` (Apache `.htaccess` included; for SPA routing fall back to `index.html`). Serve over HTTPS and set `session.cookie_secure`.

## API
`POST /api/auth/register|login|logout`, `GET /api/auth/me`, `GET /api/meta`,
`GET /api/reports?q=&category=&status=&building=&mine=1`, `GET /api/reports/:id`,
`POST /api/reports` (multipart: title, category_id, description, building_id, location_id, photo),
`PATCH /api/reports/:id/status` (admin).

Security: bcrypt passwords, prepared statements, session cookies (HttpOnly, SameSite=Lax), server-side image validation by MIME sniffing (JPG/PNG/WebP, ≤5MB) with random filenames.
