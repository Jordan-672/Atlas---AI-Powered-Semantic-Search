module.exports = {
  plugins: {
    tailwindcss: {},
    // tailwindcss: run the Tailwind CSS PostCSS plugin.
    // This scans our content files and generates the CSS utility classes we use.
    autoprefixer: {},
    // autoprefixer: automatically adds vendor prefixes (-webkit-, -moz-, etc.)
    // so our CSS works across different browsers.
  },
};