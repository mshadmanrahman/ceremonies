import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that require authentication (facilitator dashboard, team settings)
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/teams(.*)",
  "/settings(.*)",
]);

// Public routes: landing page, estimation/retro rooms (participants use room code, no auth)
// Sign-in and sign-up pages are always public
export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip static files and Next.js internals
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
