<template>
  <el-space direction="vertical" alignment="start" style="width: 100%" :size="16">
    <el-card style="width: 100%">
      <template #header>平台状态</template>
      <div>后端 API：<code>/api/v1</code>（Vite 已配置代理到 <code>127.0.0.1:8000</code>）</div>
      <div style="margin-top: 8px">
        任务查询：<code>/api/v1/jobs/{job_id}</code>
      </div>
    </el-card>

    <el-card style="width: 100%">
      <template #header>快捷入口</template>
      <el-space wrap>
        <el-button type="primary" @click="$router.push('/requirements/import')">导入需求</el-button>
        <el-button type="primary" @click="$router.push('/tests/import')">导入用例</el-button>
        <el-button @click="$router.push('/reviews/create')">发起评审</el-button>
        <el-button @click="$router.push('/reviews')">评审列表</el-button>
      </el-space>
    </el-card>
  </el-space>
</template>
