// server.js
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load .env explicitly from the backend folder and warn on failure
const envPath = path.join(__dirname, '.env');
const envRes = dotenv.config({ path: envPath });
if (envRes.error) console.warn('Could not load .env from', envPath, envRes.error.message || envRes.error);

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET environment variable. Please add JWT_SECRET to backend/.env or your deployment environment.');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Support MONGO_URI or MONGO_URL and strip surrounding quotes if present
const rawUri = process.env.MONGO_URI || process.env.MONGO_URL || '';
const MONGO_URI = rawUri ? rawUri.replace(/^\s*"(.*)"\s*$/, '$1') : '';
if (!MONGO_URI) {
  console.error('Connection error: MONGO_URI is not set. Please add it to', envPath);
} else {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('Connection error:', err));
}

app.get('/', (req, res) => res.send('Backend is running'));

app.use('/api/datasets', require('./routes/datasets'));
app.use('/api/datapoints', require('./routes/datapoints'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/protected', require('./routes/protected'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
