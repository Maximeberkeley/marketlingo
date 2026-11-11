// One-time loader: runs the bundled hand-written lesson SQL files (days 6-30) exactly as written.
// Each file is idempotent (stacks upsert, slides replaced), so a second call changes nothing.
import postgres from "npm:postgres@3.4.4";
import { FILES } from "./data.ts";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b, null, 2), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function gunzip(b64: string): Promise<string> {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return await new Response(stream).text();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ markets: Object.keys(FILES) });
  const url = new URL(req.url);
  const market = url.searchParams.get("market");
  if (!market || !(market in FILES)) return json({ error: "market must be one of " + Object.keys(FILES).join(", ") }, 400);
  const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { max: 1, prepare: false });
  try {
    // The files label stack_type 'MICRO_LESSON', which the table rejects; every loaded hand-written lesson uses 'LESSON'.
    const text = (await gunzip(FILES[market])).replaceAll("'MICRO_LESSON', ARRAY[", "'LESSON', ARRAY[");
    await sql.unsafe(text).simple();
    const [r] = await sql`select count(*)::int as n from public.stacks where market_id = ${market} and 'handwritten-v1' = any(tags)`;
    return json({ market, handwrittenStacks: r.n });
  } catch (e) {
    return json({ market, error: e instanceof Error ? e.message : String(e) }, 500);
  } finally {
    await sql.end();
  }
});
