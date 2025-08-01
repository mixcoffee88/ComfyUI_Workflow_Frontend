<template>
  <div class="admin-page">
    <div class="admin-header">
      <h1>관리자 페이지</h1>
      <p>시스템 관리 및 사용자 관리를 수행하세요</p>
    </div>

    <el-tabs v-model="activeTab" class="admin-tabs">
      <!-- 시스템 통계 탭 -->
      <el-tab-pane label="시스템 통계" name="stats">
        <SystemStats :stats="stats" />
      </el-tab-pane>

      <!-- 사용자 관리 탭 -->
      <el-tab-pane label="사용자 관리" name="users">
        <UserManagement />
      </el-tab-pane>

      <!-- 워크플로우 관리 탭 -->
      <el-tab-pane label="워크플로우 관리" name="workflows">
        <WorkflowManagement 
          ref="workflowManagement"
          @view-workflow-details="viewWorkflowDetails"
          @edit-workflow="editWorkflow"
          @create-workflow="createWorkflow"
          @refresh-workflows="handleRefreshWorkflows"
        />
      </el-tab-pane>

      <!-- 실행 기록 관리 탭 -->
      <el-tab-pane label="실행 기록" name="executions">
        <ExecutionManagement 
          @view-execution-details="viewExecutionDetails"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 워크플로우 생성/편집 다이얼로그 - 항상 렌더링 -->
    <WorkflowDialog 
      :visible="showWorkflowDialog"
      :workflow="editingWorkflow"
      @saved="onWorkflowSaved"
      @update:visible="handleDialogVisibilityChange"
    />
  </div>
</template>

<script>
import SystemStats from '@/components/admin/SystemStats.vue'
import UserManagement from '@/components/admin/UserManagement.vue'
import WorkflowManagement from '@/components/admin/WorkflowManagement.vue'
import ExecutionManagement from '@/components/admin/ExecutionManagement.vue'
import WorkflowDialog from '@/components/admin/WorkflowDialog.vue'
import api from '@/utils/api'

export default {
  name: 'Admin',
  components: {
    SystemStats,
    UserManagement,
    WorkflowManagement,
    ExecutionManagement,
    WorkflowDialog
  },
  data() {
    return {
      activeTab: 'stats',
      stats: {
        total_users: 0,
        approved_users: 0,
        pending_users: 0,
        total_workflows: 0,
        total_executions: 0
      },
      showWorkflowDialog: false,
      editingWorkflow: null
    }
  },
  mounted() {
    this.loadStats()
  },
  methods: {
    async loadStats() {
      try {
        const response = await api.get('/api/admin/stats')
        this.stats = response.data
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    },
    viewWorkflowDetails(workflow) {
      console.log('Admin: View workflow details called:', workflow)
      // 워크플로우 상세 보기 로직
      console.log('View workflow details:', workflow)
    },
    createWorkflow() {
      console.log('Admin: Create workflow called')
      console.log('Before - showWorkflowDialog:', this.showWorkflowDialog)
      console.log('Before - editingWorkflow:', this.editingWorkflow)
      
      this.editingWorkflow = null
      this.showWorkflowDialog = true
      
      console.log('After - showWorkflowDialog:', this.showWorkflowDialog)
      console.log('After - editingWorkflow:', this.editingWorkflow)
      
      // 강제로 DOM 업데이트 확인
      this.$nextTick(() => {
        console.log('NextTick - showWorkflowDialog:', this.showWorkflowDialog)
        const dialog = document.querySelector('.el-dialog')
        console.log('Dialog element found:', !!dialog)
        if (dialog) {
          console.log('Dialog visible:', dialog.style.display !== 'none')
        }
      })
    },
    editWorkflow(workflow) {
      console.log('Admin: Edit workflow called:', workflow)
      this.editingWorkflow = workflow
      this.showWorkflowDialog = true
    },
    viewExecutionDetails(execution) {
      // 실행 상세 보기 로직
      console.log('View execution details:', execution)
    },
    onWorkflowSaved() {
      this.loadStats()
      // 워크플로우 관리 탭이 활성화된 경우 워크플로우 목록 새로고침
      if (this.activeTab === 'workflows') {
        this.handleRefreshWorkflows()
      }
    },
    handleRefreshWorkflows() {
      // WorkflowManagement 컴포넌트의 워크플로우 목록 새로고침
      this.$nextTick(() => {
        const workflowManagement = this.$refs.workflowManagement
        if (workflowManagement && workflowManagement.loadWorkflows) {
          workflowManagement.loadWorkflows()
        }
      })
    },
    handleDialogVisibilityChange(visible) {
      console.log('Admin: Dialog visibility changed to:', visible)
      this.showWorkflowDialog = visible
    }
  }
}
</script>

<style scoped>
.admin-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.admin-header {
  text-align: center;
  margin-bottom: 30px;
}

.admin-header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.admin-header p {
  color: #7f8c8d;
  font-size: 16px;
}

.admin-tabs {
  margin-top: 20px;
}

/* 관리자 페이지 전용 탭 스타일 오버라이드 */
:deep(.admin-tabs .el-tabs__content) {
  min-height: 500px;
}
</style> 