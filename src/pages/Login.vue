<template>
  <div class="login-container">
    <div class="login-form">
      <div class="logo-section">
        <h1>ComfyUI 워크플로우 관리</h1>
        <p>워크플로우를 쉽게 관리하고 실행하세요</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form-content"
        size="large"
      >
        <el-form-item prop="email">
          <el-input
            v-model="loginForm.email"
            placeholder="이메일"
            prefix-icon="Message"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="비밀번호"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleLogin"
            class="login-button"
          >
            로그인
          </el-button>
        </el-form-item>

        <div class="form-footer">
          <router-link to="/register" class="register-link">
            계정이 없으신가요? 회원가입
          </router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'

export default {
  name: 'Login',
  setup() {
    const store = useStore()
    const loginFormRef = ref()
    const loading = ref(false)

    const loginForm = reactive({
      email: '',
      password: ''
    })

    const loginRules = {
      email: [
        { required: true, message: '이메일을 입력해주세요', trigger: 'blur' },
        { type: 'email', message: '올바른 이메일 형식을 입력해주세요', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '비밀번호를 입력해주세요', trigger: 'blur' },
        { min: 6, message: '비밀번호는 최소 6자 이상이어야 합니다', trigger: 'blur' }
      ]
    }

    const handleLogin = async () => {
      if (!loginFormRef.value) return

      const valid = await loginFormRef.value.validate().catch(() => false)
      if (!valid) return

      loading.value = true
      try {
        const result = await store.dispatch('auth/login', {
          email: loginForm.email,
          password: loginForm.password
        })

        if (result.success) {
          ElMessage.success('로그인 성공!')
        } else {
          ElMessage.error(result.message)
        }
      } catch (error) {
        ElMessage.error('로그인 중 오류가 발생했습니다.')
      } finally {
        loading.value = false
      }
    }

    return {
      loginFormRef,
      loginForm,
      loginRules,
      loading,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-form {
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

.login-form-content {
  margin-top: 20px;
}

.login-button {
  width: 100%;
  height: 50px;
  font-size: 16px;
  font-weight: bold;
}

.form-footer {
  text-align: center;
  margin-top: 20px;
}

.register-link {
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
}

.register-link:hover {
  text-decoration: underline;
}
</style> 