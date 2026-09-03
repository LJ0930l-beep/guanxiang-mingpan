/**
 * P5-C copy matrix for non-success states.
 *
 * These phrases intentionally describe the current product state and the
 * available next action. They do not promise an outcome or turn an
 * incomplete input into a conclusion.
 */
export const UI_STATE_COPY = {
  loading: {
    title: '正在校准观象仪',
    body: '正在准备本机资料，请稍候。',
    announcement: '正在校准观象仪，准备本机资料。',
    action: '请稍候',
  },
  empty: {
    title: '暂时没有可展示的内容',
    body: '完成一次操作后，结果会留在本机记录中。',
    announcement: '这里暂时没有可展示的内容。',
    action: '开始一次操作',
  },
  failure: {
    title: '这次没有完成',
    body: '本地操作未成功；请检查输入后重试。',
    announcement: '本地操作没有完成。',
    action: '重试',
  },
  partial: {
    title: '部分资料可用',
    body: '当前内容只使用已确认的输入；缺失项不会被猜测。',
    announcement: '当前只提供部分内容，缺失项不会被猜测。',
    action: '查看边界',
  },
  blocked: {
    title: '当前版本只读',
    body: '这份资料由更新版本写入，当前版本不会覆盖它。',
    announcement: '当前版本只读，相关写入操作已锁定。',
    action: '查看说明',
  },
  unknown: {
    title: '暂无足够依据',
    body: '信息不足以安全展示此处内容；不会补造结果。',
    announcement: '暂无足够依据展示此处内容，不会补造结果。',
    action: '返回输入',
  },
} as const;

export type UiState = keyof typeof UI_STATE_COPY;
