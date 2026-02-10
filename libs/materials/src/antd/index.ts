import { ComponentType } from 'react';
import { Button, Input, Card, Typography, Divider, FloatButton } from 'antd';
import type { PropConfig, EventDeclaration } from '@mlc/schema';
import type { ComponentMeta } from '../registry';
import { componentRegistry } from '../registry';

const { Text } = Typography;

interface MaterialConfig {
  component: ComponentType<any>;
  meta: Omit<ComponentMeta, 'library' | 'framework'>;
}

const antdMaterials: Record<string, MaterialConfig> = {
  Button: {
    component: Button,
    meta: {
      name: 'Button',
      title: '按钮',
      category: '通用',
      description: '按钮用于开始一个即时操作',
      thumbnail: '/src/assets/thumbnail/antd/antd-btn.svg',
      defaultProps: { type: 'default', children: '按钮' },
      propConfig: {
        children: { type: 'string', label: '按钮文字', defaultValue: '按钮' },
        type: {
          type: 'select', label: '类型', defaultValue: 'default',
          options: [
            { label: '默认', value: 'default' },
            { label: '主要', value: 'primary' },
            { label: '虚线', value: 'dashed' },
            { label: '文本', value: 'text' },
            { label: '链接', value: 'link' },
          ],
        },
        size: {
          type: 'select', label: '尺寸', defaultValue: 'middle',
          options: [
            { label: '大', value: 'large' },
            { label: '中', value: 'middle' },
            { label: '小', value: 'small' },
          ],
        },
        disabled: { type: 'boolean', label: '禁用', defaultValue: false },
        danger: { type: 'boolean', label: '危险', defaultValue: false },
        block: { type: 'boolean', label: '块级', defaultValue: false },
        ghost: { type: 'boolean', label: '幽灵', defaultValue: false },
        loading: { type: 'boolean', label: '加载中', defaultValue: false },
        shape: {
          type: 'select', label: '形状', defaultValue: 'default',
          options: [
            { label: '默认', value: 'default' },
            { label: '圆形', value: 'circle' },
            { label: '圆角', value: 'round' },
          ],
        },
      } satisfies PropConfig,
      supportedEvents: [
        { trigger: 'onClick', label: '点击', description: '点击按钮时触发' },
        { trigger: 'onMouseEnter', label: '鼠标移入' },
        { trigger: 'onMouseLeave', label: '鼠标移出' },
      ] satisfies EventDeclaration[],
    },
  },
  FloatButton: {
    component: FloatButton,
    meta: {
      name: 'FloatButton',
      title: '悬浮按钮',
      category: '通用',
      description: '悬浮按钮用于开始一个即时操作',
      thumbnail: '/src/assets/thumbnail/antd/antd-float-btn.svg',
      propConfig: {
        description: { type: 'string', label: '描述', placeholder: '按钮描述文本' },
        tooltip: { type: 'string', label: '提示', placeholder: '悬浮提示文本' },
        shape: {
          type: 'select', label: '形状', defaultValue: 'circle',
          options: [
            { label: '圆形', value: 'circle' },
            { label: '方形', value: 'square' },
          ],
        },
        type: {
          type: 'select', label: '类型', defaultValue: 'default',
          options: [
            { label: '默认', value: 'default' },
            { label: '主要', value: 'primary' },
          ],
        },
      } satisfies PropConfig,
      supportedEvents: [
        { trigger: 'onClick', label: '点击' },
      ],
    },
  },
  Input: {
    component: Input,
    meta: {
      name: 'Input',
      title: '输入框',
      category: '数据录入',
      description: '通过鼠标或键盘输入内容',
      thumbnail: '/src/assets/thumbnail/antd/antd-input.svg',
      defaultProps: { placeholder: '请输入' },
      propConfig: {
        placeholder: { type: 'string', label: '占位符', defaultValue: '请输入' },
        defaultValue: { type: 'string', label: '默认值' },
        size: {
          type: 'select', label: '尺寸', defaultValue: 'middle',
          options: [
            { label: '大', value: 'large' },
            { label: '中', value: 'middle' },
            { label: '小', value: 'small' },
          ],
        },
        maxLength: { type: 'number', label: '最大长度', min: 0 },
        disabled: { type: 'boolean', label: '禁用', defaultValue: false },
        allowClear: { type: 'boolean', label: '可清除', defaultValue: false },
        showCount: { type: 'boolean', label: '显示计数', defaultValue: false },
        prefix: { type: 'string', label: '前缀' },
        suffix: { type: 'string', label: '后缀' },
      } satisfies PropConfig,
      supportedEvents: [
        { trigger: 'onChange', label: '值改变', description: '输入内容改变时触发' },
        { trigger: 'onFocus', label: '获得焦点' },
        { trigger: 'onBlur', label: '失去焦点' },
      ],
    },
  },
  Card: {
    component: Card,
    meta: {
      name: 'Card',
      title: '卡片',
      category: '数据展示',
      description: '通用卡片容器',
      thumbnail: '/src/assets/thumbnail/antd/antd-card.svg',
      defaultProps: { title: '卡片标题', children: '卡片内容' },
      propConfig: {
        title: { type: 'string', label: '标题', defaultValue: '卡片标题' },
        children: { type: 'textarea', label: '内容', defaultValue: '卡片内容' },
        size: {
          type: 'select', label: '尺寸', defaultValue: 'default',
          options: [
            { label: '默认', value: 'default' },
            { label: '小', value: 'small' },
          ],
        },
        bordered: { type: 'boolean', label: '边框', defaultValue: true },
        hoverable: { type: 'boolean', label: '悬浮效果', defaultValue: false },
        loading: { type: 'boolean', label: '加载中', defaultValue: false },
      } satisfies PropConfig,
      supportedEvents: [
        { trigger: 'onClick', label: '点击' },
      ],
    },
  },
  Text: {
    component: Text,
    meta: {
      name: 'Text',
      title: '文本',
      category: '通用',
      description: '文本组件',
      thumbnail: '/src/assets/thumbnail/antd/antd-text.svg',
      defaultProps: { children: '文本内容' },
      propConfig: {
        children: { type: 'string', label: '文本内容', defaultValue: '文本内容' },
        type: {
          type: 'select', label: '类型',
          options: [
            { label: '默认', value: '' },
            { label: '成功', value: 'success' },
            { label: '警告', value: 'warning' },
            { label: '危险', value: 'danger' },
            { label: '次要', value: 'secondary' },
          ],
        },
        strong: { type: 'boolean', label: '加粗', defaultValue: false },
        italic: { type: 'boolean', label: '斜体', defaultValue: false },
        underline: { type: 'boolean', label: '下划线', defaultValue: false },
        delete: { type: 'boolean', label: '删除线', defaultValue: false },
        code: { type: 'boolean', label: '代码样式', defaultValue: false },
        mark: { type: 'boolean', label: '标记', defaultValue: false },
        disabled: { type: 'boolean', label: '禁用', defaultValue: false },
        copyable: { type: 'boolean', label: '可复制', defaultValue: false },
        ellipsis: { type: 'boolean', label: '省略号', defaultValue: false },
      } satisfies PropConfig,
      supportedEvents: [
        { trigger: 'onClick', label: '点击' },
      ],
    },
  },
  Divider: {
    component: Divider,
    meta: {
      name: 'Divider',
      title: '分割线',
      category: '布局',
      description: '分割线组件',
      thumbnail: '/src/assets/thumbnail/antd/antd-divider.svg',
      defaultProps: {},
      propConfig: {
        children: { type: 'string', label: '文字' },
        type: {
          type: 'select', label: '方向', defaultValue: 'horizontal',
          options: [
            { label: '水平', value: 'horizontal' },
            { label: '垂直', value: 'vertical' },
          ],
        },
        orientation: {
          type: 'select', label: '文字位置', defaultValue: 'center',
          options: [
            { label: '左', value: 'left' },
            { label: '中', value: 'center' },
            { label: '右', value: 'right' },
          ],
        },
        dashed: { type: 'boolean', label: '虚线', defaultValue: false },
        plain: { type: 'boolean', label: '纯文本', defaultValue: false },
      } satisfies PropConfig,
    },
  },
};

export function registerAntdMaterials() {
  componentRegistry.registerLibrary({
    id: 'antd',
    name: 'Ant Design',
    version: '5.x',
    icon: '⚛️',
    enabled: true,
    framework: 'react',
  });

  Object.entries(antdMaterials).forEach(([name, { component, meta }]) => {
    componentRegistry.registerComponent('antd', name, component, {
      ...meta,
      library: 'antd',
      framework: 'react',
    });
  });

  componentRegistry.setCurrentLibrary('antd');
}

export async function registerElementPlusMaterials() {
  componentRegistry.registerLibrary({
    id: 'element-plus',
    name: 'Element Plus',
    version: '2.x',
    icon: '🎨',
    enabled: false,
    framework: 'vue',
  });
}
