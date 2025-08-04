import axios from 'axios'

const state = {
  executions: [],
  currentExecution: null,
  loading: false,
  queueStatus: null
}

const getters = {
  allExecutions: state => state.executions,
  myExecutions: state => state.executions, // 본인 실행 기록 (현재는 전체와 동일, 추후 필터링 가능)
  currentExecution: state => state.currentExecution,
  executionsLoading: state => state.loading,
  queueStatus: state => state.queueStatus
}

const mutations = {
  SET_EXECUTIONS(state, executions) {
    state.executions = executions
  },
  SET_CURRENT_EXECUTION(state, execution) {
    state.currentExecution = execution
  },
  ADD_EXECUTION(state, execution) {
    state.executions.unshift(execution) // 최신 실행을 맨 앞에 추가
  },
  UPDATE_EXECUTION(state, updatedExecution) {
    const index = state.executions.findIndex(e => e.id === updatedExecution.id)
    if (index !== -1) {
      state.executions.splice(index, 1, updatedExecution)
    }
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_QUEUE_STATUS(state, status) {
    state.queueStatus = status
  }
}

const actions = {
  async fetchExecutions({ commit }) {
    commit('SET_LOADING', true)
    try {
      const response = await axios.get('/api/executions/')
      commit('SET_EXECUTIONS', response.data)
      return response.data
    } catch (error) {
      console.error('실행 기록 가져오기 오류:', error)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async fetchMyExecutions({ commit }, params = {}) {
    commit('SET_LOADING', true)
    try {
      const response = await axios.get('/api/executions/my', { params })
      // 페이지네이션된 응답에서 data 필드 추출
      const executions = response.data.data || response.data
      commit('SET_EXECUTIONS', executions)
      return executions
    } catch (error) {
      console.error('본인 실행 기록 가져오기 오류:', error)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async fetchExecution({ commit }, executionId) {
    try {
      const response = await axios.get(`/api/executions/${executionId}`)
      commit('SET_CURRENT_EXECUTION', response.data)
      return response.data
    } catch (error) {
      console.error('실행 기록 가져오기 오류:', error)
      throw error
    }
  },

  async executeWorkflow({ commit }, { workflowId, parameters = {} }) {
    try {
      const response = await axios.post('/api/executions/execute', {
        workflow_id: workflowId,
        parameters
      })
      commit('ADD_EXECUTION', response.data)
      return response.data
    } catch (error) {
      console.error('워크플로우 실행 오류:', error)
      throw error
    }
  },

  async fetchQueueStatus({ commit }) {
    try {
      const response = await axios.get('/api/executions/queue/status')
      commit('SET_QUEUE_STATUS', response.data)
      return response.data
    } catch (error) {
      console.error('큐 상태 가져오기 오류:', error)
      throw error
    }
  },

  // 실시간 모니터링을 위한 폴링
  startQueueMonitoring({ dispatch }) {
    const pollInterval = setInterval(() => {
      dispatch('fetchQueueStatus')
    }, 2000) // 2초마다 상태 확인

    return pollInterval
  },

  stopQueueMonitoring(_, intervalId) {
    if (intervalId) {
      clearInterval(intervalId)
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} 