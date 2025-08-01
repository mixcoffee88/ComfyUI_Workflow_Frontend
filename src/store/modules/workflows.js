import axios from 'axios'

const state = {
  workflows: [],
  currentWorkflow: null,
  loading: false
}

const getters = {
  allWorkflows: state => state.workflows,
  currentWorkflow: state => state.currentWorkflow,
  workflowsLoading: state => state.loading
}

const mutations = {
  SET_WORKFLOWS(state, workflows) {
    state.workflows = workflows
  },
  SET_CURRENT_WORKFLOW(state, workflow) {
    state.currentWorkflow = workflow
  },
  ADD_WORKFLOW(state, workflow) {
    state.workflows.push(workflow)
  },
  UPDATE_WORKFLOW(state, updatedWorkflow) {
    const index = state.workflows.findIndex(w => w.id === updatedWorkflow.id)
    if (index !== -1) {
      state.workflows.splice(index, 1, updatedWorkflow)
    }
  },
  DELETE_WORKFLOW(state, workflowId) {
    state.workflows = state.workflows.filter(w => w.id !== workflowId)
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  }
}

const actions = {
  async fetchWorkflows({ commit }) {
    commit('SET_LOADING', true)
    try {
      const response = await axios.get('/api/workflows/')
      commit('SET_WORKFLOWS', response.data)
      return response.data
    } catch (error) {
      console.error('워크플로우 목록 가져오기 오류:', error)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async fetchWorkflow({ commit }, workflowId) {
    try {
      const response = await axios.get(`/api/workflows/${workflowId}`)
      commit('SET_CURRENT_WORKFLOW', response.data)
      return response.data
    } catch (error) {
      console.error('워크플로우 가져오기 오류:', error)
      throw error
    }
  },

  async createWorkflow({ commit }, workflowData) {
    try {
      const response = await axios.post('/api/workflows/', workflowData)
      commit('ADD_WORKFLOW', response.data)
      return response.data
    } catch (error) {
      console.error('워크플로우 생성 오류:', error)
      throw error
    }
  },

  async updateWorkflow({ commit }, { workflowId, workflowData }) {
    try {
      const response = await axios.put(`/api/workflows/${workflowId}`, workflowData)
      commit('UPDATE_WORKFLOW', response.data)
      return response.data
    } catch (error) {
      console.error('워크플로우 수정 오류:', error)
      throw error
    }
  },

  async deleteWorkflow({ commit }, workflowId) {
    try {
      await axios.delete(`/api/workflows/${workflowId}`)
      commit('DELETE_WORKFLOW', workflowId)
      return true
    } catch (error) {
      console.error('워크플로우 삭제 오류:', error)
      throw error
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