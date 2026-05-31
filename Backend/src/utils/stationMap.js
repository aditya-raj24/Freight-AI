const fs = require('fs');
const path = require('path');

const stationsPath = path.join(__dirname, '../data/stations.json');
let stations = {};

try {
    const data = fs.readFileSync(stationsPath, 'utf8');
    stations = JSON.parse(data);
} catch (error) {
    console.error("Error reading stations.json:", error);
}

// 🔹 Get full station info
exports.getStation = (code) => {
  return stations[code] || null;
};

// 🔹 Get only station name
exports.getStationName = (code) => {
  return stations[code]?.name || "Unknown Station";
};

// 🔹 Get city (used for weather API)
exports.getCity = (code) => {
  return stations[code]?.city || null;
};

// 🔹 Get zone (optional future use)
exports.getZone = (code) => {
  return stations[code]?.zone || null;
};

// 🔹 Get all stations
exports.getAllStations = () => {
  return stations;
};
