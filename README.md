# RE Quality App — Frontend

A mobile-first React + Tailwind CSS application for **Nyati Builders Pvt. Ltd** QA Internal Audit system.

## Tech Stack
- **Framework:** React 18
- **Styling:** Tailwind CSS v3
- **Routing:** React Router v6
- **HTTP:** Axios
- **Auth:** JWT (stored in localStorage)

## Setup

```bash
cd "RE Quality App (Frontend)"
npm install
```

Create `.env` file:
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Run

```bash
npm start
```

App runs on `http://localhost:3000`

## Pages

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Public | Login page |
| `/register` | Public | Register page |
| `/` | Auth | Home / Audit form dashboard |
| `/dashboard` | Auth | Browse all checklists |
| `/admin` | Admin only | Manage checklists (CRUD) |

## Project Structure

```
src/
├── api/           # Axios API calls
│   ├── axios.js   # Base instance with JWT interceptor
│   ├── auth.js    # Login / Register / Me
│   └── checklists.js
├── context/
│   └── AuthContext.jsx  # JWT auth state management
├── components/
│   ├── Navbar.jsx
│   ├── ProtectedRoute.jsx
│   └── AdminRoute.jsx
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Home.jsx       # Main audit form (matches QA checklist design)
│   ├── Dashboard.jsx  # User checklist browser
│   └── AdminPanel.jsx # Admin CRUD panel
└── App.jsx
```

## Design
- Matches **Nyati Builders QA Internal Audit Checklist** form
- Brand colors: Orange `#E8690A` + Blue `#1A3C6E`
- Mobile-first, max-width 448px
- Bottom navigation + sticky top header
