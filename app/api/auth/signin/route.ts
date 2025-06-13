import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const user = await adminAuth.getUserByEmail(email);

    return NextResponse.json({
      exists: true,
      uid: user.uid,
    });
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      return NextResponse.json({ exists: false }, { status: 404 });
    }

    console.error("Error checking email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}