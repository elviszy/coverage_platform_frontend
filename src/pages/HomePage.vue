<template>
  <div class="home-page">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="welcome-content">
        <h1 class="welcome-title">👋 欢迎使用测试覆盖评审平台</h1>
        <p class="welcome-desc">智能分析需求与用例的覆盖关系，让质量保障更高效</p>
      </div>
      <div class="welcome-decoration"></div>
    </div>

    <!-- 快捷操作卡片 -->
    <div class="quick-actions">
      <div class="action-card" @click="$router.push('/requirements/import')">
        <div class="action-icon">📥</div>
        <div class="action-info">
          <div class="action-title">导入需求</div>
          <div class="action-desc">从 Confluence、Word 或纯文本导入</div>
        </div>
        <div class="action-arrow">→</div>
      </div>

      <div class="action-card" @click="$router.push('/tests/import')">
        <div class="action-icon">📋</div>
        <div class="action-info">
          <div class="action-title">导入用例</div>
          <div class="action-desc">从 XMind 文件导入测试用例</div>
        </div>
        <div class="action-arrow">→</div>
      </div>

      <div class="action-card action-card--primary" @click="$router.push('/reviews/create')">
        <div class="action-icon">✨</div>
        <div class="action-info">
          <div class="action-title">发起评审</div>
          <div class="action-desc">启动智能覆盖度分析</div>
        </div>
        <div class="action-arrow">→</div>
      </div>

      <div class="action-card" @click="$router.push('/reviews')">
        <div class="action-icon">📊</div>
        <div class="action-info">
          <div class="action-title">评审列表</div>
          <div class="action-desc">查看历史评审记录</div>
        </div>
        <div class="action-arrow">→</div>
      </div>
    </div>

    <!-- 平台信息 -->
    <el-row :gutter="20" style="margin-top: 24px">
      <el-col :span="12">
        <el-card class="info-card">
          <template #header>
            <div class="card-header-with-icon">
              <span class="header-icon">🛠️</span>
              <span>平台状态</span>
            </div>
          </template>
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">API 地址</span>
              <code>/api/v1</code>
            </div>
            <div class="info-item">
              <span class="info-label">代理目标</span>
              <code>127.0.0.1:8000</code>
            </div>
            <div class="info-item">
              <span class="info-label">任务查询</span>
              <code>/api/v1/jobs/{job_id}</code>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="info-card">
          <template #header>
            <div class="card-header-with-icon">
              <span class="header-icon">💡</span>
              <span>使用指南</span>
            </div>
          </template>
          <div class="tips-list">
            <div class="tip-item">
              <span class="tip-number">1</span>
              <span>先导入需求文档，建立验收标准库</span>
            </div>
            <div class="tip-item">
              <span class="tip-number">2</span>
              <span>索引需求，生成向量用于检索</span>
            </div>
            <div class="tip-item">
              <span class="tip-number">3</span>
              <span>导入测试用例（XMind 格式）</span>
            </div>
            <div class="tip-item">
              <span class="tip-number">4</span>
              <span>发起评审，获取覆盖度报告</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.home-page {
  max-width: 1200px;
}

.welcome-banner {
  position: relative;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  border-radius: 20px;
  padding: 40px;
  color: white;
  overflow: hidden;
  margin-bottom: 24px;
}

.welcome-content {
  position: relative;
  z-index: 1;
}

.welcome-title {
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 12px;
  letter-spacing: -0.5px;
}

.welcome-desc {
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
}

.welcome-decoration {
  position: absolute;
  top: -50%;
  right: -10%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  border-radius: 50%;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.action-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  border-color: rgba(99, 102, 241, 0.3);
}

.action-card--primary {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  border: none;
}

.action-card--primary:hover {
  box-shadow: 0 12px 32px rgba(99, 102, 241, 0.4);
}

.action-card--primary .action-desc {
  color: rgba(255, 255, 255, 0.8);
}

.action-icon {
  font-size: 32px;
  line-height: 1;
}

.action-info {
  flex: 1;
}

.action-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 13px;
  color: #64748b;
}

.action-arrow {
  font-size: 18px;
  opacity: 0.5;
  transition: transform 0.2s ease;
}

.action-card:hover .action-arrow {
  transform: translateX(4px);
  opacity: 1;
}

.info-card {
  height: 100%;
}

.card-header-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 18px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  color: #64748b;
  font-size: 14px;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #334155;
}

.tip-number {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #4f46e5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

@media (max-width: 1200px) {
  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .quick-actions {
    grid-template-columns: 1fr;
  }
}
</style>
