import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// Camera access requires HTTPS (or localhost). Run `npm run dev:https` to serve
// a self-signed certificate so you can test on a phone over your local network.
export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? '/tracespace/' : '/',
  plugins: [react(), ...(process.env.HTTPS ? [basicSsl()] : [])],
  server: { host: true, port: 5173 },
});
