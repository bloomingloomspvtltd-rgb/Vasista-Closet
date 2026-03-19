export const metadata = {
  title: "Sign Up | Visista",
  description: "Create your account with Google.",
};

import Link from "next/link";
import PhoneAuthForm from "@/components/auth/PhoneAuthForm";

export default function SignupPage() {
  return (
    <div className="auth-page">
      <PhoneAuthForm
        title="Create your account"
        subtitle="Continue with Google to create your account."
        footer={
          <>
            <Link href="/login">Already have an account?</Link>
            <Link href="/account">Need help?</Link>
          </>
        }
      />
    </div>
  );
}
