// Server-side lead capture for the /demo/{slug} email gate.
//
// Why a function and not a netlify.toml proxy: the engine's /growth/capture
// requires `Authorization: Bearer <GROWTH_API_TOKEN>`, and that is a real
// secret — unlike the demo token, it must never ship in the served HTML. A
// static redirect cannot inject a header from an env var, so the token lives
// in this function's runtime env and the browser only ever sees /demo/capture.
// (This is the "edge function injecting the header server-side" that
// src/_data/env.js flags as the proper fix for token exposure.)
//
// Degrades safely: with no GROWTH_API_TOKEN set it returns 503 and the page's
// Netlify Forms fallback still captures the lead. Deploying this before the
// operator sets the env var is therefore a no-op, not a regression.

const ENGINE = "https://web-production-00ba0.up.railway.app/growth/capture";

const json = (body, status) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);

  const token = process.env.GROWTH_API_TOKEN;
  if (!token) return json({ ok: false, error: "capture not configured" }, 503);

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: "bad json" }, 400);
  }
  if (!payload || typeof payload.slug !== "string" || !payload.slug) {
    return json({ ok: false, error: "slug required" }, 400);
  }

  try {
    const res = await fetch(ENGINE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    // Pass the engine's status through so the page can tell captured from failed;
    // the body is already JSON from the engine.
    return new Response(await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json" }
    });
  } catch {
    return json({ ok: false, error: "upstream unreachable" }, 502);
  }
};

export const config = { path: "/demo/capture" };
