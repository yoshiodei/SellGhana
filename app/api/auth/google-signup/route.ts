import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ message: "Missing ID token" }, { status: 400 });
    }

    // Verify ID token
    const decoded = await adminAuth.verifyIdToken(idToken);
    const { uid, email, name: displayName, phone_number: phoneNumber, email_verified: emailVerified, picture: photoURL } = decoded;

    if (!email) {
      return NextResponse.json({ message: "No email provided by Google" }, { status: 400 });
    }

    // Check if user already exists in Firestore
    const userDoc = await adminDB.collection("users").doc(uid).get();

    if (userDoc.exists) {
      return NextResponse.json({ message: "User already exists" }, { status: 409 });
    }

    // Optionally, create user in Firebase Auth if not created
    try {
      await adminAuth.getUser(uid);
    } catch {
      await adminAuth.createUser({
        uid,
        email,
        displayName,
        phoneNumber,
        photoURL,
        emailVerified,
      });
    }

    // Save user data in Firestore
    const now = new Date().toISOString();
    const userData = {
      uid,
      email,
      firstName: displayName?.split(" ")[0] || "",
      lastName: displayName?.split(" ")[1] || "",
      phoneNumber: phoneNumber || "",
      displayName,
      emailVerified,
      photoURL: photoURL || "",
      createdAt: now,
      updatedAt: now,
      wishlist: [],
    };

    await adminDB.collection("users").doc(uid).set(userData);

    return NextResponse.json({ message: "User created successfully" }, { status: 201 });
  } catch (err: any) {
    console.error("🔥 Google Signup API Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}