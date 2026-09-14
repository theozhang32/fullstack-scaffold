/**
 * 反馈助手：统一封装 antdv-next 的 message / Modal 静态方法。
 * 业务提示文案由调用方组装后经此处弹出。
 */
import { message, Modal } from 'antdv-next'

export const feedback = {
  success: (content: string) => message.success(content),
  error: (content: string) => message.error(content),
  warning: (content: string) => message.warning(content),
  info: (content: string) => message.info(content),

  confirm(opts: { title: string, content?: string, okText?: string, okDanger?: boolean, onOk: () => unknown }) {
    Modal.confirm({
      title: opts.title,
      content: opts.content,
      okText: opts.okText ?? '确定',
      cancelText: '取消',
      okButtonProps: { danger: opts.okDanger },
      onOk: async () => {
        await opts.onOk()
      },
    })
  },
}
