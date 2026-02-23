import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function figmaAssetPlugin() {
  return {
    name: 'figma-asset-resolver',
    enforce: 'pre' as const,
    resolveId(source: string) {
      if (source.startsWith('figma:asset/')) {
        const filename = source.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
      return null
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetPlugin(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
