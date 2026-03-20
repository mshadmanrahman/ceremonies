import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "border-2 border-border shadow-hard bg-card",
          },
        }}
      />
    </div>
  );
}
