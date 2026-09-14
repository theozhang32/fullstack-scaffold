// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'app',
  typescript: true,
  vue: false,
  ignores: ['**/dist', '**/coverage', '**/data', '**/.snapshot-*.json'],
}, {
  // 构造函数注入的 DI token 必须保留运行时导入，
  // 否则 emitDecoratorMetadata 丢失参数类型，构建后的 Nest 应用无法启动
  rules: {
    'ts/consistent-type-imports': 'off',
  },
})
