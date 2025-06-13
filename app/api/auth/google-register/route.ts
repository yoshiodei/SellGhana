import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    // 1. Verify token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid, email, name, picture, email_verified, phone_number } = decodedToken;

    const userRef = adminDB.collection("users").doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      // 2. Create new user in DB
      const [firstName, ...rest] = name?.split(" ") || [];
      const lastName = rest.join(" ");

      const newUser = {
        uid,
        email,
        displayName: name || "",
        photoURL: picture || "",
        emailVerified: email_verified || false,
        firstName: firstName || "",
        lastName: lastName || "",
        phoneNumber: phone_number || "",
        wishlist: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await userRef.set(newUser);
    }

    // (Optional) Set a session cookie here...

    return NextResponse.json({ message: "Success", uid });
  } catch (err: any) {
    console.error("🔥 Google sign-in error:", err);
    return NextResponse.json({ message: "Failed to sign up user" }, { status: 500 });
  }
}