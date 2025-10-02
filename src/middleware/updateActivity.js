import User from "../models/User.js";

export async function updateActivity(req, res, next) {
  if (req.user) {
    await User.findByIdAndUpdate(req.user.id, { lastActive: new Date() });
  }
  next();
}
