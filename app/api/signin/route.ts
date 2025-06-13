// import { NextRequest, NextResponse } from 'next/server';
// import { adminAuth } from '@/lib/firebase/firebaseAdmin';

// export async function POST(req: NextRequest) {
//   try {
//     const { email, password } = await req.json();

//     // Firebase Admin doesn't support verifying password credentials.
//     // You should verify this on the client side using Firebase client SDK.
//     return NextResponse.json(
//       { error: 'Email/password sign-in should be handled client-side with Firebase Auth' },
//       { status: 400 }
//     );
//   } catch (err: any) {
//     console.error('🔥 Sign-in error:', err.message || err);
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }
