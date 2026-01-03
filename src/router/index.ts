import { createRouter, createWebHistory } from 'vue-router'

import HomePage from '@/pages/HomePage.vue'
import RequirementsImportPage from '@/pages/RequirementsImportPage.vue'
import RequirementsIndexPage from '@/pages/RequirementsIndexPage.vue'
import RequirementsSearchPage from '@/pages/RequirementsSearchPage.vue'
import TestsImportPage from '@/pages/TestsImportPage.vue'
import TestsSearchPage from '@/pages/TestsSearchPage.vue'
import ReviewsCreatePage from '@/pages/ReviewsCreatePage.vue'
import ReviewsListPage from '@/pages/ReviewsListPage.vue'
import ReviewDetailPage from '@/pages/ReviewDetailPage.vue'
import JobPage from '@/pages/JobPage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'
import PublicCriteriaPage from '@/pages/PublicCriteriaPage.vue'
import CoverageAnalyzePage from '@/pages/CoverageAnalyzePage.vue'
import CoverageResultPage from '@/pages/CoverageResultPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage, meta: { title: '概览' } },
    {
      path: '/requirements/import',
      name: 'requirements-import',
      component: RequirementsImportPage,
      meta: { title: '导入需求（Confluence）' },
    },
    { path: '/requirements/index', name: 'requirements-index', component: RequirementsIndexPage, meta: { title: '索引需求' } },
    { path: '/requirements/search', name: 'requirements-search', component: RequirementsSearchPage, meta: { title: '需求检索' } },
    { path: '/tests/import', name: 'tests-import', component: TestsImportPage, meta: { title: '导入用例（XMind）' } },
    { path: '/tests/search', name: 'tests-search', component: TestsSearchPage, meta: { title: '用例检索' } },
    { path: '/reviews/create', name: 'reviews-create', component: ReviewsCreatePage, meta: { title: '发起评审' } },
    { path: '/reviews', name: 'reviews-list', component: ReviewsListPage, meta: { title: '评审列表' } },
    { path: '/reviews/:runId', name: 'review-detail', component: ReviewDetailPage, props: true, meta: { title: '评审详情' } },
    { path: '/jobs', name: 'jobs', component: JobPage, meta: { title: '任务查询' } },
    { path: '/settings', name: 'settings', component: SettingsPage, meta: { title: '设置' } },
    // 公共测试用例覆盖度分析
    { path: '/public-criteria', name: 'public-criteria', component: PublicCriteriaPage, meta: { title: '公共测试标准' } },
    { path: '/coverage/analyze', name: 'coverage-analyze', component: CoverageAnalyzePage, meta: { title: '覆盖度分析' } },
    { path: '/coverage/:runId', name: 'coverage-result', component: CoverageResultPage, props: true, meta: { title: '分析结果' } },
  ],
})

