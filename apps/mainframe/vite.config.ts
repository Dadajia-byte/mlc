import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  
  return {
    plugins: [react()],
    css: {
      preprocessorOptions: {
        scss: {
          // 使用 @use 替代 @import
          additionalData: `@use "@/styles/variables.scss" as *;`,
          api: 'modern-compiler', // 使用新的 Sass API
          silenceDeprecations: ['legacy-js-api', 'import'], // 临时静默弃用警告（可选）
        }
      }
    },
    server: {
      port: 3000,
      host: true,
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // 开发环境使用源码，生产环境使用打包产物
        "@mlc/utils": isDev
          ? path.resolve(__dirname, '../../libs/utils/src')
          : '@mlc/utils',
        "@mlc/schema": isDev
          ? path.resolve(__dirname, '../../libs/schema/src')
          : '@mlc/schema',
        "@mlc/materials": isDev
          ? path.resolve(__dirname, '../../libs/materials/src')
          : '@mlc/materials'
      }
    }
  }
})