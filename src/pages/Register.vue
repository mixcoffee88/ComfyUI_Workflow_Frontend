<template>
  <div class="register-container">
    <div class="register-form">
      <div class="logo-section">
        <h1>회원가입</h1>
        <p>ComfyUI 워크플로우 관리 플랫폼에 가입하세요</p>
      </div>

      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form-content"
        size="large"
      >
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="사용자명"
            prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="이메일"
            prefix-icon="Message"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="비밀번호"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="비밀번호 확인"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleRegister"
            class="register-button"
          >
            회원가입
          </el-button>
        </el-form-item>

        <div class="form-footer">
          <router-link to="/login" class="login-link">
            이미 계정이 있으신가요? 로그인
          </router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

export default {
  name: 'Register',
  setup() {
    const store = useStore()
    const router = useRouter()
    const registerFormRef = ref()
    const loading = ref(false)

    const registerForm = reactive({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    })

    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== registerForm.password) {
        callback(new Error('비밀번호가 일치하지 않습니다'))
      } else {
        callback()
      }
    }

    const registerRules = {
      username: [
        { required: true, message: '사용자명을 입력해주세요', trigger: 'blur' },
        { min: 3, max: 20, message: '사용자명은 3-20자 사이여야 합니다', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '이메일을 입력해주세요', trigger: 'blur' },
        { type: 'email', message: '올바른 이메일 형식이 아닙니다', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '비밀번호를 입력해주세요', trigger: 'blur' },
        { min: 6, message: '비밀번호는 최소 6자 이상이어야 합니다', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '비밀번호 확인을 입력해주세요', trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' }
      ]
    }

    const handleRegister = async () => {
      if (!registerFormRef.value) return

      const valid = await registerFormRef.value.validate().catch(() => false)
      if (!valid) return

      loading.value = true
      try {
        const result = await store.dispatch('auth/register', {
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password
        })

        if (result.success) {
          ElMessage.success(result.message)
          router.push('/login')
        } else {
          ElMessage.error(result.message)
        }
      } catch (error) {
        ElMessage.error('회원가입 중 오류가 발생했습니다.')
      } finally {
        loading.value = false
      }
    }

    return {
      registerFormRef,
      registerForm,
      registerRules,
      loading,
      handleRegister
    }
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-form {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.logo-section {
  text-align: center;
  margin-bottom: 30px;
}

.logo-section h1 {
  color: #303133;
  margin-bottom: 10px;
  font-size: 28px;
  font-weight: bold;
}

.logo-section p {
  color: #909399;
  margin: 0;
  font-size: 14px;
}

.register-form-content {
  margin-top: 20px;
}

.register-button {
  width: 100%;
  height: 50px;
  font-size: 16px;
  font-weight: bold;
}

.form-footer {
  text-align: center;
  margin-top: 20px;
}

.login-link {
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
}

.login-link:hover {
  text-decoration: underline;
}
</style> 