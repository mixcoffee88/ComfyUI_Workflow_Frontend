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

    <!-- 실행 상세 정보 모달 -->
    <el-dialog
      v-model="showExecutionDetails"
      title="실행 상세 정보"
      width="80%"
      :before-close="closeExecutionDetails"
    >
      <div v-if="selectedExecution">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="실행 ID">{{ selectedExecution.id }}</el-descriptions-item>
          <el-descriptions-item label="워크플로우">{{ selectedExecution.workflow?.name }}</el-descriptions-item>
          <el-descriptions-item label="사용자 ID">{{ selectedExecution.user_id }}</el-descriptions-item>
          <el-descriptions-item label="상태">
            <el-tag :type="getStatusType(selectedExecution.status)">
              {{ getStatusText(selectedExecution.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="시작 시간">{{ formatDateTime(selectedExecution.started_at) }}</el-descriptions-item>
          <el-descriptions-item label="완료 시간" v-if="selectedExecution.completed_at">
            {{ formatDateTime(selectedExecution.completed_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="ComfyUI Prompt ID" v-if="selectedExecution.comfyui_prompt_id">
            <span style="font-family: monospace; font-size: 12px;">{{ selectedExecution.comfyui_prompt_id }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="입력 데이터" v-if="selectedExecution.input_data">
            <el-button size="small" @click="viewInputData">입력 데이터 보기</el-button>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 결과 이미지 -->
        <div v-if="selectedExecution.assets && selectedExecution.assets.length > 0" class="results-section">
          <h3>생성된 이미지 ({{ selectedExecution.assets.length }}개)</h3>
          <div class="image-grid">
            <div
              v-for="asset in selectedExecution.assets"
              :key="asset.id"
              class="image-item"
            >
              <img 
                :src="asset.image_url" 
                :alt="`결과 이미지 ${asset.id}`" 
                @click="previewImage(asset.image_url)"
                class="clickable-image"
              />
              <div class="image-info">
                <div class="image-id">ID: {{ asset.id }}</div>
                <div class="image-date">{{ formatDateTime(asset.created_at) }}</div>
              </div>
              <div class="image-actions">
                <el-button size="small" @click="downloadImage(asset.image_url)">
                  <el-icon><Download /></el-icon>
                  다운로드
                </el-button>
                <el-button size="small" @click="previewImage(asset.image_url)">
                  <el-icon><View /></el-icon>
                  보기
                </el-button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-results">
          <el-empty description="생성된 이미지가 없습니다." />
        </div>
      </div>
    </el-dialog>

    <!-- 입력 데이터 모달 -->
    <el-dialog
      v-model="showInputData"
      title="입력 데이터"
      width="60%"
    >
      <pre v-if="inputDataJson">{{ inputDataJson }}</pre>
    </el-dialog>

    <!-- 이미지 프리뷰 모달 -->
    <el-dialog
      v-model="showImagePreview"
      title="이미지 프리뷰"
      width="80%"
      center
    >
      <div class="image-preview-container">
        <img :src="previewImageUrl" alt="이미지 프리뷰" class="preview-image" />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showImagePreview = false">닫기</el-button>
          <el-button type="primary" @click="downloadImage(previewImageUrl)">
            <el-icon><Download /></el-icon>
            다운로드
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import SystemStats from '@/components/admin/SystemStats.vue'
import UserManagement from '@/components/admin/UserManagement.vue'
import WorkflowManagement from '@/components/admin/WorkflowManagement.vue'
import ExecutionManagement from '@/components/admin/ExecutionManagement.vue'
import WorkflowDialog from '@/components/admin/WorkflowDialog.vue'
import { Download, View } from '@element-plus/icons-vue'
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
      editingWorkflow: null,
      showExecutionDetails: false,
      selectedExecution: null,
      showInputData: false,
      inputDataJson: '',
      showImagePreview: false,
      previewImageUrl: ''
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
    async viewExecutionDetails(execution) {
      try {
        // 실행 상세 정보를 다시 가져오기 (assets 포함)
        const response = await api.get(`/api/executions/${execution.id}`)
        this.selectedExecution = response.data
        this.showExecutionDetails = true
      } catch (error) {
        console.error('Error loading execution details:', error)
      }
    },
    getStatusType(status) {
      const statusMap = {
        'pending': 'warning',
        'running': 'primary',
        'completed': 'success',
        'failed': 'danger'
      }
      return statusMap[status] || 'info'
    },
    getStatusText(status) {
      const statusMap = {
        'pending': '대기 중',
        'running': '실행 중',
        'completed': '완료',
        'failed': '실패'
      }
      return statusMap[status] || status
    },
    formatDateTime(dateString) {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleString('ko-KR')
    },
    viewInputData() {
      if (this.selectedExecution?.input_data) {
        this.inputDataJson = JSON.stringify(this.selectedExecution.input_data, null, 2)
        this.showInputData = true
      }
    },
    downloadImage(imageUrl) {
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `execution-image-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    previewImage(imageUrl) {
      this.previewImageUrl = imageUrl
      this.showImagePreview = true
    },
    closeExecutionDetails() {
      this.showExecutionDetails = false
      this.selectedExecution = null
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

.results-section {
  margin-top: 20px;
}

.results-section h3 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.image-item {
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.image-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.image-info {
  padding: 8px 10px;
  background: #f8f9fa;
  border-top: 1px solid #e1e8ed;
}

.image-id {
  font-size: 12px;
  color: #666;
  font-weight: 600;
}

.image-date {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.image-actions {
  padding: 10px;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.clickable-image {
  cursor: pointer;
  transition: transform 0.2s;
}

.clickable-image:hover {
  transform: scale(1.05);
}

.no-results {
  margin-top: 20px;
  text-align: center;
}

.image-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.preview-image {
  max-width: 100%;
  max-height: 600px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

pre {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}
</style> 