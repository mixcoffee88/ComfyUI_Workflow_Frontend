import axios from 'axios'
import { ElMessage } from 'element-plus'
console.log('import.meta.env.VITE_API_URL',import.meta.env.VITE_API_URL)
// axios 인스턴스 생성
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://49.247.43.3:9000',
  timeout: 30000, // 30초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    // 토큰이 있으면 헤더에 추가
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // 네트워크 오류 처리
    if (!error.response) {
      ElMessage.error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.')
      return Promise.reject(error)
    }

    // 401 Unauthorized - 토큰 만료
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        // 토큰 갱신 시도
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {
            refresh_token: refreshToken
          })
          
          const { access_token } = response.data
          localStorage.setItem('token', access_token)
          
          // 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // 토큰 갱신 실패 시 로그아웃
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // 500 서버 오류
    if (error.response.status === 500) {
      ElMessage.error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    }

    // 503 서비스 불가
    if (error.response.status === 503) {
      ElMessage.error('서비스가 일시적으로 사용할 수 없습니다.')
    }

    return Promise.reject(error)
  }
)

// 연결 상태 확인 함수
export const checkConnection = async () => {
  try {
    await api.get('/health')
    return true
  } catch (error) {
    return false
  }
}

// 재시도 로직이 포함된 API 호출 함수
export const apiCallWithRetry = async (apiCall, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall()
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error
      }
      
      // 네트워크 오류인 경우에만 재시도
      if (!error.response) {
        console.log(`재시도 중... (${i + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))) // 지수 백오프
        continue
      }
      
      throw error
    }
  }
}

// 주기적 연결 상태 확인
let connectionCheckInterval = null

export const startConnectionMonitoring = () => {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval)
  }
  
  connectionCheckInterval = setInterval(async () => {
    const isConnected = await checkConnection()
    if (!isConnected) {
      console.warn('서버 연결이 끊어졌습니다.')
      // 필요시 사용자에게 알림
    }
  }, 30000) // 30초마다 확인
}

export const stopConnectionMonitoring = () => {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval)
    connectionCheckInterval = null
  }
}

export default api 