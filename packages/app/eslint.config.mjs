// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'app',
  typescript: true,
  vue: true,
  ignores: ['**/dist', '**/coverage'],
})
