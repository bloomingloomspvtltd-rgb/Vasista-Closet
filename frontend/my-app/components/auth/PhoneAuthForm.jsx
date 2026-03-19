"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";

import { firebaseApp } from "@/lib/firebaseClient";
import { upsertCustomerByEmail } from "@/lib/storeApi";
import { setCustomerSession } from "@/lib/customerSession";

export default function PhoneAuthForm({ title, subtitle, footer }) {
  const router = useRouter();
  const auth = useMemo(() => getAuth(firebaseApp), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result?.user;
      const email = user?.email;
      const displayName = user?.displayName || "";
      if (email) {
        const [firstName, ...rest] = displayName.split(" ");
        const customer = await upsertCustomerByEmail({
          email,
          first_name: firstName || "Customer",
          last_name: rest.join(" ") || undefined,
          phone: user?.phoneNumber || undefined,
        });
        setCustomerSession(customer);
        router.push("/account");
        return;
      }
      setError("Unable to read your Google account. Please try again.");
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>{title}</h1>
      {subtitle ? <p className="auth-subtitle">{subtitle}</p> : null}

      <button
        type="button"
        className="auth-google-btn"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        {loading ? "Please wait..." : "Continue with Google"}
      </button>

      {error ? <div className="auth-error">{error}</div> : null}

      {footer ? <div className="auth-links">{footer}</div> : null}
    </div>
  );
}
