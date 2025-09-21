import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Post", postSchema);
