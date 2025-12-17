// routes/slots/index.tsx
import { Handlers } from "$fresh/server.ts";
import Slots from "../../islands/games/slots/Slots.tsx";

export const handler: Handlers = {
  GET(_req, ctx) {
    return ctx.render();
  },
};

export default function SlotsPage() {
  return (
    <div class="min-h-screen w-screen flex items-center justify-center px-4 py-10">
      <Slots />
    </div>
  );
}
