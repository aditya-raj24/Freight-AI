require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Matches React client ports
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Make socket.io accessible in Express controllers
app.set("socketio", io);

io.on("connection", (socket) => {
  console.log(`🔌 Socket client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`🔌 Socket client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚆 FreightLink Node server running on port ${PORT}`);
});
