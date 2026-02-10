import type { PropConfig } from '@mlc/schema';
import type { MaterialMeta } from '../types';

/**
 * Element Plus 物料元数据（纯数据，用于 Vue 渲染器）
 */
export const elementPlusMaterialsMeta: MaterialMeta[] = [
  {
    name: 'Button',
    title: '按钮',
    library: 'element-plus',
    framework: 'vue',
    category: '通用',
    description: '常用的操作按钮',
    thumbnail: '/src/assets/thumbnail/element/el-btn.svg',
    defaultProps: { type: 'default' },
    propConfig: {
      children: { type: 'string', label: '按钮文字', defaultValue: '按钮' },
      type: {
        type: 'select', label: '类型', defaultValue: 'default',
        options: [
          { label: '默认', value: 'default' },
          { label: '主要', value: 'primary' },
          { label: '成功', value: 'success' },
          { label: '警告', value: 'warning' },
          { label: '危险', value: 'danger' },
          { label: '信息', value: 'info' },
        ],
      },
      size: {
        type: 'select', label: '尺寸', defaultValue: 'default',
        options: [
          { label: '大', value: 'large' },
          { label: '默认', value: 'default' },
          { label: '小', value: 'small' },
        ],
      },
      disabled: { type: 'boolean', label: '禁用', defaultValue: false },
      plain: { type: 'boolean', label: '朴素', defaultValue: false },
      round: { type: 'boolean', label: '圆角', defaultValue: false },
      circle: { type: 'boolean', label: '圆形', defaultValue: false },
      loading: { type: 'boolean', label: '加载中', defaultValue: false },
    } satisfies PropConfig,
    supportedEvents: [
      { trigger: 'onClick', label: '点击' },
    ],
  },
  {
    name: 'Input',
    title: '输入框',
    library: 'element-plus',
    framework: 'vue',
    category: '数据录入',
    description: '通过鼠标或键盘输入字符',
    thumbnail: '/src/assets/thumbnail/element/el-input.svg',
    defaultProps: { placeholder: '请输入' },
    propConfig: {
      placeholder: { type: 'string', label: '占位符', defaultValue: '请输入' },
      modelValue: { type: 'string', label: '绑定值' },
      size: {
        type: 'select', label: '尺寸', defaultValue: 'default',
        options: [
          { label: '大', value: 'large' },
          { label: '默认', value: 'default' },
          { label: '小', value: 'small' },
        ],
      },
      maxlength: { type: 'number', label: '最大长度', min: 0 },
      disabled: { type: 'boolean', label: '禁用', defaultValue: false },
      clearable: { type: 'boolean', label: '可清空', defaultValue: false },
      showWordLimit: { type: 'boolean', label: '显示字数', defaultValue: false },
      prefixIcon: { type: 'string', label: '前缀图标' },
      suffixIcon: { type: 'string', label: '后缀图标' },
    } satisfies PropConfig,
    supportedEvents: [
      { trigger: 'onChange', label: '值改变' },
      { trigger: 'onFocus', label: '获得焦点' },
      { trigger: 'onBlur', label: '失去焦点' },
    ],
  },
  {
    name: 'Card',
    title: '卡片',
    library: 'element-plus',
    framework: 'vue',
    category: '数据展示',
    description: '将信息聚合在卡片容器中展示',
    thumbnail: '/src/assets/thumbnail/element/el-card.svg',
    defaultProps: { header: '卡片标题' },
    propConfig: {
      header: { type: 'string', label: '标题', defaultValue: '卡片标题' },
      children: { type: 'textarea', label: '内容', defaultValue: '卡片内容' },
      shadow: {
        type: 'select', label: '阴影', defaultValue: 'always',
        options: [
          { label: '总是', value: 'always' },
          { label: '悬浮时', value: 'hover' },
          { label: '从不', value: 'never' },
        ],
      },
      bodyStyle: { type: 'string', label: '内容样式' },
    } satisfies PropConfig,
    supportedEvents: [
      { trigger: 'onClick', label: '点击' },
    ],
  },
  {
    name: 'Text',
    title: '文本',
    library: 'element-plus',
    framework: 'vue',
    category: '通用',
    description: '文本的常见操作',
    thumbnail: '/src/assets/thumbnail/element/el-text.svg',
    defaultProps: {},
    propConfig: {
      children: { type: 'string', label: '文本内容', defaultValue: '文本内容' },
      type: {
        type: 'select', label: '类型',
        options: [
          { label: '默认', value: '' },
          { label: '主要', value: 'primary' },
          { label: '成功', value: 'success' },
          { label: '警告', value: 'warning' },
          { label: '危险', value: 'danger' },
          { label: '信息', value: 'info' },
        ],
      },
      size: {
        type: 'select', label: '尺寸', defaultValue: 'default',
        options: [
          { label: '大', value: 'large' },
          { label: '默认', value: 'default' },
          { label: '小', value: 'small' },
        ],
      },
      truncated: { type: 'boolean', label: '省略', defaultValue: false },
      tag: { type: 'string', label: '标签', defaultValue: 'span' },
    } satisfies PropConfig,
    supportedEvents: [
      { trigger: 'onClick', label: '点击' },
    ],
  },
  {
    name: 'Divider',
    title: '分割线',
    library: 'element-plus',
    framework: 'vue',
    category: '布局',
    description: '区隔内容的分割线',
    thumbnail: '/src/assets/thumbnail/element/el-divider.svg',
    defaultProps: {},
    propConfig: {
      children: { type: 'string', label: '文字' },
      direction: {
        type: 'select', label: '方向', defaultValue: 'horizontal',
        options: [
          { label: '水平', value: 'horizontal' },
          { label: '垂直', value: 'vertical' },
        ],
      },
      contentPosition: {
        type: 'select', label: '文字位置', defaultValue: 'center',
        options: [
          { label: '左', value: 'left' },
          { label: '中', value: 'center' },
          { label: '右', value: 'right' },
        ],
      },
      borderStyle: {
        type: 'select', label: '边框样式', defaultValue: 'solid',
        options: [
          { label: '实线', value: 'solid' },
          { label: '虚线', value: 'dashed' },
          { label: '点线', value: 'dotted' },
        ],
      },
    } satisfies PropConfig,
  },
];

/**
 * 获取 Element Plus 物料元数据
 */
export function getElementPlusMaterialsMeta(): MaterialMeta[] {
  return elementPlusMaterialsMeta;
}

/**
 * 根据名称获取单个物料元数据
 */
export function getElementPlusMaterialMeta(name: string): MaterialMeta | undefined {
  return elementPlusMaterialsMeta.find((m) => m.name === name);
}
