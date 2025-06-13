import { adminAuth, adminDB } from "@/lib/firebase/firebaseAdmin";
// import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    // Check if user exists in Firestore
    const userDoc = await adminDB.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return new Response(JSON.stringify({ error: "User not found in database" }), {
        status: 404,
      });
    }

    // Optionally: Create session cookies here (for SSR auth)
    // const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: 60 * 60 * 24 * 5 * 1000 });
    // cookies().set("session", sessionCookie, { httpOnly: true, secure: true });

    return new Response(JSON.stringify({ message: "User verified and exists" }), { status: 200 });
  } catch (error: any) {
    console.error("Google sign-in failed:", error);
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401,
    });
  }
}