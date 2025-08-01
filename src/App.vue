<template>
  <div id="app">
    <el-config-provider :locale="locale">
      <!-- 로딩 오버레이 -->
      <el-loading-service v-if="loading" :text="loadingText" />
      
      <!-- 알림 메시지 -->
      <transition name="el-notification-fade">
        <div v-if="notification.show" class="notification-container">
          <el-alert
            :title="notification.title"
            :type="notification.type"
            :description="notification.message"
            show-icon
            closable
            @close="clearNotification"
          />
        </div>
      </transition>

      <!-- 메인 레이아웃 -->
      <el-container class="layout-container">
        <!-- 헤더 -->
        <el-header class="layout-header" v-if="!isLoginPage">
          <div class="header-content">
            <div class="logo">
              <h2>ComfyUI 워크플로우 관리</h2>
            </div>
            <div class="header-actions" v-if="isAuthenticated">
              <el-dropdown @command="handleUserAction">
                <span class="user-dropdown">
                  <el-icon><User /></el-icon>
                  {{ currentUser?.username || 'User' }}
                  <el-icon class="el-icon--right"><arrow-down /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="profile">프로필</el-dropdown-item>
                    <el-dropdown-item command="logout" divided>로그아웃</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </el-header>

        <el-container>
          <!-- 사이드바 -->
          <el-aside class="layout-sidebar" width="200px" v-if="!isLoginPage && isAuthenticated">
            <el-menu
              :default-active="$route.path"
              class="el-menu-vertical"
              router
            >
              <el-menu-item index="/dashboard">
                <el-icon><House /></el-icon>
                <span>대시보드</span>
              </el-menu-item>
              <el-menu-item index="/workflows">
                <el-icon><Document /></el-icon>
                <span>워크플로우</span>
              </el-menu-item>
              <el-menu-item index="/executions">
                <el-icon><Monitor /></el-icon>
                <span>실행 기록</span>
              </el-menu-item>
              <el-menu-item index="/admin" v-if="currentUser?.role === 'admin'">
                <el-icon><Setting /></el-icon>
                <span>관리자</span>
              </el-menu-item>
            </el-menu>
          </el-aside>

          <!-- 메인 콘텐츠 -->
          <el-main class="layout-main">
            <router-view />
          </el-main>
        </el-container>
      </el-container>
    </el-config-provider>
  </div>
</template>

<script>
import { computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { startConnectionMonitoring, stopConnectionMonitoring } from '@/utils/api'

export default {
  name: 'App',
  setup() {
    const store = useStore()
    const route = useRoute()

    const loading = computed(() => store.state.loading)
    const loadingText = computed(() => store.state.loadingText)
    const notification = computed(() => store.state.notification)
    const isAuthenticated = computed(() => store.getters['auth/isAuthenticated'])
    const currentUser = computed(() => store.state.auth.user)
    const isLoginPage = computed(() => route.path === '/login' || route.path === '/register')

    const locale = {
      name: 'ko',
      el: {
        pagination: {
          goto: '이동',
          pagesize: '개',
          total: '총 {total}개',
          pageClassifier: '페이지',
          prev: '이전',
          next: '다음',
          jumper: '이동',
          jumperText: '페이지로 이동'
        },
        messagebox: {
          title: '알림',
          confirm: '확인',
          cancel: '취소'
        },
        upload: {
          deleteTip: '삭제하려면 Delete 키를 누르세요',
          delete: '삭제',
          preview: '미리보기',
          continue: '계속'
        },
        table: {
          emptyText: '데이터 없음',
          confirmFilter: '확인',
          resetFilter: '초기화',
          clearFilter: '전체',
          sumText: '합계'
        },
        tree: {
          emptyText: '데이터 없음'
        },
        transfer: {
          noMatch: '검색 결과 없음',
          noData: '데이터 없음',
          titles: ['목록 1', '목록 2'],
          filterPlaceholder: '검색어 입력',
          noCheckedFormat: '{total}개 항목',
          hasCheckedFormat: '{checked}/{total}개 선택됨'
        },
        image: {
          error: '불러오기 실패'
        },
        pageHeader: {
          title: '뒤로'
        },
        popconfirm: {
          confirmButtonText: '확인',
          cancelButtonText: '취소'
        },
        carousel: {
          leftArrow: '이전 슬라이드',
          rightArrow: '다음 슬라이드',
          indicator: '슬라이드 {index}로 이동'
        }
      }
    }

    onMounted(async () => {
      // 페이지 로드 시 인증 상태 복원
      try {
        await store.dispatch('auth/initializeAuth')
        
        // 인증된 사용자인 경우 연결 모니터링 시작
        if (store.getters['auth/isAuthenticated']) {
          startConnectionMonitoring()
        }
      } catch (error) {
        console.error('인증 초기화 오류:', error)
      }
    })

    onUnmounted(() => {
      // 컴포넌트 언마운트 시 연결 모니터링 중지
      stopConnectionMonitoring()
    })

    const clearNotification = () => {
      store.commit('CLEAR_NOTIFICATION')
    }

    const handleUserAction = (command) => {
      if (command === 'logout') {
        store.dispatch('auth/logout')
      } else if (command === 'profile') {
        // 프로필 페이지로 이동
        console.log('프로필 페이지 구현 예정')
      }
    }

    return {
      loading,
      loadingText,
      notification,
      isAuthenticated,
      currentUser,
      isLoginPage,
      locale,
      clearNotification,
      handleUserAction
    }
  }
}
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-container {
  height: 100%;
}

.layout-header {
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo h2 {
  margin: 0;
  color: #409eff;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-dropdown {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-dropdown:hover {
  background-color: #f5f7fa;
}

.layout-sidebar {
  background-color: #fff;
  border-right: 1px solid #e4e7ed;
}

.layout-main {
  background-color: #f5f7fa;
  padding: 20px;
}

.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  width: 400px;
}

.el-notification-fade-enter-active,
.el-notification-fade-leave-active {
  transition: all 0.3s ease;
}

.el-notification-fade-enter-from,
.el-notification-fade-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style> 