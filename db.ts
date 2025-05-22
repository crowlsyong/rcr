/// <reference lib="deno.unstable" />

const db = await Deno.openKv();

export default db;
