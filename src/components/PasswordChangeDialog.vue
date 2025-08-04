<template>
  <el-dialog
    v-model="visible"
    title="비밀번호 변경"
    width="400px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <el-form
      ref="passwordFormRef"
      :model="passwordForm"
      :rules="passwordRules"
      label-width="120px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="현재 비밀번호" prop="currentPassword">
        <el-input
          v-model="passwordForm.currentPassword"
          type="password"
          placeholder="현재 비밀번호를 입력하세요"
          show-password
          clearable
        />
      </el-form-item>
      
      <el-form-item label="새 비밀번호" prop="newPassword">
        <el-input
          v-model="passwordForm.newPassword"
          type="password"
          placeholder="새 비밀번호를 입력하세요"
          show-password
          clearable
        />
      </el-form-item>
      
      <el-form-item label="새 비밀번호 확인" prop="confirmPassword">
        <el-input
          v-model="passwordForm.confirmPassword"
          type="password"
          placeholder="새 비밀번호를 다시 입력하세요"
          show-password
          clearable
        />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">취소</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          비밀번호 변경
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

export default {
  name: 'PasswordChangeDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'password-changed'],
  setup(props, { emit }) {
    const visible = ref(false)
    const loading = ref(false)
    const passwordFormRef = ref()
    
    const passwordForm = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    
    const passwordRules = {
      currentPassword: [
        { required: true, message: '현재 비밀번호를 입력하세요', trigger: 'blur' }
      ],
      newPassword: [
        { required: true, message: '새 비밀번호를 입력하세요', trigger: 'blur' },
        { min: 6, message: '비밀번호는 최소 6자 이상이어야 합니다', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '새 비밀번호 확인을 입력하세요', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (value !== passwordForm.newPassword) {
              callback(new Error('비밀번호가 일치하지 않습니다'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ]
    }
    
    watch(() => props.modelValue, (newVal) => {
      visible.value = newVal
      if (newVal) {
        // 다이얼로그가 열릴 때 폼 초기화
        passwordForm.currentPassword = ''
        passwordForm.newPassword = ''
        passwordForm.confirmPassword = ''
        if (passwordFormRef.value) {
          passwordFormRef.value.clearValidate()
        }
      }
    })
    
    watch(visible, (newVal) => {
      emit('update:modelValue', newVal)
    })
    
    const handleSubmit = async () => {
      if (!passwordFormRef.value) return
      
      try {
        await passwordFormRef.value.validate()
        
        loading.value = true
        
        const response = await axios.post('/api/auth/change-password', {
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword
        })
        
        ElMessage.success(response.data.message || '비밀번호가 성공적으로 변경되었습니다')
        emit('password-changed')
        visible.value = false
        
      } catch (error) {
        if (error.response?.data?.detail) {
          ElMessage.error(error.response.data.detail)
        } else if (error.message) {
          ElMessage.error(error.message)
        } else {
          ElMessage.error('비밀번호 변경에 실패했습니다')
        }
        console.error('Password change error:', error)
      } finally {
        loading.value = false
      }
    }
    
    const handleCancel = () => {
      visible.value = false
    }
    
    return {
      visible,
      loading,
      passwordForm,
      passwordFormRef,
      passwordRules,
      handleSubmit,
      handleCancel
    }
  }
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 