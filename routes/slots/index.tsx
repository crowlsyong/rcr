// routes/slots/index.tsx
import Slots from "../../islands/games/slots/Slots.tsx";
import About from "../../islands/games/slots/About.tsx";
import { Handlers } from "fresh/compat";

// import JumboSlotMachine from "../../islands/games/slots/JumboSlotMachine.tsx";

export const handler: Handlers = {
  GET(ctx) {
    return ctx.render();
  },
};

export default function SlotsPage() {
  return (
    <div class="min-h-[100svh] w-screen overflow-hidden flex flex-col items-center justify-center px-4 py-8 md:px-8">
      {/* <JumboSlotMachine /> */}
      <Slots />
      <About />
    </div>
  );
}
