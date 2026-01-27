
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env vars regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Injects keys into the client-side code.
      // This allows code to use `process.env.VARIABLE_NAME` directly.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.FIREBASE_API_KEY': JSON.stringify(env.FIREBASE_API_KEY),
      'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(env.FIREBASE_AUTH_DOMAIN),
      'process.env.FIREBASE_PROJECT_ID': JSON.stringify(env.FIREBASE_PROJECT_ID),
      'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(env.FIREBASE_STORAGE_BUCKET),
      'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.FIREBASE_MESSAGING_SENDER_ID),
      'process.env.FIREBASE_APP_ID': JSON.stringify(env.FIREBASE_APP_ID),
      'process.env.FIREBASE_MEASUREMENT_ID': JSON.stringify(env.FIREBASE_MEASUREMENT_ID),
    },
    server: {
      port: 3000,
    },
  };
});
