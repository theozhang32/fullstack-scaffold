// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  typescript: true,
  vue: false,
  ignores: ['**/dist', '**/coverage'],
})
