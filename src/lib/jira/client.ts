import { getDb } from "@/lib/db";
import { teamJiraConnections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decryptToken, encryptToken } from "./crypto";
import type { JiraIssue } from "./types";

const ATLASSIAN_TOKEN_URL = "https://auth.atlassian.com/oauth/token";
const REFRESH_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry

// Cache story points field ID per cloud instance (reset on cold start)
const storyPointsFieldCache = new Map<string, string>();

interface TokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

async function loadConnection(teamId: string) {
  const db = getDb();
  const [conn] = await db
    .select()
    .from(teamJiraConnections)
    .where(eq(teamJiraConnections.teamId, teamId))
    .limit(1);

  if (!conn) {
    throw new Error(`No Jira connection for team ${teamId}`);
  }
  return conn;
}

async function refreshTokens(
  refreshToken: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const res = await fetch(ATLASSIAN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: process.env.ATLASSIAN_CLIENT_ID,
      client_secret: process.env.ATLASSIAN_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira token refresh failed (${res.status}): ${text}`);
  }

  return res.json();
}

async function getValidToken(teamId: string): Promise<{ accessToken: string; cloudId: string; siteUrl: string }> {
  const conn = await loadConnection(teamId);
  const now = new Date();

  let accessToken = decryptToken(conn.accessTokenEnc);

  if (conn.tokenExpiresAt.getTime() - now.getTime() < REFRESH_BUFFER_MS) {
    const refreshToken = decryptToken(conn.refreshTokenEnc);
    const tokens = await refreshTokens(refreshToken);

    accessToken = tokens.access_token;
    const expiresAt = new Date(now.getTime() + tokens.expires_in * 1000);

    const db = getDb();
    await db
      .update(teamJiraConnections)
      .set({
        accessTokenEnc: encryptToken(tokens.access_token),
        refreshTokenEnc: encryptToken(tokens.refresh_token),
        tokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(teamJiraConnections.teamId, teamId));
  }

  return { accessToken, cloudId: conn.cloudId, siteUrl: conn.siteUrl };
}

async function jiraFetch(
  accessToken: string,
  cloudId: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3${path}`;
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });
}

export async function searchIssues(
  teamId: string,
  query: string,
  maxResults = 8
): Promise<JiraIssue[]> {
  const { accessToken, cloudId, siteUrl } = await getValidToken(teamId);

  const jql = `text ~ "${query.replace(/"/g, '\\"')}" ORDER BY updated DESC`;
  const res = await jiraFetch(accessToken, cloudId, `/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&fields=summary,status,issuetype`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira search failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return (data.issues ?? []).map((issue: Record<string, unknown>) => {
    const fields = issue.fields as Record<string, unknown>;
    const status = fields.status as Record<string, unknown> | undefined;
    const issueType = fields.issuetype as Record<string, unknown> | undefined;
    return {
      key: issue.key as string,
      summary: (fields.summary as string) ?? "",
      url: `${siteUrl}/browse/${issue.key}`,
      status: (status?.name as string) ?? undefined,
      issueType: (issueType?.name as string) ?? undefined,
    };
  });
}

export async function getIssue(
  teamId: string,
  issueKey: string
): Promise<JiraIssue> {
  const { accessToken, cloudId, siteUrl } = await getValidToken(teamId);

  const res = await jiraFetch(accessToken, cloudId, `/issue/${issueKey}?fields=summary,status,issuetype`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira getIssue failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const fields = data.fields as Record<string, unknown>;
  const status = fields.status as Record<string, unknown> | undefined;
  const issueType = fields.issuetype as Record<string, unknown> | undefined;

  return {
    key: data.key as string,
    summary: (fields.summary as string) ?? "",
    url: `${siteUrl}/browse/${data.key}`,
    status: (status?.name as string) ?? undefined,
    issueType: (issueType?.name as string) ?? undefined,
  };
}

export async function getIssueStatus(
  teamId: string,
  issueKey: string
): Promise<string> {
  const issue = await getIssue(teamId, issueKey);
  return issue.status ?? "Unknown";
}

async function detectStoryPointsField(
  accessToken: string,
  cloudId: string
): Promise<string> {
  const cached = storyPointsFieldCache.get(cloudId);
  if (cached) return cached;

  const res = await jiraFetch(accessToken, cloudId, "/field");
  if (!res.ok) {
    throw new Error(`Failed to fetch Jira fields: ${res.status}`);
  }

  const fields = (await res.json()) as Array<{
    id: string;
    name: string;
    schema?: { custom?: string };
  }>;

  // Look for story_points or Story Points custom field
  const match = fields.find(
    (f) =>
      f.name.toLowerCase().replace(/[^a-z]/g, "") === "storypoints" ||
      f.schema?.custom ===
        "com.atlassian.jira.plugin.system.customfieldtypes:float"
  );

  const fieldId = match?.id ?? "story_points";
  storyPointsFieldCache.set(cloudId, fieldId);
  return fieldId;
}

export async function updateStoryPoints(
  teamId: string,
  issueKey: string,
  points: number
): Promise<void> {
  const { accessToken, cloudId } = await getValidToken(teamId);
  const fieldId = await detectStoryPointsField(accessToken, cloudId);

  const res = await jiraFetch(accessToken, cloudId, `/issue/${issueKey}`, {
    method: "PUT",
    body: JSON.stringify({
      fields: { [fieldId]: points },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira updateStoryPoints failed (${res.status}): ${text}`);
  }
}

export async function createIssue(
  teamId: string,
  projectKey: string,
  summary: string,
  issueType = "Task"
): Promise<JiraIssue> {
  const { accessToken, cloudId, siteUrl } = await getValidToken(teamId);

  const res = await jiraFetch(accessToken, cloudId, "/issue", {
    method: "POST",
    body: JSON.stringify({
      fields: {
        project: { key: projectKey },
        summary,
        issuetype: { name: issueType },
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira createIssue failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return {
    key: data.key as string,
    summary,
    url: `${siteUrl}/browse/${data.key}`,
  };
}

/** Check if a team has an active Jira connection. */
export async function hasJiraConnection(teamId: string): Promise<boolean> {
  const db = getDb();
  const [conn] = await db
    .select({ id: teamJiraConnections.id })
    .from(teamJiraConnections)
    .where(eq(teamJiraConnections.teamId, teamId))
    .limit(1);
  return !!conn;
}
