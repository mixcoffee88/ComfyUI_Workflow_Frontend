<template>
  <div class="workflows-section">
    <div class="section-header">
      <div class="search-controls">
        <el-input
          v-model="workflowSearch"
          placeholder="워크플로우 검색..."
          style="width: 300px"
          @input="filterWorkflows"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select v-model="workflowStatusFilter" placeholder="상태 필터" style="width: 150px; margin-left: 10px">
          <el-option label="전체" value="" />
          <el-option label="활성화" value="active" />
          <el-option label="비활성화" value="inactive" />
        </el-select>
      </div>
      
      <div class="action-controls">
        <!-- 선택된 워크플로우 일괄 작업 버튼들 -->
        <div class="bulk-action-buttons" v-if="selectedWorkflows.length > 0">
          <el-badge :value="selectedWorkflows.length" :max="99" type="danger">
            <el-button size="small" type="danger" @click="bulkDeleteWorkflows">
              <el-icon><Delete /></el-icon>
              선택 삭제
            </el-button>
          </el-badge>
        </div>
        
        <!-- 기본 작업 버튼들 -->
        <div class="default-action-buttons" v-if="selectedWorkflows.length === 0">
          <el-button type="primary" @click="createNewWorkflow">
            <el-icon><Plus /></el-icon>
            새 워크플로우
          </el-button>
          
          <el-button @click="loadWorkflows">
            <el-icon><Refresh /></el-icon>
            새로고침
          </el-button>
        </div>
      </div>
    </div>

    <el-table 
      :data="filteredWorkflows" 
      style="width: 100%" 
      v-loading="loading"
      @selection-change="handleWorkflowSelection"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" sortable />
      
      <el-table-column prop="name" label="워크플로우명" min-width="200">
        <template #default="scope">
          <div class="workflow-name-cell">
            <span class="workflow-name">{{ scope.row.name }}</span>
            <el-tag v-if="scope.row.is_public" size="small" type="success">공개</el-tag>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column prop="description" label="설명" min-width="250" show-overflow-tooltip />
      
      <el-table-column prop="status" label="상태" width="120">
        <template #default="scope">
          <el-select 
            v-model="scope.row.status" 
            size="small" 
            style="width: 100px"
            @change="updateWorkflowStatus(scope.row.id, scope.row.status)"
          >
            <el-option label="대기" value="WAIT" />
            <el-option label="오픈" value="OPEN" />
          </el-select>
        </template>
      </el-table-column>
      
      <el-table-column prop="owner" label="소유자" width="120">
        <template #default="scope">
          <div class="owner-cell">
            <el-avatar :size="24" style="margin-right: 8px">
              {{ scope.row.owner ? scope.row.owner.charAt(0).toUpperCase() : 'U' }}
            </el-avatar>
            <span>{{ scope.row.owner || '알 수 없음' }}</span>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column prop="executions_count" label="실행 횟수" width="100" sortable align="center" class-name="executions-count-column">
        <template #default="scope">
          <div class="badge-container">
            <el-badge :value="scope.row.executions_count || 0" :max="999" type="primary">
              <el-icon><Monitor /></el-icon>
            </el-badge>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column prop="last_executed" label="마지막 실행" width="150">
        <template #default="scope">
          <span v-if="scope.row.last_executed">
            {{ formatDate(scope.row.last_executed) }}
          </span>
          <span v-else style="color: #999">실행 안 됨</span>
        </template>
      </el-table-column>
      
      <el-table-column prop="created_at" label="생성일" width="150" sortable>
        <template #default="scope">
          {{ formatDate(scope.row.created_at) }}
        </template>
      </el-table-column>
      
      <el-table-column label="작업" width="170" fixed="right">
        <template #default="scope">
          <div class="workflow-actions">
            <el-button 
              size="small" 
              type="warning" 
              @click="editWorkflowHandler(scope.row)"
            >
              <el-icon><Edit /></el-icon>
              수정
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteWorkflow(scope.row.id)"
            >
              <el-icon><Delete /></el-icon>
              삭제
            </el-button>
          </div>
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

    <!-- 워크플로우 생성/편집 다이얼로그는 별도 컴포넌트로 분리 예정 -->
  </div>
</template>

<script>
import { Search, Plus, Refresh, Delete, Monitor, View, Edit } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

