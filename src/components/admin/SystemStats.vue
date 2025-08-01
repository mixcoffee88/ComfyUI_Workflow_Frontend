<template>
  <div class="stats-section">
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon users">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total_users }}</div>
            <div class="stat-label">전체 사용자</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon approved">
            <el-icon><Check /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.approved_users }}</div>
            <div class="stat-label">승인된 사용자</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon pending">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pending_users }}</div>
            <div class="stat-label">승인 대기</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon workflows">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total_workflows }}</div>
            <div class="stat-label">워크플로우</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon executions">
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total_executions }}</div>
            <div class="stat-label">실행 기록</div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { User, Check, Clock, Document, Monitor } from '@element-plus/icons-vue'

export default {
  name: 'SystemStats',
  components: {
    User,
    Check,
    Clock,
    Document,
    Monitor
  },
  props: {
    stats: {
      type: Object,
      required: true,
      default: () => ({
        total_users: 0,
        approved_users: 0,
        pending_users: 0,
        total_workflows: 0,
        total_executions: 0
      })
    }
  }
}
</script>

<style scoped>
.stats-section {
  padding: 20px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 24px;
  color: white;
}

.stat-icon.users {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.approved {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.pending {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.workflows {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-icon.executions {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 500;
}
</style> 