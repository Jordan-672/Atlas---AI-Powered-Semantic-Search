/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    // Scan all files in ./pages/ with these extensions for Tailwind class names
    // **/ : any subdirectory depth
    // *.{js,ts,jsx,tsx,mdx} : files with any of these extensions
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // Also scan ./components/
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // Also scan ./app/ (for future App Router usage)
  ],
  theme: {
    extend: {
      // extend: add to Tailwind's default theme without replacing it
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        // Add a custom font family. `font-mono` will now use JetBrains Mono.
        display: ["'Space Grotesk'", "sans-serif"],
        // `font-display` → Space Grotesk
      },
      colors: {
        // Add custom color tokens accessible via Tailwind classes
        atlas: {
          bg: "#0a0e1a",         // Deep navy background
          surface: "#111827",     // Slightly lighter surface
          border: "#1f2937",      // Subtle border color
          accent: "#3b82f6",      // Electric blue accent
          "accent-glow": "#60a5fa", // Lighter blue for glow effects
          text: "#e2e8f0",         // Off-white primary text
          muted: "#64748b",        // Muted grey secondary text
          success: "#10b981",      // Green for success states
          warning: "#f59e0b",      // Amber for warnings
        },
      },
      animation: {
        // Custom CSS animations
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        // pulse-slow: a slow version of Tailwind's built-in pulse animation
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        // Define the actual keyframe animations referenced above
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
  // plugins: array of Tailwind plugins. Empty for now.
};