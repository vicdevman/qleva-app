import { NextResponse } from "next/server";

import { z } from "zod";
import connectMongoose from "@/lib/mongodb";
import { User } from "@/app/models/user";

const UserProfileSchema = z.object({
  did: z.string(),
  createdAt: z.string(),
  email: z.string().nullable(),
  smartWalletAddress: z.string().nullable(),
  smartWalletType: z.string().nullable(),
  walletAddress: z.string().nullable().optional(),
  walletType: z.string().nullable().optional(),
  oauthProvider: z.string().nullable().optional(),
  authMethod: z.string().nullable().optional(),
  name: z.string().nullable(),
  username: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  lastLoginAt: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    
    // Validate request payload
    const validatedData = UserProfileSchema.parse(body);

    console.log("[Backend Auth API] Validated sync request received:", validatedData);

    await connectMongoose();
    const now = new Date().toISOString();

    // Upsert the user into the database
    const user = await User.findOneAndUpdate(
      { did: validatedData.did },
      { 
        $set: { ...validatedData, updatedAt: now },
        $setOnInsert: { registeredAt: now }
      },
      { upsert: true, returnDocument: 'after' }
    );

    console.log(`[Backend Auth API] Upserted user record with DID: ${validatedData.did}`);

    return NextResponse.json({
      success: true,
      message: "User profile synchronized successfully",
      user: validatedData,
    });
  } catch (error: any) {
    console.error("[Backend Auth API] Error synchronizing user:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
