import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import Session from "../models/Session.js";

export async function sessionTracker(req, res, next) {
    let sessionId = req.cookies.sessionId;

    if (!sessionId) {
        sessionId = uuidv4();
        res.cookie("sessionId", sessionId, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production", // false in dev
            path: "/", // 👈 foarte important
            maxAge: 1000 * 60 * 60 * 24, // 1 day
        });
    }

    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
        try {
            const token = authHeader.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.id;
        } catch (err) {

        }
    }

    const ip = req.ip || req.connection.remoteAddress;
    const ua = req.get("user-agent") || "unknown";

    await Session.findOneAndUpdate(
        { sessionId },
        {
            sessionId,
            userId,
            ip,
            userAgent: ua,
            lastActive: new Date(),
        },
        { upsert: true, new: true }
    );

    next();
}
