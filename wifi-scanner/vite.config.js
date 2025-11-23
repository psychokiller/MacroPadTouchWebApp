import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

const entryPath = process.env.VITE_ENTRY_FILE || 'src/main.jsx';
const outputName = process.env.VITE_OUTPUT_NAME || 'default_bundle';

export default defineConfig({
  plugins: [preact()],
  build: {
    target: 'esnext', 

    rollupOptions: {

      input: entryPath,
      output: {
        manualChunks: undefined, 
        format: 'iife', 
        name: 'AppBundles',
        entryFileNames: `${outputName}.js`
      },
    },
    outDir: '../../data/web/', 
    cssCodeSplit: false, 
    emptyOutDir: false,
  },
})