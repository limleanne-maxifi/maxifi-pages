// Build-time environment injection. The demo access token is read from the
// Netlify build env (Site settings → Environment variables → DEMO_PAGE_TOKEN)
// and templated into the page at build — NEVER committed to this public repo.
//
// Honest limits, stated plainly: the token still ships in the served HTML, so
// anyone who views source on a live demo page can extract it and spend demo
// budget. That exposure is bounded server-side by the engine's
// DEMO_DAILY_COST_CAP_USD lane and the per-IP rate limit, and the token is
// demo-scoped and rotatable (rotate DEMO_ACCESS_TOKEN on the engine + this
// env var together). True secrecy would need an edge function injecting the
// header server-side — tracked as a follow-up in the README.
module.exports = () => ({
  demoToken: process.env.DEMO_PAGE_TOKEN || "",
});
