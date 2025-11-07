import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteExternalsPlugin } from 'vite-plugin-externals'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Use classic runtime to avoid React internals issues
      jsxRuntime: 'classic'
    }),
    viteExternalsPlugin({
      react: 'React',
      'react-dom': 'ReactDOM',
      'react-dom/client': 'ReactDOM'
    })
  ],
  base: './', // Use relative paths for Capacitor compatibility
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
    include: ['@mui/material', '@mui/icons-material'],
    exclude: ['react', 'react-dom'],
    esbuildOptions: {
      target: 'es2015'
    }
  }
})
