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

const Port = process.env.PORT || 5000;
const app = express();
const server = createServer(app);
// const io = new Server(server, { cors: { origin: '*' } });

const io = new Server(server, {
  cors: {
    origin: "*",
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
// app.use(process.env.API,CodeRoute)


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

app.get("/",(req,res)=>{
  res.status(200).json({msg:"Snippet Share v1 Now 👻"})
})

app.post("/api/v1/session", async (req, res) => {
  const { sessionId, code } = req.body;

  try {
    let session = await Session.findOne({ sessionId });
    if (session) {
      session.code = code;
      await session.save();
      return res.status(200).json(session);
    }

    session = new Session({ sessionId, code });
    await session.save();
    return res.status(201).json(session);
  } catch (error) {
    console.error("Error creating session:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/v1/session/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  try {
    let session = await Session.findOne({ sessionId });
    if (!session) {
      session = new Session({ sessionId, code: "" });
      await session.save();
      return res.status(201).json(session); 
    }

    return res.status(200).json(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/v1/get/code", async (req, res) => {
  try {
    const data = await Session.find({});
    // await Session.deleteMany();
    return res.status(404).json({ data});
    // :"sucess" 
  } catch (error) {
    return res.status(404).json({ error: "Session not found" });
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
