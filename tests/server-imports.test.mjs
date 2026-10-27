import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('抽签接口不再依赖已移除的内存限流模块', () => {
  for (const name of ['bagua-shake', 'fun-draw', 'tarot-draw']) {
    const source = readFileSync(new URL(`../server/api/fortune/${name}.post.ts`, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /services\/ai\/rate-limiter/, name)
  }
})
