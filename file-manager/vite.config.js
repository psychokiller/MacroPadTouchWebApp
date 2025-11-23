// vite.config.js
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
  build: {
    target: 'esnext', 
    assetsDir: '',
    rollupOptions: {
      input: 'src/main.jsx',
      output: {
        manualChunks: undefined, 
        format: 'iife', 
        name: 'App',
        entryFileNames: 'file_manager_bundle.js', 
      },
    },
    outDir: '../../data/web/',
    cssCodeSplit: false,
    emptyOutDir: false
  },
})
