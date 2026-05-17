import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

const UserProfileSchema = z.object({
  did: z.string(),
  createdAt: z.string(),
  email: z.string().nullable(),
  walletAddress: z.string().nullable(),
  oauthProvider: z.string().nullable(),
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

    // Path to the mock database JSON file inside /lib
    const dbPath = path.join(process.cwd(), "lib", "db-mock.json");

    let users = [];

    // Ensure the folder exists (it is /lib, which already exists)
    try {
      const fileData = await fs.readFile(dbPath, "utf-8");
      users = JSON.parse(fileData);
    } catch (err) {
      // File does not exist yet, we will create it on write
      users = [];
    }

    // Check if user already exists
    const userIndex = users.findIndex((u: any) => u.did === validatedData.did);

    if (userIndex >= 0) {
      // Update existing user record
      users[userIndex] = {
        ...users[userIndex],
        ...validatedData,
        updatedAt: new Date().toISOString(),
      };
      console.log(`[Backend Auth API] Updated existing user record with DID: ${validatedData.did}`);
    } else {
      // Insert new user record
      users.push({
        ...validatedData,
        registeredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log(`[Backend Auth API] Registered new user record with DID: ${validatedData.did}`);
    }

    // Write back to mock database file
    await fs.writeFile(dbPath, JSON.stringify(users, null, 2), "utf-8");

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
