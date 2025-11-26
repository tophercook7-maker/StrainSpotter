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
  const isProduction = mode === 'production';
  
  // Mobile-specific optimizations: smaller chunks, more aggressive splitting
  const mobileChunkSize = 200; // Smaller chunks for mobile (200KB)
  const webChunkSize = 500; // Larger chunks OK for web (500KB)
  const chunkSizeLimit = isMobile ? mobileChunkSize : webChunkSize;
  
  return {
    plugins: [
      react({
        // Optimize React for production
        jsxRuntime: 'automatic',
        jsxImportSource: 'react'
      }),
      ensureReactFirst()
    ],
    base: './', // Use relative paths for Capacitor compatibility
    server: {
      port: 5173,
      host: true
    },
    build: {
      outDir: buildDir,
      // Target modern browsers for better performance
      target: isMobile ? 'es2020' : 'es2022', // Mobile: broader support, Web: latest features
      // CSS code splitting for better caching
      cssCodeSplit: true,
      // Optimize asset inlining threshold
      assetsInlineLimit: isMobile ? 4096 : 8192, // Mobile: inline smaller assets
      // Enable code splitting for faster initial load
      rollupOptions: {
        output: {
          // Advanced code splitting strategy
          manualChunks: (id) => {
            // CRITICAL: Keep React, React DOM, MUI, and Emotion ALL together
            if (id.includes('react/') || 
                id.includes('react-dom/') || 
                id.includes('/scheduler/') ||
                id.includes('react/jsx-runtime') ||
                id.includes('react-is') ||
                id.includes('react/jsx-dev-runtime') ||
                id.includes('@emotion/') || 
                id.includes('@mui/') ||
                id.includes('mui')) {
              return 'react-vendor';
            }
            
            // Router and related deps
            if (id.includes('node_modules') && (
                id.includes('react-router') ||
                id.includes('history')
            )) {
              return 'router-vendor';
            }
            
            // Supabase client (large, used frequently)
            if (id.includes('node_modules') && id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            
            // Charts library (large, lazy-loaded)
            if (id.includes('node_modules') && id.includes('recharts')) {
              return 'charts-vendor';
            }
            
            // For mobile: be more conservative with chunking to avoid circular deps
            // Other node_modules - keep together to avoid initialization issues
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
          format: 'es',
          // Optimize chunk file names for better caching
          chunkFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'react-vendor') {
              return 'assets/react-vendor-[hash].js';
            }
            if (chunkInfo.name === 'router-vendor') {
              return 'assets/router-vendor-[hash].js';
            }
            if (chunkInfo.name === 'supabase-vendor') {
              return 'assets/supabase-vendor-[hash].js';
            }
            if (chunkInfo.name === 'charts-vendor') {
              return 'assets/charts-vendor-[hash].js';
            }
            return 'assets/[name]-[hash].js';
          },
          // Optimize asset file names
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (/woff2?|eot|ttf|otf/i.test(ext)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
          // Compact output for smaller file sizes
          compact: true,
          // Preserve module structure for better tree-shaking
          preserveModules: false
        },
        // Tree-shaking optimizations - be conservative for mobile
        treeshake: {
          moduleSideEffects: isMobile ? 'no-external' : false, // More conservative for mobile
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
          // Preserve module structure to avoid circular dependency issues
          preset: isMobile ? 'smallest' : 'recommended'
        }
      },
      // Chunk size warning limit (adjusted for mobile)
      chunkSizeWarningLimit: chunkSizeLimit,
      // Disable source maps in production for smaller bundle
      sourcemap: !isProduction,
      // Enhanced minification - use esbuild for better ES module support
      minify: isProduction ? 'esbuild' : false,
      // CommonJS options
      commonjsOptions: {
        transformMixedEsModules: true,
        include: [/node_modules/],
        // Optimize require calls
        requireReturnsDefault: 'auto'
      },
      // Report compressed sizes
      reportCompressedSize: true,
      // Copy public assets efficiently
      copyPublicDir: true
    },
    // Optimize dependencies
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
      exclude: isMobile ? ['recharts'] : [], // Exclude large libs on mobile, lazy-load instead
      esbuildOptions: {
        target: isMobile ? 'es2015' : 'es2020',
        // Optimize for size
        minifyIdentifiers: isProduction,
        minifySyntax: isProduction,
        minifyWhitespace: isProduction
      },
      // Force pre-bundling
      force: false // Only force when needed
    },
    // Resolve optimizations
    resolve: {
      dedupe: ['react', 'react-dom', 'scheduler', '@emotion/react', '@emotion/styled'],
      alias: {
        '@emotion/react': '@emotion/react',
        '@emotion/styled': '@emotion/styled'
      }
    },
    // Performance optimizations - be conservative for mobile to avoid initialization issues
    esbuild: {
      // Drop console and debugger in production
      drop: isProduction && !isMobile ? ['console', 'debugger'] : [], // Keep console on mobile for debugging
      // Legal comments
      legalComments: 'none',
      // Minify - but preserve names to avoid initialization issues
      minifyIdentifiers: isProduction && !isMobile, // Don't mangle on mobile
      minifySyntax: isProduction,
      minifyWhitespace: isProduction,
      // Keep class names and function names to prevent circular dependency issues
      keepNames: isMobile
    },
    // CSS optimizations
    css: {
      devSourcemap: !isProduction,
      // Minify CSS in production
      postcss: undefined // Add postcss plugins if needed
    }
  };
});
