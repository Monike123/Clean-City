const path = require('path');

module.exports = {
  presets: [require("nativewind/preset")],
  content: [
    path.join(__dirname, "./app/**/*.{js,jsx,ts,tsx}"),
    path.join(__dirname, "./components/**/*.{js,jsx,ts,tsx}")
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2E7D32', // Nature Green
        secondary: '#1565C0', // Trust Blue
        accent: '#FFC107', // Achievement Gold
        danger: '#D32F2F',
        success: '#388E3C',
        background: '#F8F9FA',
        card: '#FFFFFF',
        text: '#1A1A1A',
        textLight: '#757575',
      },
      fontFamily: {
        inter: ['Inter_400Regular'],
        'inter-bold': ['Inter_700Bold'],
        'inter-medium': ['Inter_500Medium'],
      },
    },
  },
  plugins: [],
}
