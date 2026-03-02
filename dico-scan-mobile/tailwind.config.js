/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./App.{js,jsx,ts,tsx}",
        "./src/**/*.{js,jsx,ts,tsx}"
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                brand: {
                    primary: "#6366F1",
                    secondary: "#818CF8",
                },
                surface: "#1E293B",
                background: "#0F172A",
                rating: {
                    green: "#22C55E",
                    yellow: "#EAB308",
                    red: "#EF4444",
                    unknown: "#6B7280",
                }
            },
            fontFamily: {
                sans: ["Inter_400Regular"],
                semibold: ["Inter_600SemiBold"],
                bold: ["Inter_700Bold"],
            }
        }
    },
    plugins: [],
}
