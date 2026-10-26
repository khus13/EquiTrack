# EquiTrack

EquiTrack is a digital tracking system for institutional equipment and infrastructure. It aims to serve as a bridge for communication for students, staff and the academic institution itself. Its scope revolves around the equipment and infrastructural devices around the University of San Carlos' Talamban Campus (USC-TC), located in Cebu, Philippines.

# Features

Users can perform the following:
- Submit a report of a damaged tool, facility, or infrastructure found within the campus
- Describe the item being reported including its specific classroom and building, as well as type of damage
- Search for listed equipment and infrastructure through categories (building, campus, type)
- Modify names and passwords
- Delete the users' personal accounts

Admins can perform the following:
- View all reports submitted by users
- Utilize the website as an organized list of equipment and facilities to repair
- Mark reports as solved (fixed)
- Manage the registered accounts of all users

# Tech Stack

The website employs the following languages and frameworks:
- ReactJS
- PHP
- MySQL
- HTML, CSS, JS

# EquiTrack Installation & Setup

## Prerequisites

Make sure the following are installed before starting:

- [Node.js 18+](https://nodejs.org)
- [PHP 8.1+](https://www.php.net/downloads)
  - `pdo_mysql` enabled
  - `fileinfo` enabled
- MySQL/MariaDB or XAMPP

## Setup Instructions

1. **Clone the repository:**

   ```bash
   git clone https://github.com/<your-username>/equitrack.git
   cd equitrack
   ```

2. **Create the database:**

   Start MySQL, then import the schema. This creates the `equitrack` database, tables, and sample data.

   ```bash
   mysql -u root -p < database/schema.sql
   ```

3. **Configure the database connection:**

   Open:

   ```text
   backend/src/config.php
   ```

   Set `db_user` and `db_pass` to your MySQL credentials.

4. **Start the PHP API:**

   Keep this terminal open while running the application.

   ```bash
   cd backend
   php -S 127.0.0.1:8000 -t public public/index.php
   ```

   Check that the following endpoint works:

   [http://127.0.0.1:8000/api/auth/me](http://127.0.0.1:8000/api/auth/me)

   It should return:

   ```json
   {"user": null}
   ```

5. **Install the frontend dependencies:**

   Open a **new terminal**, navigate to the frontend folder, and install the dependencies:

   ```bash
   cd frontend
   npm install
   ```

6. **Start the frontend:**

   ```bash
   npm run dev
   ```

7. **Open the application:**

   Go to:

   [http://localhost:5173](http://localhost:5173)

   Create a new account or use one of the demo accounts:

   - **User:** `juan@usc.edu.ph`
   - **Admin:** `admin@usc.edu.ph`
   - **Password:** `password123`

   > **Important:** Delete the demo accounts before deploying the application.

## Troubleshooting

- **"Cannot reach the API server"**
  - Make sure the PHP server from Step 4 is running.

- **"Database error"**
  - Make sure MySQL is running.
  - Check the credentials in `backend/src/config.php`.
  - Make sure `database/schema.sql` was successfully imported.


# Credits

This project was created in fulfillment of the requirements of the Web Development II (CIS 2102) course at the University of San Carlos. <br>

The creators of EquiTrack include:
- Andrea Keisha To Chip
- Enoch Matugas
- Khugo Sebastian Auditor
- Nathan Braxton Candelario Ares
