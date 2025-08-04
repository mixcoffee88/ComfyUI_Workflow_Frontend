import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  // 환경 변수 로드
  const env = loadEnv(mode, process.cwd(), '')
  
  // 환경 변수에서 API URL 가져오기
  const apiUrl = env.VITE_API_URL || 'http://49.247.43.3:9000'
  const proxyTarget = env.VITE_PROXY_TARGET || apiUrl
  const proxyPath = env.VITE_PROXY_PATH || '/api'
  
  console.log(`🔧 Vite Config - Mode: ${mode}`)
  console.log(`🔧 Environment Variables:`, {
    VITE_API_URL: env.VITE_API_URL,
    VITE_PROXY_TARGET: env.VITE_PROXY_TARGET,
    VITE_PROXY_PATH: env.VITE_PROXY_PATH
  })
  console.log(`🔧 API URL: ${apiUrl}`)
  console.log(`🔧 Proxy Target: ${proxyTarget}`)
  console.log(`🔧 Proxy Path: ${proxyPath}`)
  
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      port: 9000,
      host: true,
      proxy: {
        [proxyPath]: {
          target: proxyTarget,
          changeOrigin: true,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('🔧 Proxy Error:', err)
            })
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log(`🔧 Proxy Request: ${req.method} ${req.url} -> ${proxyTarget}`)
            })
          }
        }
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`
        }
      }
    },
    // 환경 변수 설정
    envDir: '.',
    envPrefix: 'VITE_',
    // 개발 모드에서 .env.local 우선 로드
    define: {
      __DEV__: mode === 'development'
    },
    // 환경 변수 로딩 순서 설정
    env: {
      // 개발 모드에서 .env.local 우선 로드
      ...(mode === 'development' && {
        VITE_MODE: 'development'
      })
    }
  }
}) 