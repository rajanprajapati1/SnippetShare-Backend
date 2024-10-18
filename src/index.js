import express from "express";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import CodeRoute from './Controller/CodeRoute.js'; // Add .js extension
import MongoDbConnect from './config/MongoConnect.js'
import cron from "node-cron";
import Session from "./models/Session.js";
dotenv.config();

const Port = process.env.PORTkl || 5000;
const app = express();
const server = createServer(app);
// const io = new Server(server, { cors: { origin: '*' } });

const io = new Server(server, {
  cors: {
    origin: "*", // Allow requests from any origin
    methods: ["GET", "POST"],
    credentials: true,
  },
});
app.use(
  cors({
    credentials: true,
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(express.json());
app.use(process.env.API,CodeRoute)


cron.schedule('* * * * *', async () => { // Runs every minute
  const expirationDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  try {
    const result = await Session.deleteMany({ createdAt: { $lt: expirationDate } });
    if (result.deletedCount > 0) {
      io.emit('sessionDeleted', result.deletedCount); // Notify clients about the deletion
    }
    console.log(`${result.deletedCount} old sessions deleted.`);
  } catch (error) {
    console.error("Error deleting old sessions:", error);
  }
});


io.on("connection", (socket) => {
  console.log("User connected: ", socket.id);

  socket.on("codeChange", (data) => {
    socket.broadcast.emit("receiveCodeChange", data);
    console.log(data , "code")
  });

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

 socket.on("sendMessage", ({ message, roomId }) => {
    io.to(roomId).emit("receiveMessage", { message, sender: socket.id });
  });
  
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});


server.listen(Port, () => {
     MongoDbConnect();
  console.log(`Codeshare Server Running on ${Port}`);
});
