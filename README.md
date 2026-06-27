# 🎓 CampusSync — Smart Campus Utility App

A full-stack web application to help students manage their daily college activities.

## Features
- **Authentication** — JWT-based login/register for Admin & Student roles
- **Timetable** — Add, view, edit class schedules by day with color coding
- **Assignments** — Track tasks with due dates, priorities, status & file attachments
- **Attendance** — Mark attendance, view analytics charts per subject
- **Notice Board** — Admin posts notices; students view by category
- **Notes** — Rich text notes with tags, colors, categories & file attachments
- **Profile** — Update profile info, avatar, change password
- **Responsive** — Works on mobile, tablet, and desktop

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, React Router
- **Backend**: Node.js, Express, sql.js (SQLite), JWT, Multer
- **Database**: SQLite (file-based, zero config)

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 18+

### 1. Install dependencies
```bash
npm run install:all
```

### 2. Build the frontend
```bash
npm run build
```

### 3. Seed demo data
```bash
npm run seed
```

### 4. Start the server
```bash
npm start
```

Open **http://localhost:5000**

**Demo accounts:**
| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Admin   | admin@campus.edu       | password123 |
| Student | student@campus.edu     | password123 |

---

## 📁 Project Structure

```
campus-sync/
├── backend/
│   ├── db/            # SQLite database file (auto-created)
│   ├── middleware/    # JWT auth middleware
│   ├── routes/        # API routes
│   ├── uploads/       # Uploaded files
│   ├── seed.js        # Demo data seeder
│   └── server.js      # Express server
├── frontend/
│   └── src/
│       ├── components/ # Layout, shared UI
│       ├── context/    # Auth context
│       └── pages/      # All page components
└── README.md
```
