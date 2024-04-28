import mongoose from "mongoose";
import { UserDocument } from "./user.model";

export interface SessionDocument extends mongoose.Document {
  userId: UserDocument["_id"];
  userAgent?: string;
  createdAt: Date;
}

const sessionSchema = new mongoose.Schema<SessionDocument>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  userAgent: { type: String },
  createdAt: {
    type: Date,
    required: true,
    expires: 30 * 24 * 60 * 60, // 30 days
  },
});

const SessionModel = mongoose.model<SessionDocument>("Session", sessionSchema);
export default SessionModel;
