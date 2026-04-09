import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { teamJiraConnections } from "@/lib/db/schema";
import { encryptToken } from "@/lib/jira/crypto";
import { verifyState } from "@/lib/jira/state";

/**
 * GET /api/jira/callback?code={code}&state={state}
 *
 * Atlassian OAuth 2.0 redirect target. Exchanges the auth code
 * for tokens, fetches the accessible Jira site, and stores the
 * encrypted connection in the database.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3456";

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/dashboard?jira_error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(`${appUrl}/dashboard?jira_error=missing_params`);
  }

  // Verify HMAC state
  const payload = verifyState(stateParam);
  if (!payload) {
    return NextResponse.redirect(`${appUrl}/dashboard?jira_error=invalid_state`);
  }

  // Re-verify Clerk session
  const { userId } = await auth();
  if (!userId || userId !== payload.userId) {
    return NextResponse.redirect(`${appUrl}/dashboard?jira_error=session_expired`);
  }

  const { teamId } = payload;

  // Exchange code for tokens
  const tokenRes = await fetch("https://auth.atlassian.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: process.env.ATLASSIAN_CLIENT_ID,
      client_secret: process.env.ATLASSIAN_CLIENT_SECRET,
      code,
      redirect_uri: process.env.ATLASSIAN_REDIRECT_URI,
    }),
  });

  if (!tokenRes.ok) {
    console.error("[jira] Token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(
      `${appUrl}/dashboard/team/${teamId}?jira_error=token_exchange`
    );
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
  };

  // Fetch accessible Jira sites
  const sitesRes = await fetch(
    "https://api.atlassian.com/oauth/token/accessible-resources",
    {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    }
  );

  if (!sitesRes.ok) {
    console.error("[jira] Failed to fetch sites:", await sitesRes.text());
    return NextResponse.redirect(
      `${appUrl}/dashboard/team/${teamId}?jira_error=no_sites`
    );
  }

  const sites = (await sitesRes.json()) as Array<{
    id: string;
    url: string;
    name: string;
  }>;

  if (sites.length === 0) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/team/${teamId}?jira_error=no_sites`
    );
  }

  // Use first site (v1 simplification)
  const site = sites[0];
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  // Upsert connection (one per team)
  const db = getDb();
  await db
    .insert(teamJiraConnections)
    .values({
      teamId,
      cloudId: site.id,
      siteUrl: site.url,
      siteName: site.name,
      accessTokenEnc: encryptToken(tokens.access_token),
      refreshTokenEnc: encryptToken(tokens.refresh_token),
      tokenExpiresAt: expiresAt,
      scopes: tokens.scope,
      connectedBy: userId,
    })
    .onConflictDoUpdate({
      target: teamJiraConnections.teamId,
      set: {
        cloudId: site.id,
        siteUrl: site.url,
        siteName: site.name,
        accessTokenEnc: encryptToken(tokens.access_token),
        refreshTokenEnc: encryptToken(tokens.refresh_token),
        tokenExpiresAt: expiresAt,
        scopes: tokens.scope,
        connectedBy: userId,
        updatedAt: new Date(),
      },
    });

  return NextResponse.redirect(
    `${appUrl}/dashboard/team/${teamId}?jira=connected`
  );
}
