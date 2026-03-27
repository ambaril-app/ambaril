import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  plugins: [
    heroui({
      defaultTheme: "dark",
      themes: {
        dark: {
          colors: {
            background: "#07080B",
            foreground: "#D0D4DE",
            primary: {
              50: "rgba(96, 165, 250, 0.08)",
              100: "rgba(96, 165, 250, 0.15)",
              200: "rgba(96, 165, 250, 0.25)",
              300: "#60A5FA",
              400: "#60A5FA",
              500: "#60A5FA",
              600: "#60A5FA",
              700: "#3B82F6",
              800: "#2563EB",
              900: "#1D4ED8",
              DEFAULT: "#60A5FA",
              foreground: "#F7F8FA",
            },
            secondary: {
              DEFAULT: "#16181F",
              foreground: "#D0D4DE",
            },
            success: {
              50: "rgba(62, 207, 142, 0.08)",
              DEFAULT: "#3ECF8E",
              foreground: "#F7F8FA",
            },
            warning: {
              50: "rgba(245, 165, 36, 0.08)",
              DEFAULT: "#F5A524",
              foreground: "#F7F8FA",
            },
            danger: {
              50: "rgba(239, 68, 68, 0.08)",
              DEFAULT: "#EF4444",
              foreground: "#F7F8FA",
            },
            default: {
              50: "#07080B",
              100: "#0C0E13",
              200: "#101216",
              300: "#16181F",
              400: "#1C1F28",
              500: "#262A34",
              600: "#3A3F4C",
              700: "#5C6170",
              800: "#7C8293",
              900: "#D0D4DE",
              DEFAULT: "#262A34",
              foreground: "#D0D4DE",
            },
            content1: "#0C0E13",
            content2: "#101216",
            content3: "#16181F",
            content4: "#1C1F28",
            divider: "#262A34",
            focus: "#60A5FA",
          },
        },
      },
    }),
  ],
};
