require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MONGO_URI:', process.env.MONGO_URI ? '[present]' : '[missing]');

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('Mongoose connected');
    return mongoose.disconnect();
  })
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Connect error:', err && err.stack ? err.stack : err);
    process.exit(1);
  });
