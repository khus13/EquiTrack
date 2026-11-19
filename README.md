# EquiTrack

EquiTrack is a digital tracking system aimed to note down broken equipment, tools, and other facilities within the University of San Carlos - Talamban Campus. The system readily centralizes all reports of faulty utilities, bridging communication and resolution gaps between students, maintenance staff, and administrators.

* **Course:** CIS 2102 - Web Development II
* **Instructor:** Sir Chris Ray Belarmino
* **Semester:** First Semester, Academic Year 2026-2027
* **Live Demo:** [Link to deployed site on Vercel, Netlify, or GitHub Pages]**(FILL IN)**

---

## Table of Contents
* [Features](#features)
* [Screenshots](#screenshots)
* [Tech Stack](#tech-stack)
* [Getting Started](#getting-started)
* [Project Structure](#project-structure)
* [Team Members](#team-members)
* [Acknowledgments](#acknowledgments)

---

## Features**(probably incomplete)**
* **User Authentication:** Users (students) can login and sign up.
* **Case Reporting:** Users can file case reports of any defective facilities found as well as browse and view reports made by others.
* **Verification & Modification of Reports:** Assigned maintenance staff can change the statuses of reports once the given facilities have been resolved physically.
* **Administration:** Administrators can control accounts as well as check logs for login and security.

---

## Screenshots

| Home Page |
| :---: |
| <img width="959" height="454" alt="Screenshot 2026-11-18 235952" src="https://github.com/user-attachments/assets/f9d07503-7d62-452b-ba94-acd69bc652c3" /> |
| Dashboard |
| <img width="959" height="454" alt="Screenshot 2026-11-19 002729" src="https://github.com/user-attachments/assets/67cf7643-14f2-4f95-8971-c8c619da66fe" /> |
| Filing a Report |
| <img width="959" height="454" alt="Screenshot 2026-11-19 002355" src="https://github.com/user-attachments/assets/f410806e-05d7-4fcf-ac36-e731049f9d09" /> <img width="959" height="454" alt="Screenshot 2026-11-19 002403" src="https://github.com/user-attachments/assets/4255e3aa-8120-4362-8916-b96d6d0e3a3b" /> |
| My Reports View |
| <img width="959" height="454" alt="Screenshot 2026-11-19 002423" src="https://github.com/user-attachments/assets/ad98c9d0-8e20-44ad-a13c-ae68a9d73d18" /> <img width="959" height="454" alt="Screenshot 2026-11-19 002431" src="https://github.com/user-attachments/assets/365afab0-056e-4298-9664-ad9f1d3a9787" /> |
| Edit Report |
| <img width="502" height="432" alt="Screenshot 2026-11-19 002442" src="https://github.com/user-attachments/assets/c5a3e7af-e943-48cf-bd67-15977182d663" />
<img width="502" height="432" alt="Screenshot 2026-11-19 002500" src="https://github.com/user-attachments/assets/158f0174-8bfd-40d9-a4bc-b391bb17b228" /> |
| Reports Directory |
| <img width="959" height="454" alt="Screenshot 2026-11-19 002519" src="https://github.com/user-attachments/assets/3c573bbc-ece2-4881-98dc-b773379cbfb8" /> |
| Editing Profile Info |
| <img width="959" height="454" alt="Screenshot 2026-11-19 002737" src="https://github.com/user-attachments/assets/7fa972fc-09ad-444d-a42c-914253268242" /> |
| Account Password & Security |
| <img width="959" height="454" alt="Screenshot 2026-11-19 002750" src="https://github.com/user-attachments/assets/c91725d8-c35f-4aec-be04-1b5435eb20da" /> <img width="756" height="607" alt="Screenshot 2026-11-19 002757" src="https://github.com/user-attachments/assets/ac45f1b3-f99e-4279-bb82-48416a320f0c" /> |
---
## Tech Stack**(EDIT THESE)**
* **Frontend:**
   * React 18.3 (UI library)
   * React Router 6.26 (client-side routing)
   * Vite 5.4 (dev server and bundler)
   * Tailwind CSS 3.4, with PostCSS and Autoprefixer (styling)
   * Hanken Grotesk and Jost, loaded from Google Fonts
* **Backend:** PHP 8.1+
* **Database:** MySQL 5.7+ or MariaDB 10.3+
* **Deployment:**
   * Python scripts for API tests
   * Local development on XAMPP or WAMP, with Vite proxying to the PHP server
   * Apache routing for deployment

---

## Getting Started**(FILL IN/TO BE CHECKED BY US)**

Follow these instructions to run a local copy of the project on your machine for grading or testing.

### Prerequisites
Make sure you have the following installed:
* [Node.js](https://nodejs.org) (v18 or higher)
* [Git](https://git-scm.com)

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com
   ```
2. **Navigate to the project folder:**
   ```bash
   cd your-repo-name
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Set up environment variables:**
   Create a `.env` file in the root directory and add the required keys (see `.env.example`):
   ```env
   PORT=3000
   DATABASE_URL=your_database_connection_string
   ```
5. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser to view the app.

---

## Project Structure**(FILL IN/ WE WILL HELP WITH THIS)**
```text
EquiTrack/
├── README.md                      # Project overview, course info, features
├── package-lock.json              # (empty root lockfile)
└── equitrack/
    ├── README.md                  # Full docs: setup, test accounts, deployment
    ├── database/
    │   ├── schema.sql             # Tables, keys, indexes + seed data
    │   └── migrate_from_legacy.sql  # Optional: copy data from the old EquiTrack DB
    ├── backend/                   # Plain PHP 8.1+ API (PDO, sessions)
    │   ├── .env.example           # Sample environment variables (DB_HOST, DB_NAME...)
    │   ├── router.php             # Router for PHP's built-in dev server
    │   ├── api/
    │   │   ├── index.php          # Front controller
    │   │   ├── Router.php         # Request router
    │   │   └── routes.php         # All endpoints
    │   ├── config/                # config.php (.env loader), Database.php (PDO)
    │   ├── controllers/           # Auth, Profile, User, Report, Equipment, Reference, Stats, Audit, File
    │   ├── models/                # User, Report, Equipment, Reference, Stats, AuditLog (all SQL)
    │   ├── middleware/            # Auth, Role, Csrf, Cors
    │   ├── helpers/               # Response, Request, Validator, Uploader, Paginator
    │   ├── scripts/               # create_user.php, backfill_report_equipment.php
    │   └── uploads/reports/       # Uploaded report photos
    ├── frontend/                  # React 18 + Vite + Tailwind
    │   ├── public/                # Static assets (favicon.png, logo.png)
    │   ├── index.html             # Vite HTML entry
    │   ├── package.json           # Dependencies and scripts (dev, build, preview)
    │   ├── vite.config.js         # Dev proxy: /api -> PHP :8000
    │   ├── tailwind.config.js     # Design tokens
    │   ├── postcss.config.js
    │   ├── dist/                  # Production build output
    │   └── src/
    │       ├── main.jsx           # Application entry point
    │       ├── App.jsx            # Route map
    │       ├── index.css          # Tailwind layers / global styles
    │       ├── components/        # Reusable UI components
    │       │   ├── ui/            # Button, Form, Badges, Modal, Data, Feedback, Icons, SelectControl
    │       │   ├── layout/        # Navbar, Sidebar, Footer, Logo, Layouts
    │       │   ├── ErrorBoundary.jsx
    │       │   ├── ProtectedRoute.jsx
    │       │   ├── LocationSelects.jsx
    │       │   └── ReportRow.jsx
    │       ├── pages/             # Main application views
    │       │   ├── Landing.jsx, Login.jsx, Register.jsx, FAQs.jsx
    │       │   ├── Directory.jsx, ReportDetail.jsx, NotFound.jsx
    │       │   ├── user/          # UserDashboard, SubmitReport, MyReports
    │       │   ├── account/       # AccountProfile, AccountSecurity
    │       │   ├── admin/         # AdminDashboard, ManageReports, Statistics, ReferenceData, DirectoryManage
    │       │   └── superadmin/    # Users, AuditLogs
    │       ├── context/           # AuthContext, MetaContext, ToastContext
    │       ├── hooks/             # useApi, useListQuery
    │       └── lib/               # api, constants, format, validators
    └── tests/
        ├── api_test.py            # Automated API tests
        └── build_sqlite.py        # SQLite test DB builder
```

---

## Team Members
* **Khugo Sebastian Enriquez Auditor** – UI/UX Developer and Version Control Manager – [GitHub](https://github.com)
* **Andrea Keisha To Chip** – Frontend & Database Architecture – [GitHub](https://github.com)
* **Enoch Tabotabo Matugas** – API Integration & Testing – [GitHub](https://github.com)
* **Nathan Braxton Candelario Ares** – Documentation & Project Manager – [GitHub](https://github.com)

---

## Acknowledgments**(FILL IN)**
* Inspiration or starter code references (e.g., [Make a README](https://www.makeareadme.com/) or [Best-README-Template](https://github.com/othneildrew/Best-README-Template)).**(MAY BE REMOVED)**
* Third-party APIs, icon libraries (e.g., FontAwesome, Lucide), or tutorials used.
