import express from "express";
import Session from "../models/Session.js";

const router = express.Router();
router.post("/session", async (req, res) => {
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

router.get("/session/:sessionId", async (req, res) => {
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

router.get("/get/code", async (req, res) => {
  try {
    const data = await Session.find({});
    // await Session.deleteMany();
    return res.status(404).json({ data});
    // :"sucess" 
  } catch (error) {
    return res.status(404).json({ error: "Session not found" });
  }
});

export default router;
