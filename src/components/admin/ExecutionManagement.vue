<template>
  <div class="executions-section">
    <div class="section-header">
      <el-button @click="loadExecutions">
        <el-icon><Refresh /></el-icon>
        새로고침
      </el-button>
    </div>

    <el-table :data="executions" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="workflow_id" label="워크플로우 ID" width="120" />
      <el-table-column prop="status" label="상태">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="user_id" label="사용자 ID" width="100" />
      <el-table-column prop="comfyui_prompt_id" label="ComfyUI Prompt ID" width="200">
        <template #default="scope">
          <span v-if="scope.row.comfyui_prompt_id" style="font-family: monospace; font-size: 12px;">
            {{ scope.row.comfyui_prompt_id }}
          </span>
          <span v-else style="color: #999">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="started_at" label="시작 시간" width="150">
        <template #default="scope">
          {{ formatDate(scope.row.started_at) }}
        </template>
      </el-table-column>
      <el-table-column prop="completed_at" label="완료 시간" width="150">
        <template #default="scope">
          <span v-if="scope.row.completed_at">
            {{ formatDate(scope.row.completed_at) }}
          </span>
          <span v-else style="color: #999">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="error_message" label="에러 메시지" min-width="200" show-overflow-tooltip>
        <template #default="scope">
          <span v-if="scope.row.error_message" style="color: #f56c6c;">
            {{ scope.row.error_message }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="작업" width="150">
        <template #default="scope">
          <el-button size="small" @click="viewExecutionDetails(scope.row)">
            <el-icon><View /></el-icon>
            상세
          </el-button>
          <el-button 
            size="small" 
            type="danger" 
            @click="deleteExecution(scope.row.id)"
          >
            <el-icon><Delete /></el-icon>
            삭제
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 페이지네이션 -->
    <div class="pagination-wrapper" style="margin-top: 20px; text-align: center">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script>
import { Refresh, View, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

export default {
  name: 'ExecutionManagement',
  components: {
    Refresh,
    View,
    Delete
  },
  data() {
    return {
      executions: [],
      loading: false,
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      }
    }
  },
  mounted() {
    this.loadExecutions()
  },
  methods: {
    async loadExecutions() {
      this.loading = true
      try {
        const response = await axios.get('/api/admin/executions')
        this.executions = response.data
        this.pagination.total = this.executions.length
      } catch (error) {
        ElMessage.error('실행 기록을 불러오는데 실패했습니다.')
        console.error('Error loading executions:', error)
      } finally {
        this.loading = false
      }
    },
    getStatusType(status) {
      const statusTypes = {
        'pending': 'info',
        'running': 'warning',
        'completed': 'success',
        'failed': 'danger',
        'timeout': 'danger'
      }
      return statusTypes[status] || 'info'
    },
    getStatusText(status) {
      const statusTexts = {
        'pending': '대기 중',
        'running': '실행 중',
        'completed': '완료',
        'failed': '실패',
        'timeout': '타임아웃'
      }
      return statusTexts[status] || status
    },
    viewExecutionDetails(execution) {
      // 실행 상세 보기 로직
      this.$emit('view-execution-details', execution)
    },
    async deleteExecution(executionId) {
      try {
        await ElMessageBox.confirm(
          '정말로 이 실행 기록을 삭제하시겠습니까?',
          '실행 기록 삭제',
          {
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
            type: 'warning'
          }
        )
        
        await axios.delete(`/api/admin/executions/${executionId}`)
        ElMessage.success('실행 기록이 삭제되었습니다.')
        this.loadExecutions()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('실행 기록 삭제에 실패했습니다.')
          console.error('Error deleting execution:', error)
        }
      }
    },
    handlePageSizeChange(size) {
      this.pagination.pageSize = size
      this.pagination.currentPage = 1
    },
    handlePageChange(page) {
      this.pagination.currentPage = page
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('ko-KR')
    }
  }
}
</script>

<style scoped>
.executions-section {
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: center;
}
</style> 