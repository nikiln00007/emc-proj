const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.warn('⚠️ MONGO_URI / MONGODB_URI is not set in environment variables. Running in resilient local mode.');
    return;
  }
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Notice: ${error.message}`);
  }
};

module.exports = connectDB;
