import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  base: './', // Use relative paths for Capacitor compatibility
  server: {
    port: 5173,
    host: true
  },
  build: {
    // Target older browsers for better iOS WebView compatibility
    target: 'es2015',
    // Disable code splitting for better Capacitor compatibility
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // Use a single bundle for better mobile compatibility
        inlineDynamicImports: true,
        // Use ES format
        format: 'es',
      }
    },
    // Increase chunk size warning limit since we're bundling everything
    chunkSizeWarningLimit: 2000,
    // Ensure source maps for debugging
    sourcemap: true,
    // Disable minification for debugging
    minify: false,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    }
  },
  // Optimize dependencies for mobile
  optimizeDeps: {
    include: ['@mui/material', '@mui/icons-material', 'react', 'react-dom'],
    esbuildOptions: {
      target: 'es2015'
    }
  }
})
