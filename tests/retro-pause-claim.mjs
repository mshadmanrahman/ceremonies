/**
 * Pause/resume and claim facilitation. Takes ~70s because of the 60s claim
 * grace period. Usage: node tests/retro-pause-claim.mjs [host]
 */
const HOST = process.argv[2] || "127.0.0.1:1999";
const ROOM = `pause-${Date.now().toString(36)}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function join(name, anonId) {
  const qs = new URLSearchParams({ name, anonId });
  return new Promise((res, rej) => {
    const ws = new WebSocket(`ws://${HOST}/parties/retro/${ROOM}?${qs}`);
    const c = { ws, state: null };
    ws.addEventListener("message", (e) => { const d = JSON.parse(e.data); if (d.state) c.state = d.state; if (d.type === "sync") { c.id = d.you; res(c); } });
    ws.addEventListener("error", rej);
  });
}
const send = (c, ev) => c.ws.send(JSON.stringify(ev));
const close = async (c) => { c.ws.close(); await sleep(400); };
let pass = true; const check = (n, ok) => { console.log(`${ok ? "PASS" : "FAIL"}: ${n}`); pass &&= ok; };

const fac = await join("Viktor", "anon-viktor");
send(fac, { type: "START_RETRO", facilitatorId: fac.id }); await sleep(300);
const p1 = await join("Charbel", "anon-charbel"); await sleep(300);
check("Viktor facilitates", p1.state.facilitatorId === "anon-viktor");

send(p1, { type: "PAUSE_RETRO", facilitatorId: "anon-viktor" }); await sleep(300);
check("Participant cannot pause", !p1.state.paused);
send(fac, { type: "PAUSE_RETRO", facilitatorId: fac.id }); await sleep(300);
check("Facilitator pauses", p1.state.paused === true);
send(p1, { type: "ADD_CARD", category: "happy", text: "while paused" }); await sleep(300);
check("Cards blocked while paused", p1.state.cards.length === 0);

await close(fac);
check("Away clock starts when facilitator leaves", typeof p1.state.facilitatorAwaySince === "number");
send(p1, { type: "CLAIM_FACILITATION", participantId: "anon-charbel", now: Date.now() + 10 * 60_000 }); await sleep(300);
check("Claim refused inside grace period (client clock ignored)", p1.state.facilitatorId === "anon-viktor");

const back = await join("Viktor", "anon-viktor"); await sleep(300);
check("Facilitator return clears away clock", p1.state.facilitatorAwaySince === null && p1.state.facilitatorId === "anon-viktor");
check("Still paused after return", p1.state.paused === true);
await close(back);

console.log("Waiting 61s for the claim grace period...");
await sleep(61_000);
send(p1, { type: "CLAIM_FACILITATION" }); await sleep(300);
check("Claim accepted after grace period", p1.state.facilitatorId === "anon-charbel" && p1.state.facilitatorLocked === true);
send(p1, { type: "RESUME_RETRO", facilitatorId: p1.id }); await sleep(300);
check("New facilitator resumes", p1.state.paused === false);
send(p1, { type: "ADD_CARD", category: "happy", text: "after resume" }); await sleep(300);
check("Cards accepted after resume", p1.state.cards.length === 1);

const again = await join("Viktor", "anon-viktor"); await sleep(300);
check("Old facilitator rejoining does not take it back", again.state.facilitatorId === "anon-charbel");
again.ws.close(); p1.ws.close();
console.log(pass ? "RESULT: ALL PASS" : "RESULT: FAILURES"); process.exit(pass ? 0 : 1);
