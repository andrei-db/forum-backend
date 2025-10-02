import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  ip: String,
  userAgent: String,
  location: String,
  lastActive: { type: Date, default: Date.now }
});

export default mongoose.model("Session", sessionSchema);