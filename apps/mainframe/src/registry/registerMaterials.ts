import { componentRegistry } from './componentRegistry';
import { 
  Button, 
  Input, 
  Card, 
  Typography,
  Divider,
  FloatButton,
} from 'antd';

const { Text } = Typography;

/**
 * 注册 Ant Design 组件
 */
export function registerAntdMaterials() {
  // 注册 Ant Design 组件库
  componentRegistry.registerLibrary({
    id: 'antd',
    name: 'Ant Design',
    version: '5.x',
    icon: '⚛️',
    enabled: true,
    framework: 'react',
  });

  // 注册按钮组件
  componentRegistry.registerComponent(
    'antd',
    'Button',
    Button,
    {
      name: 'Button',
      title: '按钮',
      library: 'antd',
      framework: 'react',
      category: '通用',
      description: '按钮用于开始一个即时操作',
      thumbnail: '/src/assets/thumbnail/antd/antd-btn.svg',
      defaultProps: {
        type: 'default',
        children: '按钮',
      },
    }
  );

  // 注册悬浮按钮组件
  componentRegistry.registerComponent(
    'antd',
    'FloatButton',
    FloatButton,
    {
      name: 'FloatButton',
      title: '悬浮按钮',
      library: 'antd',
      framework: 'react',
      category: '通用',
      description: '悬浮按钮用于开始一个即时操作',
      thumbnail: '/src/assets/thumbnail/antd/antd-float-btn.svg',
    }
  );

  // 注册输入框组件
  componentRegistry.registerComponent(
    'antd',
    'Input',
    Input,
    {
      name: 'Input',
      title: '输入框',
      library: 'antd',
      framework: 'react',
      category: '数据录入',
      description: '通过鼠标或键盘输入内容',
      thumbnail: '/src/assets/thumbnail/antd/antd-input.svg',
      defaultProps: {
        placeholder: '请输入',
      },
    }
  );

  // 注册卡片组件
  componentRegistry.registerComponent(
    'antd',
    'Card',
    Card,
    {
      name: 'Card',
      title: '卡片',
      library: 'antd',
      framework: 'react',
      category: '数据展示',
      description: '通用卡片容器',
      thumbnail: '/src/assets/thumbnail/antd/antd-card.svg',
      defaultProps: {
        title: '卡片标题',
        children: '卡片内容',
      },
    }
  );

  // 注册文本组件
  componentRegistry.registerComponent(
    'antd',
    'Text',
    Text,
    {
      name: 'Text',
      title: '文本',
      library: 'antd',
      framework: 'react',
      category: '通用',
      description: '文本组件',
      thumbnail: '/src/assets/thumbnail/antd/antd-text.svg',
      defaultProps: {
        children: '文本内容',
      },
    }
  );

  // 注册分割线组件
  componentRegistry.registerComponent(
    'antd',
    'Divider',
    Divider,
    {
      name: 'Divider',
      title: '分割线',
      library: 'antd',
      framework: 'react',
      category: '布局',
      description: '分割线组件',
      thumbnail: '/src/assets/thumbnail/antd/antd-divider.svg',
      defaultProps: {},
    }
  );


  // 设置当前组件库为 antd
  componentRegistry.setCurrentLibrary('antd');
}

/**
 * 预留：注册 Element Plus 组件（Vue）
 * 未来接入 Element Plus 时使用
 */
export async function registerElementPlusMaterials() {
  // 注册 Element Plus 组件库
  componentRegistry.registerLibrary({
    id: 'element-plus',
    name: 'Element Plus',
    version: '2.x',
    icon: '🎨',
    enabled: false, // 默认禁用，需要时启用
    framework: 'vue',
  });

  // 未来实现：
  // 1. 动态导入 Element Plus
  // 2. 使用 Vue 组件包装器
  // 3. 注册组件到 componentRegistry
  
  console.log('Element Plus 组件库已注册（预留接口，待实现）');
}

/**
 * 预留：从微应用加载物料
 * 未来需要微应用管理物料时使用
 */
export async function loadMaterialsFromMicroApp(microAppName: string) {
  // 未来实现：
  // 1. 加载微应用
  // 2. 获取物料列表
  // 3. 注册到 componentRegistry
  
  console.log(`从微应用 ${microAppName} 加载物料（预留接口，待实现）`);
}

/**
 * 初始化所有物料
 */
export function initMaterials() {
  // 注册 Ant Design 组件
  registerAntdMaterials();
  
  // 预留 Element Plus 接口（不启用）
  // registerElementPlusMaterials();
  
  console.log('物料初始化完成');
}