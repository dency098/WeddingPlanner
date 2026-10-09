const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const VenueBooking = require('../models/VenueBooking');

let memoryServer;

const connectDB = async () => {
  let mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    memoryServer = await MongoMemoryServer.create();
    mongoUri = memoryServer.getUri();
    console.log(`Using in-memory MongoDB at ${mongoUri}`);
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    await VenueBooking.init();

    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('Mongo connection failed:', error.message);

    if (memoryServer) {
      await memoryServer.stop();
    }

    throw error;
  }
};

module.exports = connectDB;