export default {
  name: 'WorkflowManagement',
  components: {
    Search,
    Plus,
    Refresh,
    Delete,
    Monitor,
    View,
    Edit
  },
  data() {
    return {
      workflows: [],
      filteredWorkflows: [],
      selectedWorkflows: [],
      loading: false,
      workflowSearch: '',
      workflowStatusFilter: '',
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      }
    }
  },
  mounted() {
    this.loadWorkflows()
  },
  methods: {
    async loadWorkflows() {
      this.loading = true
      try {
        const response = await axios.get('/api/admin/workflows')
        this.workflows = response.data
        this.filterWorkflows()
      } catch (error) {
        ElMessage.error('워크플로우 목록을 불러오는데 실패했습니다.')
        console.error('Error loading workflows:', error)
      } finally {
        this.loading = false
      }
    },
    filterWorkflows() {
      let filtered = [...this.workflows]
      
      // 검색 필터
      if (this.workflowSearch) {
        filtered = filtered.filter(workflow => 
          workflow.name.toLowerCase().includes(this.workflowSearch.toLowerCase()) ||
          workflow.description.toLowerCase().includes(this.workflowSearch.toLowerCase())
        )
      }
      
      // 상태 필터
      if (this.workflowStatusFilter) {
        filtered = filtered.filter(workflow => 
          workflow.status === this.workflowStatusFilter
        )
      }
      
      this.filteredWorkflows = filtered
      this.pagination.total = filtered.length
    },
    handleWorkflowSelection(selection) {
      this.selectedWorkflows = selection
    },
    async bulkDeleteWorkflows() {
      if (this.selectedWorkflows.length === 0) return
      
      try {
        await ElMessageBox.confirm(
          `선택된 ${this.selectedWorkflows.length}개의 워크플로우를 삭제하시겠습니까?`,
          '워크플로우 일괄 삭제',
          {
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
            type: 'warning'
          }
        )
        
        const deletePromises = this.selectedWorkflows.map(workflow => 
          axios.delete(`/api/admin/workflows/${workflow.id}`)
        )
        
        await Promise.all(deletePromises)
        ElMessage.success('선택된 워크플로우가 삭제되었습니다.')
        this.loadWorkflows()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('워크플로우 삭제에 실패했습니다.')
          console.error('Error deleting workflows:', error)
        }
      }
    },
    async deleteWorkflow(workflowId) {
      try {
        await ElMessageBox.confirm(
          '정말로 이 워크플로우를 삭제하시겠습니까?',
          '워크플로우 삭제',
          {
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
            type: 'warning'
          }
        )
        
        await axios.delete(`/api/admin/workflows/${workflowId}`)
        ElMessage.success('워크플로우가 삭제되었습니다.')
        this.loadWorkflows()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('워크플로우 삭제에 실패했습니다.')
          console.error('Error deleting workflow:', error)
        }
      }
    },
    viewWorkflowDetails(workflow) {
      console.log('View workflow details clicked:', workflow)
      // 워크플로우 상세 보기 로직
      this.$emit('view-workflow-details', workflow)
    },
    createNewWorkflow() {
      console.log('Create new workflow clicked')
      // 새 워크플로우 생성 로직
      this.$emit('create-workflow')
    },
    editWorkflowHandler(workflow) {
      console.log('Edit workflow clicked:', workflow)
      // 워크플로우 편집 로직
      this.$emit('edit-workflow', workflow)
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
    },
    async updateWorkflowStatus(workflowId, newStatus) {
      try {
        await axios.put(`/api/admin/workflows/${workflowId}/status`, { status: newStatus })
        ElMessage.success(`워크플로우 상태가 "${newStatus}"로 변경되었습니다.`);
        this.loadWorkflows(); // 상태 변경 후 목록 다시 로드
      } catch (error) {
        ElMessage.error(`워크플로우 상태 변경에 실패했습니다: ${error.message}`);
        console.error('Error updating workflow status:', error);
      }
    }
  }
}
</script>

<style scoped>
.workflows-section {
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-controls {
  display: flex;
  align-items: center;
}

.action-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bulk-action-buttons {
  display: flex;
  align-items: center;
}

.default-action-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.default-action-buttons .el-button {
  cursor: pointer;
  transition: all 0.3s ease;
}

.default-action-buttons .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.workflow-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.workflow-name {
  font-weight: 500;
}

.owner-cell {
  display: flex;
  align-items: center;
}

.badge-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 4px 0;
}

.workflow-actions {
  display: flex;
  gap: 5px;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 4px 0;
}

.workflow-actions .el-button {
  cursor: pointer;
  transition: all 0.3s ease;
}

.workflow-actions .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 실행 횟수 컬럼 스타일 */
:deep(.executions-count-column) {
  padding: 8px 0;
}

:deep(.executions-count-column .cell) {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 40px;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: center;
}
</style> 