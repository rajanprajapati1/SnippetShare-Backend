// src/models/Session.js
import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true, // Ensure this is set to true
  },
  code: {
    type: String,
    default  : "Welcome to CodeShare Clone io."
  },
  createdAt: { type: Date, default: Date.now, expires: '24h' } // Automatically removes documents older than 24 hours
},{
  timestamps  :true ,
});

const Session = mongoose.model('Session', sessionSchema);

export default Session;
