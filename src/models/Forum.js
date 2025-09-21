import mongoose from "mongoose";

const forumSchema = new mongoose.Schema({
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  name: { type: String, required: true },
  description: String,
  order: { type: Number, default: 0 }, 
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Forum", forumSchema);
