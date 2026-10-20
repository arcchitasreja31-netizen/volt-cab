"use client";

import { useEffect } from "react";
import { SignIn, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function Home() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || isSignedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#170910] text-white">
        <p>Loading Volt-Cab...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#170910] p-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#101225] p-8 shadow-2xl">
        <h1 className="text-center text-3xl font-black tracking-wider">
          VOLT<span className="text-cyan-400">CAB</span>
        </h1>

        <p className="mt-3 text-center text-gray-400">
          Sign in to continue to your dashboard.
        </p>

        <div className="mt-8 flex justify-center">
          <SignIn
            routing="hash"
            forceRedirectUrl="/dashboard"
            signUpForceRedirectUrl="/dashboard"
          />
        </div>
      </div>
    </main>
  );
}
