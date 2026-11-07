/**
 * Retro renaming: facilitator-only, trimmed, capped, survives reconnect,
 * exposed on the ?status endpoint. Usage: node tests/retro-rename.mjs [host]
 */
const HOST = process.argv[2] || "127.0.0.1:1999";
const ROOM = `rename-${Date.now().toString(36)}`;
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
const status = async () => (await fetch(`http://${HOST}/parties/retro/${ROOM}?status`)).json();
let pass = true; const check = (n, ok) => { console.log(`${ok ? "PASS" : "FAIL"}: ${n}`); pass &&= ok; };

const fac = await join("Viktor", "anon-viktor");
const p1 = await join("Charbel", "anon-charbel"); await sleep(300);
check("New room has no title", (p1.state.title ?? null) === null);

send(fac, { type: "RENAME_RETRO", title: "  Sprint   42 retro  ", facilitatorId: fac.id }); await sleep(300);
check("Facilitator renames in the lobby, whitespace collapsed", p1.state.title === "Sprint 42 retro");

send(p1, { type: "RENAME_RETRO", title: "Hijacked", facilitatorId: "anon-viktor" }); await sleep(300);
check("Participant cannot rename (spoofed facilitatorId ignored)", p1.state.title === "Sprint 42 retro");

send(fac, { type: "RENAME_RETRO", title: "x".repeat(200), facilitatorId: fac.id }); await sleep(300);
check("Title capped at 80 chars", p1.state.title?.length === 80);

send(fac, { type: "START_RETRO", facilitatorId: fac.id }); await sleep(300);
send(fac, { type: "PAUSE_RETRO", facilitatorId: fac.id }); await sleep(300);
send(fac, { type: "RENAME_RETRO", title: "Q4 planning retro", facilitatorId: fac.id }); await sleep(300);
check("Rename allowed while paused", p1.state.title === "Q4 planning retro");

const s = await status();
check("?status exposes title", s.title === "Q4 planning retro");

fac.ws.close(); await sleep(400);
const back = await join("Viktor", "anon-viktor");
check("Title survives reconnect", back.state.title === "Q4 planning retro");

send(back, { type: "RENAME_RETRO", title: "   ", facilitatorId: back.id }); await sleep(300);
check("Empty name clears title (falls back to room code)", p1.state.title === null);
check("?status reports null after clearing", (await status()).title === null);

back.ws.close(); p1.ws.close();
console.log(pass ? "RESULT: ALL PASS" : "RESULT: FAILURES"); process.exit(pass ? 0 : 1);
