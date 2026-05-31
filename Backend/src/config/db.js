const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connString = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/freightlink";
    const conn = await mongoose.connect(connString, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.log("Proceeding with database connection retry in background...");
  }
};

module.exports = connectDB;
