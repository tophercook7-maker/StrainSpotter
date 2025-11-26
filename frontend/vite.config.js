import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

// Plugin to ensure React loads before MUI and is available globally
function ensureReactFirst() {
  return {
    name: 'ensure-react-first',
    generateBundle(options, bundle) {
      // Find React vendor chunk and ensure it exports React globally
      const reactChunk = Object.values(bundle).find(
        chunk => chunk.type === 'chunk' && chunk.name === 'react-vendor'
      );
      
      if (reactChunk && reactChunk.type === 'chunk') {
        // Inject at the very end of the chunk to avoid breaking syntax
        // This ensures React is available globally after the entire chunk loads
        reactChunk.code += `
;(function() {
  try {
    if (typeof window !== 'undefined') {
      var ReactModule = typeof React !== 'undefined' ? React : null;
      if (ReactModule) {
        window.React = ReactModule;
        if (typeof globalThis !== 'undefined') {
          globalThis.React = ReactModule;
        }
        try {
          Object.defineProperty(window, 'React', {
            value: ReactModule,
            writable: false,
            configurable: false,
            enumerable: true
          });
        } catch(e) {
          // Property already defined, that's okay
        }
      }
    }
  } catch(e) {
    console.warn('[React Global] Failed to set React globally:', e);
  }
})();
`;
      }
    },
    writeBundle(options) {
      if (options.dir) {
        const htmlPath = resolve(options.dir, 'index.html')
        try {
          let html = readFileSync(htmlPath, 'utf-8')
          
          // Find all modulepreload links and script tags
          const preloadRegex = /<link\s+rel="modulepreload"[^>]*>/g
          const scriptRegex = /<script[^>]*type="module"[^>]*src="([^"]*)"[^>]*><\/script>/g
          const matches = html.match(preloadRegex) || []
          const scriptMatches = [...html.matchAll(scriptRegex)]
          
          if (matches.length > 0 || scriptMatches.length > 0) {
            // Separate by type - React vendor (now includes MUI) MUST come first
            const reactPreloads = matches.filter(m => m.includes('react-vendor'))
            const otherPreloads = matches.filter(m => !m.includes('react-vendor'))
            
            // Separate scripts by type - ensure they have closing tags
            const reactScripts = scriptMatches.filter(m => m[1].includes('react-vendor')).map(m => {
              // Ensure script tag is properly closed
              return m[0].includes('</script>') ? m[0] : m[0].replace(/>$/, '></script>');
            });
            const mainScripts = scriptMatches.filter(m => m[1].includes('main') || m[1].includes('index')).map(m => {
              return m[0].includes('</script>') ? m[0] : m[0].replace(/>$/, '></script>');
            });
            const otherScripts = scriptMatches.filter(m => 
              !m[1].includes('react-vendor') && 
              !m[1].includes('main') && 
              !m[1].includes('index')
            ).map(m => {
              return m[0].includes('</script>') ? m[0] : m[0].replace(/>$/, '></script>');
            })
            
            // Remove all preloads and module scripts
            let newHtml = html.replace(preloadRegex, '')
            scriptMatches.forEach(match => {
              newHtml = newHtml.replace(match[0], '')
            })
            
            // Find where to insert (before closing body tag or at end of body)
            const bodyCloseMatch = newHtml.match(/<\/body>/)
            const insertPos = bodyCloseMatch ? bodyCloseMatch.index : newHtml.length
            
            // Build ordered list: React vendor (includes MUI) first, then vendor, then main, then others
            const vendorPreloads = otherPreloads.filter(m => m.includes('vendor'))
            const otherPreloadsFiltered = otherPreloads.filter(m => !m.includes('vendor'))
            
            const orderedPreloads = [
              ...reactPreloads,
              ...vendorPreloads,
              ...otherPreloadsFiltered
            ]
            
            const vendorScripts = otherScripts.filter(m => m.includes('vendor'))
            const otherScriptsFiltered = otherScripts.filter(m => !m.includes('vendor'))
            
            const orderedScripts = [
              ...reactScripts,
              ...vendorScripts,
              ...mainScripts,
              ...otherScriptsFiltered
            ]
            
            const allToInsert = [
              ...orderedPreloads,
              ...orderedScripts
            ].filter(Boolean).join('\n    ')
            
            if (allToInsert) {
              newHtml = newHtml.slice(0, insertPos) + 
                       '\n    ' + allToInsert + '\n  ' + 
                       newHtml.slice(insertPos)
            }
            
            // No need for inline script since React and MUI are in the same chunk now
            
            writeFileSync(htmlPath, newHtml, 'utf-8')
          }
        } catch (err) {
          console.warn('Could not fix preload order:', err.message)
        }
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Determine if building for mobile (Capacitor) or web
  const isMobile = process.env.BUILD_TARGET === 'mobile' || process.env.CAP_BUILD === 'true';
  const buildDir = isMobile ? 'dist-mobile' : 'dist';
  
  return {
    plugins: [
      react(),
      ensureReactFirst()
    ],
    base: './', // Use relative paths for Capacitor compatibility
    server: {
      port: 5173,
      host: true
    },
    build: {
      outDir: buildDir, // Separate output directories
    // Target modern browsers for better performance
    target: 'es2020',
    // Enable code splitting for faster initial load
    rollupOptions: {
      output: {
        // Split vendor libraries into separate chunks
        manualChunks: (id) => {
          // CRITICAL: Keep React, React DOM, MUI, and Emotion ALL together
          // This prevents "Cannot access React before initialization" errors
          // MUI needs React to be fully initialized before it can use it
          // Also include ANY MUI-related packages to prevent circular deps
          if (id.includes('react/') || 
              id.includes('react-dom/') || 
              id.includes('/scheduler/') ||
              id.includes('react/jsx-runtime') ||
              id.includes('react-is') ||
              id.includes('react/jsx-dev-runtime') ||
              id.includes('@emotion/') || 
              id.includes('@mui/') ||  // Catch ALL MUI packages, not just specific ones
              id.includes('mui')) {     // Also catch any mui references
            return 'react-vendor';
          }
          // Split vendor into smaller chunks to avoid circular dependencies
          // Router and related deps
          if (id.includes('node_modules') && (
              id.includes('react-router') ||
              id.includes('history')
          )) {
            return 'router-vendor';
          }
          // Other node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        format: 'es',
        // Ensure proper chunk loading order
        chunkFileNames: (chunkInfo) => {
          // React vendor must load first
          if (chunkInfo.name === 'react-vendor') {
            return 'assets/react-vendor-[hash].js';
          }
          // MUI loads after React
          if (chunkInfo.name === 'mui') {
            return 'assets/mui-[hash].js';
          }
          return 'assets/[name]-[hash].js';
        },
      }
    },
    chunkSizeWarningLimit: 1000,
    // Disable source maps in production for smaller bundle
    sourcemap: process.env.NODE_ENV === 'development',
    // Use esbuild minification instead of terser to avoid circular dependency issues
    // esbuild handles ES modules better and preserves initialization order
    minify: 'esbuild',
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    }
  },
  // Optimize dependencies for mobile
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react/jsx-runtime',
      'scheduler',
      '@emotion/react',
      '@emotion/styled',
      '@mui/material', 
      '@mui/icons-material'
    ],
    esbuildOptions: {
      target: 'es2015'
    },
    // Force React to be pre-bundled first
    force: true
  },
  // Ensure React scheduler and Emotion are properly resolved
  resolve: {
    dedupe: ['react', 'react-dom', 'scheduler', '@emotion/react', '@emotion/styled'],
    alias: {
      '@emotion/react': '@emotion/react',
      '@emotion/styled': '@emotion/styled'
    }
  };
});
