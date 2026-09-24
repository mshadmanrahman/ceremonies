/**
 * Regression: facilitator must not move to whoever reconnects first after all
 * sockets drop (retro b4xnde, 2026-09-24). Usage: node tests/retro-facilitator-hijack.mjs [host]
 */
const HOST = process.argv[2] || "127.0.0.1:1999";
const ROOM = `hijack-${Date.now().toString(36)}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function join(name, anonId, userId) {
  const qs = new URLSearchParams({ name, anonId }); if (userId) qs.set("userId", userId);
  return new Promise((res, rej) => {
    const ws = new WebSocket(`ws://${HOST}/parties/retro/${ROOM}?${qs}`);
    const c = { ws, state: null };
    ws.addEventListener("message", (e) => { const d = JSON.parse(e.data); if (d.state) c.state = d.state; if (d.type === "sync") { c.id = d.you; res(c); } });
    ws.addEventListener("error", rej);
  });
}
const close = async (c) => { c.ws.close(); await sleep(400); };
let pass = true; const check = (n, ok) => { console.log(`${ok ? "PASS" : "FAIL"}: ${n}`); pass &&= ok; };
let shadman = await join("Shadman", "anon-shadman", "user_creator");
shadman.ws.send(JSON.stringify({ type: "START_RETRO", facilitatorId: shadman.id, teamId: "", createdBy: "user_creator" }));
await sleep(300);
let katja = await join("Katja", "anon-katja", "user_katja");
await sleep(300);
check("Shadman is facilitator at start", katja.state.facilitatorId === "anon-shadman");
// Everyone drops at once, Katja reconnects first
await close(shadman); await close(katja);
katja = await join("Katja", "anon-katja", "user_katja"); await sleep(300);
check("Katja reconnecting first does NOT take facilitator", katja.state.facilitatorId === "anon-shadman");
shadman = await join("Shadman", "anon-shadman", "user_creator"); await sleep(300);
check("Shadman still facilitator after reconnect", shadman.state.facilitatorId === "anon-shadman");
// Creator on a new device (different anonId) can reclaim
await close(shadman);
const shadman2 = await join("Shadman", "anon-shadman-laptop2", "user_creator"); await sleep(300);
check("Creator on another device reclaims", shadman2.state.facilitatorId === "anon-shadman-laptop2");
// Explicit transfer is respected
shadman2.ws.send(JSON.stringify({ type: "TRANSFER_FACILITATION", targetId: "anon-katja", facilitatorId: shadman2.id })); await sleep(300);
await close(shadman2);
const shadman3 = await join("Shadman", "anon-shadman", "user_creator"); await sleep(300);
check("After explicit transfer, creator does not snatch it back", shadman3.state.facilitatorId === "anon-katja");
katja.ws.close(); shadman3.ws.close();
console.log(pass ? "RESULT: ALL PASS" : "RESULT: FAILURES"); process.exit(pass ? 0 : 1);
