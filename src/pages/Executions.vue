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
            @input="debouncedFilter"
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
          <el-button 
            type="primary" 
            @click="loadExecutions(true)"
            :loading="refreshing"
          >
            <el-icon><Refresh /></el-icon>
            새로고침
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 실행 기록 테이블 -->
    <div class="table-section">
      <el-table
        :data="paginatedExecutions"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Download, View } from '@element-plus/icons-vue'
import api from '@/utils/api'

export default {
  name: 'Executions',
  components: {
    Search,
    Refresh
  },
  setup() {
    const executions = ref([])
    const loading = ref(false)
    const refreshing = ref(false)
    const searchQuery = ref('')
    const statusFilter = ref('')
    const currentPage = ref(1)
    const pageSize = ref(20)
    const totalExecutions = ref(0)
    
    let refreshInterval = null
    let debounceTimer = null
    
    const showExecutionDetails = ref(false)
    const selectedExecution = ref(null)
    const showInputData = ref(false)
    const inputDataJson = ref('')
    const showImagePreview = ref(false)
    const previewImageUrl = ref('')

    // 서버에서 페이지네이션된 데이터를 받으므로 직접 사용
    const paginatedExecutions = computed(() => {
      return executions.value
    })

    // 실행 기록 로드
    const loadExecutions = async (showLoading = true, resetPage = false) => {
      if (showLoading) {
        loading.value = true
      } else {
        refreshing.value = true
      }
      
      try {
        // 검색어와 상태 필터를 URL 파라미터로 전달
        const params = {
          page: resetPage ? 1 : currentPage.value,
          page_size: pageSize.value,
          ...(searchQuery.value && { search: searchQuery.value }),
          ...(statusFilter.value && { status: statusFilter.value })
        }
        
        const response = await api.get('/api/executions/my', { params })
        
        // 응답 구조 변경
        executions.value = response.data.data
        totalExecutions.value = response.data.pagination.total
        
        if (resetPage) {
          currentPage.value = 1
        }
        
        console.log('🔍 API 응답:', {
          page: response.data.pagination.page,
          pageSize: response.data.pagination.page_size,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.total_pages,
          dataCount: executions.value.length
        })
        
      } catch (error) {
        console.error('실행 기록 로드 실패:', error)
        ElMessage.error('실행 기록을 불러오는데 실패했습니다.')
      } finally {
        loading.value = false
        refreshing.value = false
      }
    }

    // 디바운스된 검색
    const debouncedFilter = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      debounceTimer = setTimeout(() => {
        loadExecutions(false, true) // 검색 시 첫 페이지로 이동
      }, 500)
    }

    // 필터링 (상태 변경 시)
    const filterExecutions = () => {
      loadExecutions(false, true) // 필터 변경 시 첫 페이지로 이동
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
        loadExecutions(false, false) // 현재 페이지 유지하며 새로고침
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

    // 이미지 프리뷰
    const previewImage = (imageUrl) => {
      previewImageUrl.value = imageUrl
      showImagePreview.value = true
    }

    // 자동 새로고침
    const startAutoRefresh = () => {
      refreshInterval = setInterval(() => {
        loadExecutions(false, false) // 현재 페이지 유지하며 새로고침
      }, 30000) // 30초마다 새로고침
    }

    const stopAutoRefresh = () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
        refreshInterval = null
      }
    }

    // 페이지네이션
    const handleSizeChange = (val) => {
      pageSize.value = val
      currentPage.value = 1
      loadExecutions(false, false) // 페이지 크기 변경 시 현재 페이지 유지
    }

    const handleCurrentChange = (val) => {
      currentPage.value = val
      loadExecutions(false, false) // 페이지 변경 시 서버에서 데이터 로드
    }

    const closeExecutionDetails = () => {
      showExecutionDetails.value = false
      selectedExecution.value = null
    }

    onMounted(() => {
      loadExecutions(true, false) // 초기 로드
      startAutoRefresh()
    })

    onUnmounted(() => {
      stopAutoRefresh()
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    })

    return {
      executions,
      paginatedExecutions,
      loading,
      refreshing,
      searchQuery,
      statusFilter,
      currentPage,
      pageSize,
      totalExecutions,
      showExecutionDetails,
      selectedExecution,
      showInputData,
      inputDataJson,
      showImagePreview,
      previewImageUrl,
      loadExecutions,
      filterExecutions,
      debouncedFilter,
      getStatusType,
      getStatusText,
      formatDateTime,
      viewExecutionDetails,
      viewInputData,
      deleteExecution,
      downloadImage,
      previewImage,
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

pre {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
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
</style> 