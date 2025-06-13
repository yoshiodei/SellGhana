"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, reload, sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase/firebase";
import SimpleNavBar from "@/components/simple-nav-bar";
import SimpleFooter from "@/components/simple-footer";
import { logout } from "@/lib/auth/utils/logOut";


export default function VerifyEmailPage() {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60); // seconds
  const [resendDisabled, setResendDisabled] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  
  console.log("----auth 0000", auth.currentUser);
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await reload(user);
        if (user.emailVerified) {
          setIsVerified(true);
          router.push("/");
        } else {
          setIsVerified(false);
        }
        setLoading(false);
      } else {
        router.push("/auth/login");
      }
    });

    const interval = setInterval(async () => {
      const user = auth.currentUser;
      if (user) {
        await reload(user);
        if (user.emailVerified) {
          clearInterval(interval);
          router.push("/");
        }
      }
    }, 5000); // Check every 5 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [auth, router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout(router);
    setLoggingOut(false);    
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    } else {
      setResendDisabled(false);
    }

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    const user = auth.currentUser;
    if (user && !user.emailVerified) {
      await sendEmailVerification(user);
      setResendCooldown(60);
      setResendDisabled(true);
    }
  };

//   return (
//     <div className="flex flex-col items-center justify-center h-screen text-center px-4">
//       {/* <SimpleNavBar />   */}
//       {loading ? (
//         <p>Loading...</p>
//       ) : (
//         <>
//           <h2 className="text-2xl font-semibold mb-4">Verify your email</h2>
//           {!isVerified && (
//             <>
//               <p className="mb-2 max-w-md">
//                 We’ve sent a verification email to your inbox. Please click the link to verify your account.
//               </p>
//               <p className="text-sm text-gray-600 mb-4">
//                 This page will automatically redirect once your email is verified.
//               </p>

//               <button
//                 onClick={handleResend}
//                 disabled={resendDisabled}
//                 className={`px-4 py-2 mt-4 rounded ${
//                   resendDisabled ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
//                 }`}
//               >
//                 {resendDisabled ? `Resend email in ${resendCooldown}s` : "Resend Verification Email"}
//               </button>
//             </>
//           )}
//         </>
//       )}
//       {/* <SimpleFooter/> */}
//     </div>
//   );
// }



return (
    <div className="min-h-screen flex flex-col">
      <SimpleNavBar />  
      {loading ? (
        <p>Loading...</p>
      ) : (
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <h2 className="text-2xl font-semibold mb-4">Verify your email</h2>
          {!isVerified && (
            <>
              <p className="mb-2 max-w-md text-center">
                {`We’ve sent a verification email to ${auth.currentUser?.email}. Please click the link to verify your account.`}
              </p>
              <p className="text-sm text-gray-600 mb-4 text-center">
                This page will automatically redirect once your email is verified.
              </p>

              <button
                onClick={handleResend}
                disabled={resendDisabled}
                className={`px-4 py-2 mt-4 rounded ${
                  resendDisabled ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {resendDisabled ? `Resend email in ${resendCooldown}s` : "Resend Verification Email"}
              </button>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="px-4 py-2 mt-4 rounded bg-slate-200 text-slate-400 hover:bg-slate-300"
              >
                {loggingOut ? "...logging out" : "Continue Anonymous"}
              </button>
            </>
          )}
        </main>
      )}
      <SimpleFooter/>
    </div>
  );
}