# DataLabeler

A simple dataset annotation platform with a React/Vite frontend and Express/MongoDB backend.

## Features

- Manager user can create datasets, upload text items, and export labeled data.
- Annotator user can select a dataset and label text items.
- Backend supports MongoDB with an in-memory fallback for local development.

## Run locally

### Backend

```powershell
cd "C:\Users\brake\OneDrive\Desktop\DataLabeler\backend"
npm install
npm start
```

### Frontend

```powershell
cd "C:\Users\brake\OneDrive\Desktop\DataLabeler\frontend"
npm install
npm run dev
```

Open the frontend at `http://127.0.0.1:5173` and make sure the backend is running on `http://localhost:5000`.

## Environment variables

Create `backend/.env` with values like:

```env
MONGO_URI=mongodb://localhost:27017/datalabeler
JWT_SECRET=your_jwt_secret
PORT=5000
```

## Notes

- The backend uses MongoDB in production; the in-memory fallback is only for development convenience.
- `frontend/.env` can define `VITE_API_URL` if the API is hosted somewhere else.
