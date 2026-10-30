import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import postcss from 'postcss'

test('移动端隐藏的历史侧栏不会被全局样式强制显示', () => {
  const css = postcss.parse(readFileSync(new URL('../assets/css/main.css', import.meta.url), 'utf8'))
  const sidebar = css.nodes.find(node => node.type === 'rule' && node.selector === '.sidebar')
  assert.ok(sidebar, '需要存在侧栏基础样式')
  const baseDisplay = sidebar.nodes.find(node => node.type === 'decl' && node.prop === 'display')
  assert.equal(baseDisplay, undefined, '基础样式不能覆盖 Tailwind 的 hidden lg:flex')

  const template = readFileSync(new URL('../components/layout/AppSidebar.vue', import.meta.url), 'utf8')
  assert.match(template, /class="sidebar hidden lg:flex"/, '桌面侧栏应仅在 lg 及以上显示')
  assert.match(template, /class="sidebar absolute[^"\n]*\bflex\b/, '移动抽屉应显式显示')
})
