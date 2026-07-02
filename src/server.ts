import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import Redis from "ioredis";
import { founderFileRouter } from "./interfaces/routes/founderfile.routes";

const app = express();
const PORT = 4000;

app.use(express.json());
app.use("/api/founders", founderFileRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log(`[socket] client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`[socket] client disconnected: ${socket.id}`);
  });
});

// Separate Redis connection just for subscribing (pub/sub connections
// can't run normal Redis commands, so this must be its own connection)
const subscriber = new Redis("redis://localhost:6379");
subscriber.subscribe("file_processed_events");

subscriber.on("message", (_channel, message) => {
  const payload = JSON.parse(message);
  console.log("[socket] emitting file_processed:", payload);
  io.emit("file_processed", payload);
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});