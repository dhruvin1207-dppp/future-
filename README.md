# FUTURE - The Art of Learning— Admin Dashboard

Admin dashboard with Baserow tables: **Students**, **Attendance**, **Marks**, **Timetable**, **Teachers**, **New Student Inquiry**, and **Exam**.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Where to Add Your Baserow API Token & URL

**Edit this file only:**

`src/config/baserow.credentials.js`

```js
export const baserowCredentials = {
  apiToken: 'your_token',
  baseUrl: 'https://api.baserow.io',
  tables: {
    students: '111111',    // required
    courses: '222222',
    teachers: '333333',
    attendance: '444444',
    fees: '555555',
    exams: '666666',
    reports: '777777',
  },
};
```

| Field | What to put |
|-------|-------------|
| `apiToken` | Baserow → Settings → API tokens |
| `tables.students` | **Required** — main student table |
| `tables.courses` | Course list (optional) |
| `tables.teachers` | Teachers (optional — row count used) |
| `tables.attendance` | Attendance records (optional) |
| `tables.fees` | Fees / revenue (optional) |
| `tables.exams` / `tables.reports` | Reserved for future pages |
| `baseUrl` | `https://api.baserow.io` or self-hosted URL |

Leave any table as `''` if you don't have it — that section uses calculated or demo values.

**After saving, restart the dev server** (`Ctrl+C`, then `npm run dev`).

(Optional: you can still use a `.env` file instead — see `.env.example`.)

### API files (for reference)

- **Your credentials:** `src/config/baserow.credentials.js`
- HTTP client: `src/services/baserowClient.js`
- Data aggregation: `src/services/dashboardService.js`

### Expected Baserow columns (user_field_names)

| Column | Used for |
|--------|----------|
| Student Name | Registration table |
| Course | Filter & table |
| Joining Date | Table |
| Fee Status | Table & pending count |
| Active | Active student count |
| Fee | Monthly revenue sum |

Until credentials are set, the dashboard uses demo data and still auto-refreshes every 10 seconds.

## Features

- Sidebar navigation (8 sections)
- Stat cards, 4 chart types, registrations table
- Search students & filter by course
- Dark mode toggle
- Export report (CSV)
- Auto-refresh every 10 seconds (no page reload)

## Build

```bash
npm run build
npm run preview
```
