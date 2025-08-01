import { createStore } from 'vuex'
import auth from './modules/auth'
import workflows from './modules/workflows'
import executions from './modules/executions'

export default createStore({
  state: {
    loading: false,
    loadingText: '로딩 중...',
    notification: {
      show: false,
      title: '',
      message: '',
      type: 'info'
    }
  },
  mutations: {
    SET_LOADING(state, { loading, text = '로딩 중...' }) {
      state.loading = loading
      state.loadingText = text
    },
    SET_NOTIFICATION(state, { title, message, type = 'info' }) {
      state.notification = {
        show: true,
        title,
        message,
        type
      }
      // 5초 후 자동으로 알림 제거
      setTimeout(() => {
        state.notification.show = false
      }, 5000)
    },
    CLEAR_NOTIFICATION(state) {
      state.notification.show = false
    }
  },
  actions: {
    showNotification({ commit }, payload) {
      commit('SET_NOTIFICATION', payload)
    },
    showLoading({ commit }, text) {
      commit('SET_LOADING', { loading: true, text })
    },
    hideLoading({ commit }) {
      commit('SET_LOADING', { loading: false })
    }
  },
  modules: {
    auth,
    workflows,
    executions
  }
}) 