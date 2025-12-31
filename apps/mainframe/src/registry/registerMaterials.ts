import { componentRegistry, ComponentMeta } from './componentRegistry';
import { Button, Input, Card, Typography, Divider, FloatButton } from 'antd';
import { ComponentType } from 'react';

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

export function initMaterials() {
  registerAntdMaterials();
}
