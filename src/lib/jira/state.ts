import { createHmac } from "crypto";

const ALGORITHM = "sha256";

function getSecret(): string {
  const secret = process.env.JIRA_STATE_SECRET;
  if (!secret) {
    throw new Error("JIRA_STATE_SECRET is not set");
  }
  return secret;
}

interface StatePayload {
  teamId: string;
  userId: string;
  nonce: string;
}

/** Create an HMAC-signed state parameter for OAuth. */
export function signState(payload: StatePayload): string {
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString("base64url");
  const sig = createHmac(ALGORITHM, getSecret()).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

/** Verify and extract the state payload. Returns null if invalid. */
export function verifyState(state: string): StatePayload | null {
  const dotIndex = state.indexOf(".");
  if (dotIndex === -1) return null;

  const b64 = state.slice(0, dotIndex);
  const sig = state.slice(dotIndex + 1);

  const expected = createHmac(ALGORITHM, getSecret())
    .update(b64)
    .digest("base64url");

  if (sig !== expected) return null;

  try {
    const json = Buffer.from(b64, "base64url").toString("utf8");
    return JSON.parse(json) as StatePayload;
  } catch {
    return null;
  }
}
