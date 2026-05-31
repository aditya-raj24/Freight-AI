require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user");
const Station = require("../models/station");
const Wagon = require("../models/wagon");
const Booking = require("../models/booking");
const Prediction = require("../models/prediction");
const AuditLog = require("../models/auditLog");
const Notification = require("../models/notification");
const OfficerId = require("../models/officerId");

const stationsData = [
  { stationCode: "NDLS", stationName: "New Delhi", congestionLevel: 45, waitingTrains: 2, availableTracks: 5, location: { lat: 28.6415, lng: 77.2198 } },
  { stationCode: "BCT", stationName: "Mumbai Central", congestionLevel: 35, waitingTrains: 1, availableTracks: 4, location: { lat: 18.9696, lng: 72.8193 } },
  { stationCode: "HWH", stationName: "Howrah Junction", congestionLevel: 70, waitingTrains: 3, availableTracks: 6, location: { lat: 22.5831, lng: 88.3414 } },
  { stationCode: "MAS", stationName: "Chennai Central", congestionLevel: 25, waitingTrains: 1, availableTracks: 4, location: { lat: 13.0822, lng: 80.2754 } },
  { stationCode: "PNBE", stationName: "Patna Junction", congestionLevel: 55, waitingTrains: 2, availableTracks: 3, location: { lat: 25.6025, lng: 85.1376 } },
  { stationCode: "KGP", stationName: "Kharagpur Junction", congestionLevel: 80, waitingTrains: 4, availableTracks: 4, location: { lat: 22.3331, lng: 87.3235 } }
];

const wagonsData = [
  { wagonNumber: "WGN-BOXN-5011", wagonType: "BOXN", capacity: 60, status: "Available", currentStation: "NDLS" },
  { wagonNumber: "WGN-BOXN-5012", wagonType: "BOXN", capacity: 60, status: "Available", currentStation: "NDLS" },
  { wagonNumber: "WGN-BCN-6021", wagonType: "BCN", capacity: 55, status: "Available", currentStation: "BCT" },
  { wagonNumber: "WGN-BCN-6022", wagonType: "BCN", capacity: 55, status: "Available", currentStation: "HWH" },
  { wagonNumber: "WGN-BRN-7031", wagonType: "BRN", capacity: 70, status: "Available", currentStation: "MAS" },
  { wagonNumber: "WGN-BRN-7032", wagonType: "BRN", capacity: 70, status: "Available", currentStation: "PNBE" },
  { wagonNumber: "WGN-BOXN-5013", wagonType: "BOXN", capacity: 60, status: "Allocated", currentStation: "KGP" },
  { wagonNumber: "WGN-BCN-6023", wagonType: "BCN", capacity: 55, status: "Maintenance", currentStation: "NDLS" }
];

const seedDB = async () => {
  try {
    const connString = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/freightlink";
    await mongoose.connect(connString);
    console.log("Connected to MongoDB for seeding...");

    // Clean existing collections
    await User.deleteMany({});
    await Station.deleteMany({});
    await Wagon.deleteMany({});
    await Booking.deleteMany({});
    await Prediction.deleteMany({});
    await AuditLog.deleteMany({});
    await Notification.deleteMany({});
    await OfficerId.deleteMany({});
    console.log("Cleared existing data.");

    // Seed stations
    await Station.insertMany(stationsData);
    console.log("Seeded stations.");

    // Seed wagons
    await Wagon.insertMany(wagonsData);
    console.log("Seeded wagons.");

    // Seed Officer IDs
    const oId1 = await OfficerId.create({
      govId: "GOV-OFFICER-123",
      name: "Seeded Officer ID",
      isUsed: true
    });

    await OfficerId.create({
      govId: "GOV-OFFICER-456",
      name: "Officer ID 2 (Available for Register)"
    });

    await OfficerId.create({
      govId: "GOV-OFFICER-789",
      name: "Officer ID 3 (Available for Register)"
    });

    // Seed default users
    const customer = await User.create({
      name: "Demo Customer",
      email: "customer@freightlink.com",
      password: "customer123",
      role: "customer"
    });

    const officer = await User.create({
      name: "Control Room Officer",
      email: "officer@freightlink.com",
      password: "officer123",
      role: "officer",
      govId: "GOV-OFFICER-123"
    });

    oId1.assignedTo = officer._id;
    await oId1.save();

    console.log("Seeded default users and allowed officer IDs.");

    // Seed a couple of default bookings for visual analytics
    const b1 = await Booking.create({
      bookingId: "BK1001",
      customerId: customer._id,
      sourceStation: "NDLS",
      destinationStation: "BCT",
      cargoType: "Coal",
      weight: 3000,
      wagonCount: 45,
      priority: "High",
      bookingStatus: "Wagon Allocated",
      estimatedArrival: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const b2 = await Booking.create({
      bookingId: "BK1002",
      customerId: customer._id,
      sourceStation: "HWH",
      destinationStation: "NDLS",
      cargoType: "Steel",
      weight: 1500,
      wagonCount: 22,
      priority: "Medium",
      bookingStatus: "Approved",
      estimatedArrival: new Date(Date.now() + 36 * 60 * 60 * 1000)
    });

    const b3 = await Booking.create({
      bookingId: "BK1003",
      customerId: customer._id,
      sourceStation: "KGP",
      destinationStation: "HWH",
      cargoType: "Cement",
      weight: 2000,
      wagonCount: 30,
      priority: "Low",
      bookingStatus: "Delivered",
      estimatedArrival: new Date(Date.now() - 12 * 60 * 60 * 1000)
    });

    // Seed prediction logs
    await Prediction.create({
      bookingId: "BK1001",
      predictedDelay: 12.5,
      confidence: 89,
      factors: { congestion: 40, weather: 20, wagonCount: 15, weight: 10, distance: 10, locomotivePower: 5 }
    });

    await Prediction.create({
      bookingId: "BK1002",
      predictedDelay: 6.2,
      confidence: 94,
      factors: { congestion: 20, weather: 10, wagonCount: 20, weight: 15, distance: 20, locomotivePower: 15 }
    });

    // Seed notifications
    await Notification.create({
      userId: customer._id,
      title: "Booking Submitted",
      message: "Your booking BK1002 from HWH to NDLS has been submitted and is under review.",
      status: "unread"
    });

    await Notification.create({
      userId: customer._id,
      title: "Wagon Allocated",
      message: "45 wagons have been allocated for your booking BK1001.",
      status: "unread"
    });

    // Seed Audit Logs
    await AuditLog.create({
      action: "Database Initialized & Seeded",
      user: "System Seeder"
    });

    console.log("✅ Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedDB();
