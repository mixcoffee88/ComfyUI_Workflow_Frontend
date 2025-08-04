import axios from 'axios'
import router from '../../router'

// 토큰이 있는 경우 axios 헤더 설정
const token = localStorage.getItem('token')
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

const state = {
  user: null,
  token: token || null,
  isAuthenticated: false
}

const getters = {
  isAuthenticated: state => !!state.token && !!state.user,
  currentUser: state => state.user,
  userRole: state => state.user?.role || null
}

const mutations = {
  SET_AUTH(state, { user, token }) {
    state.user = user
    state.token = token
    state.isAuthenticated = true
    localStorage.setItem('token', token)
    
    // axios 기본 헤더 설정
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  },
  SET_USER(state, user) {
    state.user = user
    state.isAuthenticated = !!state.token
  },
  CLEAR_AUTH(state) {
    state.user = null
    state.token = null
    state.isAuthenticated = false
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
  }
}

const actions = {
  // 앱 초기화 시 토큰 복원
  async initializeAuth({ commit, state, dispatch }) {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        // axios 헤더 설정
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        // 사용자 정보 가져오기
        const response = await axios.get('/api/auth/me')
        commit('SET_AUTH', { user: response.data, token })
        return true
      } catch (error) {
        console.error('토큰 검증 실패:', error)
        // 유효하지 않은 토큰인 경우 정리
        commit('CLEAR_AUTH')
        return false
      }
    }
    return false
  },

  async login({ commit, dispatch }, { email, password }) {
    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)

      const response = await axios.post('/api/auth/login', formData)
      const { access_token, user } = response.data

      commit('SET_AUTH', { user, token: access_token })
      
      // 대시보드로 이동
      router.push('/dashboard')
      
      return { success: true }
    } catch (error) {
      console.error('로그인 오류:', error)
      return { 
        success: false, 
        message: error.response?.data?.detail || '로그인에 실패했습니다.' 
      }
    }
  },

  async register({ commit }, { username, email, password }) {
    try {
      const response = await axios.post('/api/auth/register', {
        username,
        email,
        password
      })

      // 등록 후 자동 로그인은 하지 않음 (관리자 승인 필요)
      return { 
        success: true, 
        message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.' 
      }
    } catch (error) {
      console.error('회원가입 오류:', error)
      return { 
        success: false, 
        message: error.response?.data?.detail || '회원가입에 실패했습니다.' 
      }
    }
  },

  async fetchCurrentUser({ commit, state }) {
    if (!state.token) return

    try {
      const response = await axios.get('/api/auth/me')
      commit('SET_USER', response.data)
      return response.data
    } catch (error) {
      console.error('사용자 정보 가져오기 오류:', error)
      // 토큰이 유효하지 않은 경우
      commit('CLEAR_AUTH')
      throw error
    }
  },

  logout({ commit }) {
    commit('CLEAR_AUTH')
    router.push('/login')
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} 