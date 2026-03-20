import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <SignIn
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
