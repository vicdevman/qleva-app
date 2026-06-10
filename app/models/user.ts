import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  did: String,
  createdAt: String,
  email: { type: String },
  smartWalletAddress: { type: String },
  smartWalletType: { type: String },
  walletAddress: { type: String },
  walletType: { type: String },
  oauthProvider: { type: String },
  authMethod: { type: String },
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
