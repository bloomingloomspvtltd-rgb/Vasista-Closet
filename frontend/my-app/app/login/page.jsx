export const metadata = {
  title: "Login | Visista",
  description: "Sign in to manage your account and orders.",
};

import Link from "next/link";
import PhoneAuthForm from "@/components/auth/PhoneAuthForm";

export default function LoginPage() {
  return (
    <div className="auth-page">
      <PhoneAuthForm
        title="Welcome back"
        subtitle="Sign in with Google."
        footer={
          <>
            <Link href="/signup">Create an account</Link>
            <Link href="/account">Need help?</Link>
          </>
        }
      />
    </div>
  );
}
