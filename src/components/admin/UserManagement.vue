<template>
  <div class="users-section">
    <div class="section-header">
      <el-button type="primary" @click="createNewUser">
        <el-icon><Plus /></el-icon>
        사용자 추가
      </el-button>
      <el-button @click="loadUsers">
        <el-icon><Refresh /></el-icon>
        새로고침
      </el-button>
    </div>

    <el-table :data="users" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="사용자명" />
      <el-table-column prop="email" label="이메일" />
      <el-table-column prop="role" label="역할">
        <template #default="scope">
          <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'primary'">
            {{ scope.row.role === 'admin' ? '관리자' : '사용자' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="is_approved" label="승인 상태">
        <template #default="scope">
          <el-tag :type="scope.row.is_approved ? 'success' : 'warning'">
            {{ scope.row.is_approved ? '승인됨' : '승인 대기' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="가입일">
        <template #default="scope">
          {{ formatDate(scope.row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="작업" width="200">
        <template #default="scope">
          <el-button size="small" @click="editUser(scope.row)">
            편집
          </el-button>
          <el-button 
            size="small" 
            type="danger" 
            @click="deleteUser(scope.row)"
            :disabled="scope.row.role === 'admin'"
          >
            삭제
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 사용자 생성/편집 다이얼로그 -->
    <el-dialog 
      v-model="showCreateUserDialog" 
      :title="editingUser ? '사용자 편집' : '사용자 추가'"
      width="500px"
    >
      <el-form :model="userForm" :rules="userRules" ref="userFormRef" label-width="100px">
        <el-form-item label="사용자명" prop="username">
          <el-input v-model="userForm.username" />
        </el-form-item>
        <el-form-item label="이메일" prop="email">
          <el-input 
            v-model="userForm.email" 
            :readonly="editingUser"
            :placeholder="editingUser ? '이메일은 수정할 수 없습니다' : '이메일을 입력하세요'"
            :class="{ 'readonly-field': editingUser }"
          />
          <div v-if="editingUser" class="field-note">
            <el-icon><InfoFilled /></el-icon>
            <span>이메일은 수정할 수 없습니다</span>
          </div>
        </el-form-item>
        <el-form-item label="비밀번호" prop="password" v-if="!editingUser">
          <el-input v-model="userForm.password" type="password" />
        </el-form-item>
        <el-form-item label="역할" prop="role">
          <el-select v-model="userForm.role" placeholder="역할 선택">
            <el-option label="사용자" value="user" />
            <el-option label="관리자" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="승인 상태" prop="is_approved">
          <el-switch v-model="userForm.is_approved" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateUserDialog = false">취소</el-button>
          <el-button type="primary" @click="saveUser">저장</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { Plus, Refresh, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

export default {
  name: 'UserManagement',
  components: {
    Plus,
    Refresh,
    InfoFilled
  },
  data() {
    return {
      users: [],
      loading: false,
      showCreateUserDialog: false,
      editingUser: null,
      userForm: {
        username: '',
        email: '',
        password: '',
        role: 'user',
        is_approved: true
      },
      userRules: {
        username: [
          { required: true, message: '사용자명을 입력하세요', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '이메일을 입력하세요', trigger: 'blur' },
          { type: 'email', message: '올바른 이메일 형식을 입력하세요', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '비밀번호를 입력하세요', trigger: 'blur' },
          { min: 6, message: '비밀번호는 최소 6자 이상이어야 합니다', trigger: 'blur' }
        ],
        role: [
          { required: true, message: '역할을 선택하세요', trigger: 'change' }
        ]
      }
    }
  },
  mounted() {
    this.loadUsers()
  },
  methods: {
    async loadUsers() {
      this.loading = true
      try {
        const response = await axios.get('/api/admin/users')
        this.users = response.data
      } catch (error) {
        ElMessage.error('사용자 목록을 불러오는데 실패했습니다.')
        console.error('Error loading users:', error)
      } finally {
        this.loading = false
      }
    },
    createNewUser() {
      this.editingUser = null
      this.resetUserForm()
      this.showCreateUserDialog = true
    },
    editUser(user) {
      this.editingUser = user
      this.userForm = {
        username: user.username,
        email: user.email,
        password: '',
        role: user.role,
        is_approved: user.is_approved
      }
      this.showCreateUserDialog = true
    },
    async deleteUser(user) {
      try {
        await ElMessageBox.confirm(
          `정말로 사용자 "${user.username}"을 삭제하시겠습니까?`,
          '사용자 삭제',
          {
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
            type: 'warning'
          }
        )
        
        await axios.delete(`/api/admin/users/${user.id}`)
        ElMessage.success('사용자가 삭제되었습니다.')
        this.loadUsers()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('사용자 삭제에 실패했습니다.')
          console.error('Error deleting user:', error)
        }
      }
    },
    async saveUser() {
      try {
        const valid = await this.$refs.userFormRef.validate()
        if (!valid) return

        if (this.editingUser) {
          // 편집 모드
          await axios.put(`/api/admin/users/${this.editingUser.id}`, this.userForm)
          ElMessage.success('사용자 정보가 업데이트되었습니다.')
        } else {
          // 생성 모드
          await axios.post('/api/admin/users', this.userForm)
          ElMessage.success('사용자가 생성되었습니다.')
        }
        
        this.showCreateUserDialog = false
        this.resetUserForm()
        this.loadUsers()
      } catch (error) {
        ElMessage.error('사용자 저장에 실패했습니다.')
        console.error('Error saving user:', error)
      }
    },
    resetUserForm() {
      this.editingUser = null
      this.userForm = {
        username: '',
        email: '',
        password: '',
        role: 'user',
        is_approved: true
      }
      this.$refs.userFormRef?.resetFields()
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('ko-KR')
    }
  }
}
</script>

<style scoped>
.users-section {
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.readonly-field {
  background-color: #f5f7fa;
  color: #909399;
}

.field-note {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
}

.field-note .el-icon {
  font-size: 14px;
  color: #409eff;
}
</style> 