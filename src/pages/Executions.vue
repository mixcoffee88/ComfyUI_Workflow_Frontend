<template>
  <div class="executions-page">
    <div class="page-header">
      <h1>실행 기록</h1>
      <p>내가 실행한 워크플로우 기록을 확인할 수 있습니다.</p>
    </div>

    <!-- 필터 및 검색 -->
    <div class="filter-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchQuery"
            placeholder="워크플로우명으로 검색"
            clearable
            @input="filterExecutions"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="statusFilter"
            placeholder="상태별 필터"
            clearable
            @change="filterExecutions"
          >
            <el-option label="전체" value="" />
            <el-option label="대기 중" value="pending" />
            <el-option label="실행 중" value="running" />
            <el-option label="완료" value="completed" />
            <el-option label="실패" value="failed" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="loadExecutions">
            <el-icon><Refresh /></el-icon>
            새로고침
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 실행 기록 테이블 -->
    <div class="table-section">
      <el-table
        :data="filteredExecutions"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        
        <el-table-column label="워크플로우" min-width="200">
          <template #default="{ row }">
            <div class="workflow-info">
              <div class="workflow-name">{{ row.workflow?.name || '알 수 없음' }}</div>
              <div class="workflow-description">{{ row.workflow?.description || '' }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="상태" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="시작 시간" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.started_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="완료 시간" width="180">
          <template #default="{ row }">
            {{ row.completed_at ? formatDateTime(row.completed_at) : '-' }}
          </template>
        </el-table-column>
        
        <el-table-column label="결과" width="120">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'completed'"
              type="primary"
              size="small"
              @click="viewExecutionDetails(row)"
            >
              결과 보기
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column label="작업" width="120">
          <template #default="{ row }">
            <el-button
              type="danger"
              size="small"
              @click="deleteExecution(row)"
              :disabled="row.status === 'running'"
            >
              삭제
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 페이지네이션 -->
    <div class="pagination-section">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalExecutions"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 실행 상세 모달 -->
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
          <el-descriptions-item label="상태">
            <el-tag :type="getStatusType(selectedExecution.status)">
              {{ getStatusText(selectedExecution.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="시작 시간">{{ formatDateTime(selectedExecution.started_at) }}</el-descriptions-item>
          <el-descriptions-item label="완료 시간" v-if="selectedExecution.completed_at">
            {{ formatDateTime(selectedExecution.completed_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="입력 데이터" v-if="selectedExecution.input_data">
            <el-button size="small" @click="viewInputData">입력 데이터 보기</el-button>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 결과 이미지 -->
        <div v-if="selectedExecution.assets && selectedExecution.assets.length > 0" class="results-section">
          <h3>생성된 이미지</h3>
          <div class="image-grid">
            <div
              v-for="asset in selectedExecution.assets"
              :key="asset.id"
              class="image-item"
            >
              <img :src="asset.image_url" :alt="`결과 이미지 ${asset.id}`" />
              <div class="image-actions">
                <el-button size="small" @click="downloadImage(asset.image_url)">
                  다운로드
                </el-button>
              </div>
            </div>
          </div>
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
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import api from '@/utils/api'

export default {
  name: 'Executions',
  components: {
    Search,
    Refresh
  },
  setup() {
    const executions = ref([])
    const filteredExecutions = ref([])
    const loading = ref(false)
    const searchQuery = ref('')
    const statusFilter = ref('')
    const currentPage = ref(1)
    const pageSize = ref(20)
    const totalExecutions = ref(0)
    
    const showExecutionDetails = ref(false)
    const selectedExecution = ref(null)
    const showInputData = ref(false)
    const inputDataJson = ref('')

    // 실행 기록 로드
    const loadExecutions = async () => {
      loading.value = true
      try {
        const response = await api.get('/api/executions/my')
        executions.value = response.data
        filterExecutions()
        totalExecutions.value = executions.value.length
      } catch (error) {
        console.error('실행 기록 로드 실패:', error)
        ElMessage.error('실행 기록을 불러오는데 실패했습니다.')
      } finally {
        loading.value = false
      }
    }

    // 필터링
    const filterExecutions = () => {
      let filtered = executions.value

      // 검색어 필터
      if (searchQuery.value) {
        filtered = filtered.filter(execution => 
          execution.workflow?.name?.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      }

      // 상태 필터
      if (statusFilter.value) {
        filtered = filtered.filter(execution => 
          execution.status === statusFilter.value
        )
      }

      filteredExecutions.value = filtered
    }

    // 상태 타입 반환
    const getStatusType = (status) => {
      const statusMap = {
        'pending': 'warning',
        'running': 'primary',
        'completed': 'success',
        'failed': 'danger'
      }
      return statusMap[status] || 'info'
    }

    // 상태 텍스트 반환
    const getStatusText = (status) => {
      const statusMap = {
        'pending': '대기 중',
        'running': '실행 중',
        'completed': '완료',
        'failed': '실패'
      }
      return statusMap[status] || status
    }

    // 날짜 포맷
    const formatDateTime = (dateString) => {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleString('ko-KR')
    }

    // 실행 상세 보기
    const viewExecutionDetails = (execution) => {
      selectedExecution.value = execution
      showExecutionDetails.value = true
    }

    // 입력 데이터 보기
    const viewInputData = () => {
      if (selectedExecution.value?.input_data) {
        inputDataJson.value = JSON.stringify(selectedExecution.value.input_data, null, 2)
        showInputData.value = true
      }
    }

    // 실행 삭제
    const deleteExecution = async (execution) => {
      try {
        await ElMessageBox.confirm(
          '이 실행 기록을 삭제하시겠습니까?',
          '삭제 확인',
          {
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
            type: 'warning'
          }
        )

        await api.delete(`/api/executions/${execution.id}`)
        ElMessage.success('실행 기록이 삭제되었습니다.')
        loadExecutions()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('실행 기록 삭제 실패:', error)
          ElMessage.error('실행 기록 삭제에 실패했습니다.')
        }
      }
    }

    // 이미지 다운로드
    const downloadImage = (imageUrl) => {
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `execution-image-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    // 페이지네이션
    const handleSizeChange = (val) => {
      pageSize.value = val
      currentPage.value = 1
    }

    const handleCurrentChange = (val) => {
      currentPage.value = val
    }

    const closeExecutionDetails = () => {
      showExecutionDetails.value = false
      selectedExecution.value = null
    }

    onMounted(() => {
      loadExecutions()
    })

    return {
      executions,
      filteredExecutions,
      loading,
      searchQuery,
      statusFilter,
      currentPage,
      pageSize,
      totalExecutions,
      showExecutionDetails,
      selectedExecution,
      showInputData,
      inputDataJson,
      loadExecutions,
      filterExecutions,
      getStatusType,
      getStatusText,
      formatDateTime,
      viewExecutionDetails,
      viewInputData,
      deleteExecution,
      downloadImage,
      handleSizeChange,
      handleCurrentChange,
      closeExecutionDetails
    }
  }
}
</script>

<style scoped>
.executions-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.page-header p {
  margin: 0;
  color: #7f8c8d;
}

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.table-section {
  margin-bottom: 20px;
}

.workflow-info {
  display: flex;
  flex-direction: column;
}

.workflow-name {
  font-weight: 600;
  color: #2c3e50;
}

.workflow-description {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 4px;
}

.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 20px;
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

.image-actions {
  padding: 10px;
  display: flex;
  justify-content: center;
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