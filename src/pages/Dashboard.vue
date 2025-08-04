<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>대시보드</h1>
      <p>ComfyUI 워크플로우 관리 플랫폼에 오신 것을 환영합니다!</p>
    </div>

    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon workflows">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ workflowCount }}</div>
            <div class="stat-label">워크플로우</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon executions">
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ executionCount }}</div>
            <div class="stat-label">실행 기록</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon running">
            <el-icon><VideoPlay /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ runningCount }}</div>
            <div class="stat-label">실행 중</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon queue">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ pendingCount }}</div>
            <div class="stat-label">대기 중</div>
          </div>
        </div>
      </el-card>
    </div>

    <div class="content-grid">
      <el-card class="content-card">
        <template #header>
          <div class="card-header">
            <span>최근 워크플로우</span>
            <router-link to="/workflows">
              <el-button type="text">전체 보기</el-button>
            </router-link>
          </div>
        </template>
        <div v-if="loading.workflows" class="loading-container">
          <el-loading text="로딩 중..." />
        </div>
        <div v-else-if="recentWorkflows.length === 0" class="empty-state">
          <el-empty description="워크플로우가 없습니다" />
        </div>
        <div v-else class="workflow-list">
          <div 
            v-for="workflow in recentWorkflows" 
            :key="workflow.id"
            class="workflow-item"
          >
                         <div class="workflow-info">
               <div class="workflow-name">{{ workflow.name }}</div>
               <div class="workflow-description">{{ workflow.description || '설명 없음' }}</div>
             </div>
          </div>
        </div>
      </el-card>

      <el-card class="content-card">
        <template #header>
          <div class="card-header">
            <span>최근 실행 기록</span>
            <router-link to="/executions">
              <el-button type="text">전체 보기</el-button>
            </router-link>
          </div>
        </template>
        <div v-if="loading.executions" class="loading-container">
          <el-loading text="로딩 중..." />
        </div>
        <div v-else-if="recentExecutions.length === 0" class="empty-state">
          <el-empty description="실행 기록이 없습니다" />
        </div>
        <div v-else class="execution-list">
          <div 
            v-for="execution in recentExecutions" 
            :key="execution.id"
            class="execution-item"
          >
            <div class="execution-info">
              <div class="execution-workflow">{{ execution.workflow?.name || 'Unknown' }}</div>
              <div class="execution-time">{{ formatDate(execution.completed_at) }}</div>
            </div>
            <div class="execution-status">
              <el-tag 
                :type="getStatusType(execution.status)"
                size="small"
              >
                {{ getStatusText(execution.status) }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { Document, Monitor, Clock, VideoPlay } from '@element-plus/icons-vue'
import axios from 'axios'

export default {
  name: 'Dashboard',
  components: {
    Document,
    Monitor,
    Clock,
    VideoPlay
  },
  setup() {
    const store = useStore()
    
    const loading = reactive({
      workflows: false,
      executions: false
    })

    const stats = reactive({
      workflows: 0,
      executions: 0,
      running: 0,
      pending: 0
    })

    const workflowCount = computed(() => stats.workflows)
    const executionCount = computed(() => stats.executions)
    const runningCount = computed(() => stats.running)
    const pendingCount = computed(() => stats.pending)

    const recentWorkflows = computed(() => 
      store.getters['workflows/allWorkflows'].slice(0, 5)
    )
    
    const recentExecutions = computed(() => 
      store.getters['executions/myExecutions']
    )

    onMounted(async () => {
      await loadDashboardData()
    })

    const loadDashboardData = async () => {
      loading.workflows = true
      loading.executions = true

      try {
        // 워크플로우 데이터 로드
        const workflows = await store.dispatch('workflows/fetchWorkflows')
        stats.workflows = workflows.length

        // 본인 실행 기록 데이터 로드 (최근 5개만)
        const executions = await store.dispatch('executions/fetchMyExecutions', {
          page: 1,
          page_size: 5
        })
        
        // 전체 실행기록 개수 가져오기
        try {
          const countResponse = await axios.get('/api/executions/count')
          stats.executions = countResponse.data.count
        } catch (error) {
          console.warn('실행기록 개수를 가져올 수 없습니다:', error)
          stats.executions = executions.length
        }

        // 큐 상태 확인
        try {
          const queueStatus = await store.dispatch('executions/fetchQueueStatus')
          stats.running = queueStatus.running || 0
          stats.pending = queueStatus.pending || 0
        } catch (error) {
          console.warn('큐 상태를 가져올 수 없습니다:', error)
        }

      } catch (error) {
        console.error('대시보드 데이터 로드 오류:', error)
        ElMessage.error('데이터를 불러오는 중 오류가 발생했습니다.')
      } finally {
        loading.workflows = false
        loading.executions = false
      }
    }

    

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const getStatusType = (status) => {
      const statusMap = {
        'pending': '',
        'running': 'warning',
        'completed': 'success',
        'failed': 'danger'
      }
      return statusMap[status] || 'info'
    }

    const getStatusText = (status) => {
      const statusMap = {
        'pending': '대기 중',
        'running': '실행 중',
        'completed': '완료',
        'failed': '실패'
      }
      return statusMap[status] || status
    }

         return {
       loading,
       workflowCount,
       executionCount,
       runningCount,
       pendingCount,
       recentWorkflows,
       recentExecutions,
       formatDate,
       getStatusType,
       getStatusText
     }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.dashboard-header {
  margin-bottom: 24px;
}

.dashboard-header h1 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 28px;
  font-weight: bold;
}

.dashboard-header p {
  margin: 0;
  color: #909399;
  font-size: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.workflows { background: #409eff; }
.stat-icon.executions { background: #67c23a; }
.stat-icon.running { background: #e6a23c; }
.stat-icon.queue { background: #f56c6c; }

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

.content-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.loading-container {
  height: 200px;
  position: relative;
}

.empty-state {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.workflow-list, .execution-list {
  max-height: 300px;
  overflow-y: auto;
}

.workflow-item, .execution-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.workflow-item:last-child, .execution-item:last-child {
  border-bottom: none;
}

.workflow-info, .execution-info {
  flex: 1;
}

.workflow-name, .execution-workflow {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.workflow-description, .execution-time {
  font-size: 12px;
  color: #909399;
}

.execution-status {
  margin-left: 16px;
}
</style> 