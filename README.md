# DataLabeler

**AI Dataset Annotation Platform** — a full-stack, team-based tool for collaboratively creating, uploading, and labeling text datasets for machine learning projects.

Built with a **React 18 + Vite** frontend and an **Express.js + MongoDB** backend, DataLabeler supports role-based workflows so Managers can prepare datasets and Annotators can label them, with live progress tracking and export.

---

## Features

- 🔐 **Authentication** — JWT-based sign up / sign in with role selection (Manager or Annotator)
- 🗂️ **Dataset management** — Managers can create datasets and upload text data points in bulk
- 🏷️ **Annotation workflow** — Annotators claim unlabeled items one at a time and label them (Positive / Negative / Neutral, or your own label set)
- 📊 **Progress tracking** — Real-time labeled vs. total counts per dataset
- 📤 **Export** — Managers can export a dataset's labeled items as JSON
- 💾 **Dual data layer** — Uses MongoDB in production, with an in-memory store as an automatic fallback for local development without a database

---

## Tech Stack

| Layer     | Tech |
|-----------|------|
| Frontend  | React 18, Vite, JavaScript |
| Backend   | Node.js, Express 5 |
| Database  | MongoDB (via Mongoose), with in-memory fallback |
| Auth      | JWT (jsonwebtoken), bcryptjs for password hashing |

---

## Project Structure

```
DataLabeler/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── models/                # Mongoose schemas (User, Dataset, DataPoint)
│   ├── routes/                # auth, datasets, datapoints, protected
│   ├── middleware/             # JWT auth + role-based access control
│   └── lib/                   # In-memory DB fallback for local dev
└── frontend/
    ├── src/
    │   ├── AuthView.jsx        # Sign in / sign up screen
    │   ├── ManagerView.jsx     # Dataset creation, upload, export
    │   ├── AnnotatorView.jsx   # Labeling interface
    │   ├── api.js              # API client (reads VITE_API_URL)
    │   └── App.jsx
    └── vite.config.js
```

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- A MongoDB connection string (MongoDB Atlas or local) — optional, the app falls back to an in-memory store if not connected

### Backend

```bash
cd backend
npm install
npm start
```

The server runs on `http://localhost:5000` by default.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173` in your browser. Make sure the backend is running so sign in/sign up work.

---

## Environment Variables

### Backend (`backend/.env`)

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=<appName>
JWT_SECRET=your_strong_random_secret
PORT=5000
```

### Frontend (`frontend/.env` or hosting provider env vars)

```env
VITE_API_URL=http://localhost:5000/api
```

In production, set this to your deployed backend URL plus `/api`, e.g. `https://your-backend.onrender.com/api`.

---

## API Overview

All routes below (except `/auth/*`) require a `Authorization: Bearer <token>` header.

| Method | Endpoint                        | Role       | Description |
|--------|----------------------------------|------------|--------------|
| POST   | `/api/auth/register`            | —          | Create a new user (`email`, `password`, `role`) |
| POST   | `/api/auth/login`               | —          | Log in, returns a JWT |
| GET    | `/api/datasets`                 | any        | List datasets (Managers see only their own) |
| POST   | `/api/datasets`                 | manager    | Create a new dataset (`name`, `description`) |
| POST   | `/api/datasets/:id/upload`      | manager    | Bulk upload data points (`items`: array of strings) |
| GET    | `/api/datasets/:id/progress`    | any        | Get labeled/total counts for a dataset |
| GET    | `/api/datasets/:id/export`      | manager    | Export a dataset's items and labels as JSON |
| GET    | `/api/datasets/:id/next`        | annotator  | Claim the next unlabeled item |
| POST   | `/api/datapoints/:id/label`     | annotator  | Submit a label for a claimed item |

---

## Deployment

DataLabeler is designed to deploy as two separate services:

- **Backend** → [Render](https://render.com) (Root Directory: `backend`, Start Command: `node server.js`)
- **Frontend** → [Vercel](https://vercel.com) (Root Directory: `frontend`, Framework Preset: Vite)

Steps:

1. Push the repo to GitHub.
2. Deploy `backend/` to Render; set `MONGO_URI` and `JWT_SECRET` as environment variables there.
3. Deploy `frontend/` to Vercel; set `VITE_API_URL` to your backend's public URL + `/api`.
4. Update the backend's CORS configuration to allow your Vercel domain.

> Free-tier backend hosts (like Render) spin down after inactivity — the first request after idle time can take 30–50 seconds to respond.

---

## Notes

- MongoDB Atlas free-tier clusters auto-pause after prolonged inactivity; resume them from the Atlas dashboard if connections start failing.
- Rotate `JWT_SECRET` and database credentials before any public/production deployment.
