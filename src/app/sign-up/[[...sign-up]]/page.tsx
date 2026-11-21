import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign up",
  robots: { index: false, follow: true },
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <SignUp
        appearance={{
          variables: {
            colorPrimary: "#D4790A",
            colorText: "inherit",
            borderRadius: "0.25rem",
          },
          elements: {
            card: {
              border: "2px solid #2D1E14",
              boxShadow: "0 5px 0 0 #2D1E14",
              borderRadius: "0.25rem",
            },
            socialButtonsBlockButton: {
              border: "2px solid #2D1E14",
              borderRadius: "0.25rem",
              fontWeight: "700",
            },
            formButtonPrimary: {
              borderRadius: "0.25rem",
              fontWeight: "700",
              boxShadow: "0 3px 0 0 #2D1E14",
            },
          },
        }}
      />
    </div>
  );
}
