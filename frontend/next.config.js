/** @type {import('next').NextConfig} */
// This JSDoc comment tells your editor that `nextConfig` has the type of Next.js's config object.
// It enables autocompletion for all config options.

const nextConfig = {
  reactStrictMode: true,
  // reactStrictMode: true — enables React's Strict Mode.
  // In development, React renders components twice to help detect side-effects.
  // Has no effect in production builds.
};

module.exports = nextConfig;
// module.exports: CommonJS export syntax (Next.js config files use CommonJS, not ES modules)
// We export `nextConfig` so Next.js can read our configuration.