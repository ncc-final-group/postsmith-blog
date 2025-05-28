/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    // 필요시 app, layouts 등 추가
  ],
  theme: { extend: {} },
  plugins: [],
};
