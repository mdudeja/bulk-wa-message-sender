import mongoose from "mongoose"
import { TUser } from "../interfaces/User"

const UserModelSchema = new mongoose.Schema<TUser>(
  {
    username: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 32,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.User ||
  mongoose.model<TUser>("User", UserModelSchema)
