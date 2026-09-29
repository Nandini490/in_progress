import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // Choose port 5174 to avoid collision with developer-journey on 5173
    host: true,
  },
});
