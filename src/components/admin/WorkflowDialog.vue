<template>
  <!-- 디버깅용 요소 -->
  <div v-if="dialogVisible" style="position: fixed; top: 0; left: 0; background: red; color: white; z-index: 9999; padding: 5px;">
    WorkflowDialog is visible: {{ dialogVisible }}
  </div>
  
  <!-- v-model을 사용하여 직접 제어 -->
  <el-dialog 
    v-model="dialogVisible" 
    :title="isEdit ? '워크플로우 수정' : '새 워크플로우 생성'"
    width="90%"
    :before-close="handleClose"
    :destroy-on-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="workflow-dialog"
  >
    <el-form :model="workflowForm" :rules="workflowRules" ref="workflowFormRef" label-width="120px">
      <el-form-item label="워크플로우명" prop="name">
        <el-input v-model="workflowForm.name" placeholder="워크플로우 이름을 입력하세요" />
      </el-form-item>
      
      <el-form-item label="설명" prop="description">
        <el-input 
          v-model="workflowForm.description" 
          type="textarea" 
          :rows="3"
          placeholder="워크플로우에 대한 설명을 입력하세요"
        />
      </el-form-item>
      
      <el-form-item label="워크플로우 JSON" prop="workflow_data">
        <div class="json-editor-section">
          <div class="json-controls">
            <el-button size="small" @click="formatJson">
              <el-icon><Document /></el-icon>
              포맷
            </el-button>
            <el-button size="small" @click="validateJson">
              <el-icon><Check /></el-icon>
              검증
            </el-button>
            <el-button size="small" @click="copyToClipboard">
              <el-icon><CopyDocument /></el-icon>
              복사
            </el-button>
            <el-upload
              ref="jsonUpload"
              :show-file-list="false"
              :auto-upload="false"
              accept=".json"
              @change="handleJsonFileChange"
            >
              <el-button size="small">
                <el-icon><Upload /></el-icon>
                파일 업로드
              </el-button>
            </el-upload>
          </div>
          
          <el-input
            v-model="workflowForm.workflow_data"
            type="textarea"
            :rows="15"
            placeholder="워크플로우 JSON을 입력하거나 파일을 업로드하세요"
            :class="{ 'json-error': jsonValidationStatus === 'error' }"
          />
          
          <div v-if="jsonValidationStatus" class="json-validation-message">
            <el-alert
              :title="jsonValidationMessage"
              :type="jsonValidationStatus"
              :closable="false"
              show-icon
            />
          </div>
        </div>
      </el-form-item>
      
      <el-form-item label="입력 필드 설정">
        <div class="input-fields-section">
          <div class="input-fields-header">
            <h4>동적 입력 필드 설정</h4>
            <el-button type="primary" size="small" @click="addInputField">
              <el-icon><Plus /></el-icon>
              입력 필드 추가
            </el-button>
          </div>
          
          <div v-if="manualInputFields.length === 0" class="no-fields-message">
            <el-empty description="입력 필드가 없습니다. 추가 버튼을 클릭하여 필드를 생성하세요." />
          </div>
          
          <div v-else class="input-fields-list">
            <div 
              v-for="(field, index) in manualInputFields" 
              :key="field.id" 
              class="input-field-item"
            >
              <div class="field-header">
                <h5>입력 필드 #{{ index + 1 }}</h5>
                <el-button size="small" type="danger" @click="removeInputField(index)">
                  <el-icon><Delete /></el-icon>
                  삭제
                </el-button>
              </div>
              
              <div class="field-id-section">
                <el-input
                  :value="field.id"
                  readonly
                  size="small"
                  style="width: 200px; margin-right: 10px;"
                >
                  <template #prepend>Field ID:</template>
                </el-input>
                <el-button size="small" @click="copyFieldId(field.id)">
                  <el-icon><CopyDocument /></el-icon>
                  복사
                </el-button>
              </div>
              
                             <div class="field-controls">
                 <div class="field-basic-info">
                   <el-form-item label="필드명" :prop="`inputFieldsConfig.${field.id}.label`">
                     <el-input 
                       v-model="inputFieldsConfig[field.id].label" 
                       placeholder="필드명을 입력하세요"
                     />
                   </el-form-item>
                   
                   <el-form-item label="입력 타입" :prop="`inputFieldsConfig.${field.id}.type`">
                     <el-select 
                       v-model="inputFieldsConfig[field.id].type" 
                       placeholder="입력 타입 선택"
                       @change="onFieldTypeChange(field.id)"
                     >
                       <el-option label="텍스트" value="text" />
                       <el-option label="텍스트 영역" value="textarea" />
                       <el-option label="숫자" value="number" />
                       <el-option label="실수" value="float" />
                       <el-option label="선택" value="select" />
                     </el-select>
                   </el-form-item>
                   
                   <el-form-item label="필수 입력">
                     <el-switch v-model="inputFieldsConfig[field.id].required" />
                   </el-form-item>
                 </div>
                 
                 <div class="field-details">
                   <el-form-item label="기본값" :prop="`inputFieldsConfig.${field.id}.defaultValue`">
                     <el-input 
                       v-model="inputFieldsConfig[field.id].defaultValue" 
                       :type="inputFieldsConfig[field.id].type === 'textarea' ? 'textarea' : 'text'"
                       :rows="inputFieldsConfig[field.id].type === 'textarea' ? 3 : undefined"
                       placeholder="기본값을 입력하세요"
                     />
                   </el-form-item>
                   
                   <el-form-item label="설명" :prop="`inputFieldsConfig.${field.id}.description`">
                     <el-input 
                       v-model="inputFieldsConfig[field.id].description" 
                       :type="inputFieldsConfig[field.id].type === 'textarea' ? 'textarea' : 'text'"
                       :rows="inputFieldsConfig[field.id].type === 'textarea' ? 2 : undefined"
                       placeholder="필드 설명을 입력하세요"
                     />
                   </el-form-item>
                 </div>
               </div>
              
              <!-- 숫자 타입 추가 설정 -->
              <div v-if="inputFieldsConfig[field.id].type === 'number' || inputFieldsConfig[field.id].type === 'float'" class="number-settings">
                <el-form-item label="최소값">
                  <el-input-number 
                    v-model="inputFieldsConfig[field.id].min" 
                    :precision="inputFieldsConfig[field.id].type === 'float' ? 2 : 0"
                    style="width: 120px;"
                  />
                </el-form-item>
                <el-form-item label="최대값">
                  <el-input-number 
                    v-model="inputFieldsConfig[field.id].max" 
                    :precision="inputFieldsConfig[field.id].type === 'float' ? 2 : 0"
                    style="width: 120px;"
                  />
                </el-form-item>
                <el-form-item label="단계">
                  <el-input-number 
                    v-model="inputFieldsConfig[field.id].step" 
                    :precision="inputFieldsConfig[field.id].type === 'float' ? 2 : 0"
                    style="width: 120px;"
                  />
                </el-form-item>
              </div>
              
              <!-- 선택 타입 추가 설정 -->
              <div v-if="inputFieldsConfig[field.id].type === 'select'" class="select-settings">
                <el-form-item label="선택 옵션">
                  <div class="select-options">
                    <div 
                      v-for="(option, optionIndex) in inputFieldsConfig[field.id].options" 
                      :key="optionIndex"
                      class="option-item"
                    >
                      <el-input 
                        v-model="inputFieldsConfig[field.id].options[optionIndex]" 
                        placeholder="옵션 값"
                        style="width: 200px; margin-right: 10px;"
                      />
                      <el-button size="small" type="danger" @click="removeSelectOption(field.id, optionIndex)">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                    <el-button size="small" @click="addSelectOption(field.id)">
                      <el-icon><Plus /></el-icon>
                      옵션 추가
                    </el-button>
                  </div>
                </el-form-item>
              </div>
            </div>
          </div>
        </div>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">취소</el-button>
        <el-button type="primary" @click="saveWorkflow" :loading="saving">
          {{ isEdit ? '수정' : '생성' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { 
  Document, Check, CopyDocument, Upload, Plus, Delete 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'

export default {
  name: 'WorkflowDialog',
  components: {
    Document,
    Check,
    CopyDocument,
    Upload,
    Plus,
    Delete
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    workflow: {
      type: Object,
      default: null
    }
  },
  emits: ['update:visible', 'saved'],
  data() {
    return {
      saving: false,
      workflowForm: {
        name: '',
        description: '',
        workflow_data: ''
      },
      workflowRules: {
        name: [
          { required: true, message: '워크플로우명을 입력하세요', trigger: 'blur' }
        ],
        description: [
          { required: true, message: '설명을 입력하세요', trigger: 'blur' }
        ],
        workflow_data: [
          { required: true, message: '워크플로우 JSON을 입력하세요', trigger: 'blur' }
        ]
      },
      manualInputFields: [],
      inputFieldsConfig: {},
      jsonValidationStatus: '',
      jsonValidationMessage: ''
    }
  },
  computed: {
    isEdit() {
      return !!this.workflow
    },
    dialogVisible: {
      get() {
        return this.visible
      },
      set(value) {
        this.$emit('update:visible', value)
      }
    }
  },
  mounted() {
    console.log('WorkflowDialog: Component mounted, visible prop:', this.visible)
    console.log('WorkflowDialog: DOM element created:', !!this.$el)
    console.log('WorkflowDialog: Dialog element in DOM:', !!document.querySelector('.el-dialog'))
  },
  watch: {
    visible(newVal) {
      console.log('WorkflowDialog: visible prop changed to:', newVal)
      if (newVal) {
        console.log('WorkflowDialog: Initializing form')
        this.initializeForm()
        
        // DOM 업데이트 후 다이얼로그 요소 확인
        this.$nextTick(() => {
          const dialog = document.querySelector('.el-dialog')
          console.log('WorkflowDialog: Dialog element after visible change:', !!dialog)
          if (dialog) {
            console.log('WorkflowDialog: Dialog display style:', dialog.style.display)
            console.log('WorkflowDialog: Dialog visibility:', dialog.style.visibility)
          }
        })
      }
    }
  },
  methods: {
    initializeForm() {
      if (this.isEdit && this.workflow) {
        this.workflowForm = {
          name: this.workflow.name,
          description: this.workflow.description,
          workflow_data: JSON.stringify(this.workflow.workflow_data, null, 2)
        }
        this.manualInputFields = this.workflow.input_fields ? Object.keys(this.workflow.input_fields).map(key => ({
          id: key,
          ...this.workflow.input_fields[key]
        })) : []
        this.inputFieldsConfig = this.workflow.input_fields || {}
      } else {
        this.resetForm()
      }
    },
    resetForm() {
      this.workflowForm = {
        name: '',
        description: '',
        workflow_data: ''
      }
      this.manualInputFields = []
      this.inputFieldsConfig = {}
      this.jsonValidationStatus = ''
      this.jsonValidationMessage = ''
    },
    generateUUID() {
      return 'input-field-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    },
    addInputField() {
      const fieldId = this.generateUUID()
      this.manualInputFields.push({ id: fieldId })
      this.inputFieldsConfig[fieldId] = {
        label: '',
        type: 'text',
        defaultValue: '',
        description: '',
        required: false,
        options: [],
        min: null,
        max: null,
        step: 1
      }
    },
    removeInputField(index) {
      const fieldId = this.manualInputFields[index].id
      this.manualInputFields.splice(index, 1)
      delete this.inputFieldsConfig[fieldId]
    },
    copyFieldId(fieldId) {
      navigator.clipboard.writeText(fieldId)
      ElMessage.success('Field ID가 클립보드에 복사되었습니다.')
    },
    onFieldTypeChange(fieldId) {
      const config = this.inputFieldsConfig[fieldId]
      if (config.type === 'select' && !config.options) {
        config.options = []
      }
    },
    addSelectOption(fieldId) {
      if (!this.inputFieldsConfig[fieldId].options) {
        this.inputFieldsConfig[fieldId].options = []
      }
      this.inputFieldsConfig[fieldId].options.push('')
    },
    removeSelectOption(fieldId, optionIndex) {
      this.inputFieldsConfig[fieldId].options.splice(optionIndex, 1)
    },
    formatJson() {
      try {
        const parsed = JSON.parse(this.workflowForm.workflow_data)
        this.workflowForm.workflow_data = JSON.stringify(parsed, null, 2)
        this.jsonValidationStatus = 'success'
        this.jsonValidationMessage = 'JSON 형식이 올바릅니다.'
      } catch (error) {
        this.jsonValidationStatus = 'error'
        this.jsonValidationMessage = '잘못된 JSON 형식입니다.'
      }
    },
    validateJson() {
      try {
        JSON.parse(this.workflowForm.workflow_data)
        this.jsonValidationStatus = 'success'
        this.jsonValidationMessage = 'JSON 형식이 올바릅니다.'
      } catch (error) {
        this.jsonValidationStatus = 'error'
        this.jsonValidationMessage = '잘못된 JSON 형식입니다: ' + error.message
      }
    },
    copyToClipboard() {
      navigator.clipboard.writeText(this.workflowForm.workflow_data)
      ElMessage.success('JSON이 클립보드에 복사되었습니다.')
    },
    handleJsonFileChange(file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target.result
          const parsed = JSON.parse(content)
          this.workflowForm.workflow_data = JSON.stringify(parsed, null, 2)
          this.jsonValidationStatus = 'success'
          this.jsonValidationMessage = 'JSON 파일이 성공적으로 로드되었습니다.'
        } catch (error) {
          this.jsonValidationStatus = 'error'
          this.jsonValidationMessage = '잘못된 JSON 파일입니다.'
        }
      }
      reader.readAsText(file.raw)
    },
    async saveWorkflow() {
      try {
        const valid = await this.$refs.workflowFormRef.validate()
        if (!valid) return

        this.validateJson()
        if (this.jsonValidationStatus === 'error') {
          ElMessage.error('JSON 형식을 확인해주세요.')
          return
        }

        this.saving = true
        const workflowData = {
          name: this.workflowForm.name,
          description: this.workflowForm.description,
          workflow_data: JSON.parse(this.workflowForm.workflow_data),
          input_fields: this.inputFieldsConfig
        }

        if (this.isEdit) {
          await api.put(`/api/admin/workflows/${this.workflow.id}`, workflowData)
          ElMessage.success('워크플로우가 수정되었습니다.')
        } else {
          await api.post('/api/admin/workflows', workflowData)
          ElMessage.success('워크플로우가 생성되었습니다.')
        }

        this.$emit('saved')
        this.handleClose()
      } catch (error) {
        ElMessage.error('워크플로우 저장에 실패했습니다.')
        console.error('Error saving workflow:', error)
      } finally {
        this.saving = false
      }
    },
    handleClose() {
      console.log('WorkflowDialog: handleClose called')
      this.dialogVisible = false
      this.resetForm()
    }
  }
}
</script>

<style scoped>




.json-error {
  border-color: #f56c6c !important;
}

.json-validation-message {
  margin-top: 10px;
}







.no-fields-message {
  text-align: center;
  padding: 40px 0;
}



.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.field-header h5 {
  margin: 0;
  color: #606266;
}











 .dialog-footer {
   display: flex;
   justify-content: flex-end;
   gap: 10px;
 }
 
   /* 워크플로우 다이얼로그 스타일 */
  :deep(.workflow-dialog) {
    max-height: 90vh;
  }
  
  :deep(.workflow-dialog .el-dialog) {
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }
  
  :deep(.workflow-dialog .el-dialog__body) {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    max-height: calc(90vh - 120px); /* 헤더와 푸터 높이를 제외 */
  }
  
  :deep(.workflow-dialog .el-dialog__header) {
    padding: 20px 20px 0 20px;
    flex-shrink: 0;
  }
  
  :deep(.workflow-dialog .el-dialog__footer) {
    padding: 0 20px 20px 20px;
    flex-shrink: 0;
  }
  
  /* 오버레이 다이얼로그의 스크롤 제거 */
  :deep(.workflow-dialog .el-overlay-dialog) {
    overflow: hidden;
  }
 
   /* 동적 입력 필드 레이아웃 개선 */
  .field-controls {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 15px;
    width: 100%;
  }
  
  .field-basic-info {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 15px;
    align-items: end;
  }
  
  .field-details {
    display: grid;
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .field-controls .el-form-item {
    margin-bottom: 0;
  }
  
  .field-controls .el-input,
  .field-controls .el-select,
  .field-controls .el-input-number {
    width: 100%;
  }
 
 /* 텍스트 영역 타입일 때 높이 조정 */
 .field-controls .el-textarea {
   width: 100%;
 }
 
 .field-controls .el-textarea .el-textarea__inner {
   min-height: 80px;
 }
 
 /* 숫자 설정과 선택 설정 레이아웃 개선 */
 .number-settings,
 .select-settings {
   display: grid;
   grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
   gap: 15px;
   margin-top: 15px;
   padding-top: 15px;
   border-top: 1px solid #e4e7ed;
   width: 100%;
 }
 
 .number-settings .el-form-item,
 .select-settings .el-form-item {
   margin-bottom: 0;
 }
 
 .number-settings .el-input-number,
 .select-settings .el-input {
   width: 100%;
 }
 
 /* 선택 옵션 레이아웃 개선 */
 .select-options {
   display: flex;
   flex-direction: column;
   gap: 10px;
   width: 100%;
 }
 
 .option-item {
   display: flex;
   align-items: center;
   gap: 10px;
   width: 100%;
 }
 
 .option-item .el-input {
   flex: 1;
 }
 
 /* 필드 ID 섹션 개선 */
 .field-id-section {
   display: flex;
   align-items: center;
   margin-bottom: 15px;
   width: 100%;
   gap: 10px;
 }
 
 .field-id-section .el-input {
   flex: 1;
 }
 
 /* 입력 필드 아이템 개선 */
 .input-field-item {
   border: 1px solid #e4e7ed;
   border-radius: 8px;
   padding: 20px;
   margin-bottom: 20px;
   background: #fafafa;
   width: auto;
 }
 
 /* JSON 에디터 섹션 개선 */
 .json-editor-section {
   width: 100%;
 }
 
 .json-controls {
   display: flex;
   gap: 10px;
   margin-bottom: 10px;
   flex-wrap: wrap;
 }
 
 .json-controls .el-button {
   flex-shrink: 0;
 }
 
 /* 입력 필드 섹션 개선 */
 .input-fields-section {
   border: 1px solid #dcdfe6;
   border-radius: 4px;
   padding: 20px;
   width: 100%;
 }
 
 .input-fields-header {
   display: flex;
   justify-content: space-between;
   align-items: center;
   margin-bottom: 20px;
   width: 100%;
 }
 
 .input-fields-header h4 {
   margin: 0;
   color: #303133;
 }
 
 .input-fields-list {
   width: 100%;
 }
</style> 