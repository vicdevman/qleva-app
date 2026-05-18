import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  did: String,
  createdAt: String,
  email: { type: String, unique: true},
  smartWalletAddress: { type: String },
  smartWalletType: { type: String },
  name: { type: String },
  username: { type: String },
  avatarUrl: { type: String },
  lastLoginAt: String,
});

export const User = mongoose.models.User || mongoose.model("User", UserSchema);

//   did: z.string(),
//   createdAt: z.string(),
//   email: z.string().nullable(),
//   smartWalletAddress: z.string().nullable(),
//   smartWalletType: z.string().nullable(),
//   name: z.string().nullable(),
//   username: z.string().nullable(),
//   avatarUrl: z.string().nullable(),
//   lastLoginAt: z.string(),
