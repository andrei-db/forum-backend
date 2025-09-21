import mongoose from "mongoose";

const topicSchema = new mongoose.Schema(
  {
    forum: { type: mongoose.Schema.Types.ObjectId, ref: "Forum", required: true },
    title: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);


export default mongoose.model("Topic", topicSchema);
