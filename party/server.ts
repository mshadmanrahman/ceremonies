import { routePartykitRequest } from "partyserver";
import { EstimationServer } from "./estimation";
import { RetroServer } from "./retro";

export { EstimationServer, RetroServer };

/**
 * Worker entry. Routes /parties/:party/:room to the matching Durable Object.
 * Keeps the PartyKit URL shape, so partysocket clients only change host.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return (
      (await routePartykitRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
