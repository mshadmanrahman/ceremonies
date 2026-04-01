# Dogfood Report: Ceremonies.dev

| Field | Value |
|-------|-------|
| **Date** | 2026-03-24 |
| **App URL** | https://ceremonies.dev |
| **Session** | ceremonies-dogfood |
| **Scope** | Full app: landing page, estimation room, retro room, auth, dashboard, billing, mobile |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 1 |
| Medium | 0 |
| Low | 1 |
| **Total** | **3** |

## Issues

### ISSUE-001: Estimation session summary shows 0 tickets/points when ending after agree without "Next"

| Field | Value |
|-------|-------|
| **Severity** | high |
| **Category** | functional |
| **URL** | https://ceremonies.dev/estimation/* |
| **Repro Video** | N/A |

**Description**

When the facilitator agrees on an estimate and then clicks "End" (instead of "Next" then "End"), the session summary shows 0 tickets, 0 points, and no results list. The "Copy summary", "Download CSV", and "Save session" buttons are all hidden because the history is empty. The root cause: the current ticket is only pushed to `history` on the NEXT_TICKET event; clicking End directly skips that step.

**Repro Steps**

1. Join estimation room, load ticket "TEST-42"
2. Vote "5", reveal, set estimate to 5
3. Click "End" (instead of clicking "Next" first)
4. **Observe:** Summary shows 0 tickets, 0 points. No results, no export buttons.
   ![Result](screenshots/13-estimation-summary.png)

---

### ISSUE-002: Sign-in page is completely blank (Clerk JS fails to load)

| Field | Value |
|-------|-------|
| **Severity** | critical |
| **Category** | functional |
| **URL** | https://ceremonies.dev/sign-in |
| **Repro Video** | N/A |

**Description**

The sign-in page renders as a completely blank black screen. Clerk's JavaScript bundle (`clerk.browser.js`) fails to load from `https://clerk.ceremonies.dev/npm/...` because the Clerk production SSL certificate has not been provisioned yet. All 8 Clerk resource requests return status 0 (connection failed). This blocks all authentication: sign-in, sign-up, and the dashboard.

**Root cause:** Production Clerk keys were swapped today, but the Clerk production instance's custom domain (`clerk.ceremonies.dev`) is still showing "SSL certificates: Pending" in the Clerk dashboard. The 3 email DNS records show "Unverified" in Clerk despite being correctly configured in Cloudflare DNS.

**Workaround:** Revert to dev Clerk keys until SSL certs are provisioned, or wait for Clerk to verify the email DNS records and issue certs.

**Repro Steps**

1. Navigate to https://ceremonies.dev/sign-in
2. **Observe:** Blank black screen, no Clerk UI renders
   ![Result](screenshots/20-sign-in.png)

Also affects `/dashboard` which redirects to `accounts.ceremonies.dev/sign-in` and shows Cloudflare Error 1000:
   ![Dashboard unauth](screenshots/23-dashboard-unauth.png)

---

### ISSUE-003: Estimation summary shows 0 tickets when ending session with current ticket still active

| Field | Value |
|-------|-------|
| **Severity** | high |
| **Category** | functional |
| **URL** | https://ceremonies.dev/estimation/* |
| **Repro Video** | N/A |

**Description**

When the facilitator clicks "End" while a ticket is in the "agreed" state (after setting a final estimate), the session summary shows 0 tickets, 0 points, and no results. The "Copy summary", "Download CSV", and "Save session" buttons are all hidden. This is because the current agreed ticket is only pushed to `state.history` when "Next" (NEXT_TICKET) is clicked. Clicking "End" directly passes the empty history to the summary screen.

This is the most common user flow: estimate one ticket, agree, end session. Multi-ticket sessions that use "Next" between tickets work correctly.

**Repro Steps**

1. Join estimation room, enter ticket "TEST-42", vote, reveal, set estimate to 5
   ![Agreed](screenshots/12-estimation-final.png)
2. Click "End" button (top right)
3. **Observe:** Summary shows 0 tickets, 0 points. No export/save buttons.
   ![Result](screenshots/13-estimation-summary.png)

---

### ISSUE-004: Player name truncated on estimation vote cards

| Field | Value |
|-------|-------|
| **Severity** | low |
| **Category** | visual |
| **URL** | https://ceremonies.dev/estimation/* |
| **Repro Video** | N/A |

**Description**

Player names longer than ~8 characters are truncated with "..." on the vote cards (e.g., "Dogfood Tester" shows as "Dogfood T..."). The vote card width is fixed and doesn't accommodate longer names. Names like "Alexandra" or "Christopher" would also be cut off.

**Repro Steps**

1. Join estimation room with name "Dogfood Tester"
2. **Observe:** Name shows as "Dogfood T..." under the vote card
   ![Result](screenshots/06-estimation-voting.png)

---

