import{a as t}from"./chunk-MEABNXAK.js";import{a as o,b as i,c as y,d as b}from"./chunk-NGSZJRVL.js";function n(a,r){return Math.random()*(r-a)+a}function g(){return`${Date.now()}-${Math.random().toString(16).slice(2)}`}function p(a){let[r,v]=o(!1),[l,d]=o(!1),[x,u]=o([]),f=y(!1),c=b(()=>["\u{1F389}","\u2728","\u{1FA99}","\u{1F48E}","\u2B50","\u{1F38A}","\u{1F525}","\u{1F308}"],[]);return i(()=>{v(!0)},[]),i(()=>{if(r){if(a.show&&!f.current){d(!0);let e=80,s=[];for(let m=0;m<e;m++)s.push({id:g(),left:n(0,100),size:n(14,26),delay:n(0,.6),dur:n(1.8,3.3),rot:n(-180,180),sway:n(10,55),emoji:c[Math.floor(Math.random()*c.length)]});u(s),globalThis.setTimeout(()=>u([]),3600)}f.current=a.show}},[a.show,r,c]),i(()=>{if(!l)return;let e=s=>{s.key==="Escape"&&d(!1)};return globalThis.addEventListener("keydown",e),()=>globalThis.removeEventListener("keydown",e)},[l]),!a.show||!l?null:t("div",{class:"fixed inset-0 z-50",onClick:()=>d(!1),role:"button",tabIndex:0,children:[t("style",{dangerouslySetInnerHTML:{__html:`
@keyframes winner-pop {
  0% { transform: translateY(10px) scale(0.98); opacity: 0; }
  18% { transform: translateY(0px) scale(1); opacity: 1; }
  100% { transform: translateY(-2px) scale(1); opacity: 1; }
}
@keyframes confetti-fall {
  0% { transform: translate3d(var(--x0), -20px, 0) rotate(var(--r0)); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translate3d(var(--x1), 110vh, 0) rotate(calc(var(--r0) + 720deg)); opacity: 0; }
}
@keyframes glow-pulse {
  0% { opacity: 0.55; }
  50% { opacity: 0.9; }
  100% { opacity: 0.55; }
}
`}}),t("div",{class:"absolute inset-0",style:{background:"radial-gradient(circle at 50% 25%, rgba(16,185,129,0.25), transparent 55%), radial-gradient(circle at 50% 75%, rgba(250,204,21,0.22), transparent 60%), rgba(0,0,0,0.55)",animation:"glow-pulse 1.2s ease-in-out infinite"}}),t("div",{class:"absolute inset-0 flex items-center justify-center px-4 pointer-events-none",children:t("div",{class:"max-w-md w-full rounded-3xl border border-emerald-400/30 bg-gradient-to-b from-gray-950 to-black shadow-2xl pointer-events-none",style:{animation:"winner-pop 420ms ease-out both"},children:t("div",{class:"p-6",children:[t("div",{class:"text-xs tracking-widest text-emerald-200/80 font-extrabold",children:"JACKPOT"}),t("div",{class:"mt-2 text-3xl font-black text-gray-100 leading-tight",children:["\u{1F389} ",a.amount," mana"]}),t("div",{class:"mt-2 text-sm text-gray-300",children:"click anywhere to close"})]})})}),t("div",{class:"absolute inset-0 overflow-hidden pointer-events-none",children:x.map(e=>t("div",{class:"absolute top-0",style:{left:`${e.left}vw`,fontSize:`${e.size}px`,animation:`confetti-fall ${e.dur}s linear ${e.delay}s both`,"--x0":`${n(-20,20)}px`,"--x1":`${n(-e.sway,e.sway)}px`,"--r0":`${e.rot}deg`,filter:"drop-shadow(0 10px 18px rgba(0,0,0,0.35))"},children:e.emoji},e.id))})]})}export{p as a};
