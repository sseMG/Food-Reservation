module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // JCKL Academy Theme Colors - Based on the academy's royal branding
        'jckl': {
          'navy': '#1a3a7a',      // Deep royal navy
          'purple': '#6b3fa0',     // Royal purple from crown
          'gold': '#fcd34d',       // Bright gold accents
          'cream': '#f9f7f1',      // Warm off-white/cream
          'white': '#ffffff',      // Pure white
          'slate': '#374151',      // Neutral slate
          'accent': '#dc2626',     // Warm red accent
          'light-navy': '#2d5aae', // Lighter navy
          'light-purple': '#8b5cf6', // Lighter purple
          'muted-gold': '#f3d64a', // Muted gold
        }
      },
      ringColor: {
        'brand': '#1a3a7a', // JCKL Navy as brand color
        'accent': '#6b3fa0', // JCKL Purple accent
      },
      ringOffsetWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [
    // Custom plugin for focus-visible styles
    function({ addBase }) {
      addBase({
        // Ensure focus-visible is used by default, not focus
        '*:focus:not(:focus-visible)': {
          outline: 'none',
        },
      });
    },
  ],
}
