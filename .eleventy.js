// Eleventy build for the ai.maxifidigital.com Netlify site.
//
// Two kinds of content, one output:
//   1. The lead-gen landing page — the repo-root `index.html` (+ images/ +
//      the /ai-visibility/ redirect stub), passed through UNTOUCHED. This is
//      the same file GitHub Pages serves today, so merging this build config
//      changes nothing about the live Pages site until the Netlify cutover.
//   2. Per-prospect demo pages — demos/{slug}.json → /demo-{slug}/ via
//      src/demo.njk (see README.md §The rule).
module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "index.html": "index.html" });
  eleventyConfig.addPassthroughCopy({ "images": "images" });
  eleventyConfig.addPassthroughCopy({ "ai-visibility": "ai-visibility" });
  eleventyConfig.addPassthroughCopy({ "demo-assets": "demo-assets" });

  return {
    dir: { input: "src", output: "_site" },
  };
};
