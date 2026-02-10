import type { EventBinding } from './event';
import type { ComponentBindings, VariableDefinition } from './binding';

/**
 * 组件库类型
 */
export type ComponentLibrary = 'antd' | 'element-plus' | 'custom';

/**
 * 组件框架类型
 */
export type ComponentFramework = 'react' | 'vue';

/**
 * 组件 Schema - 描述一个组件实例的完整数据结构
 */
export interface ComponentSchema {
  /** 组件唯一 ID */
  id: string;
  /** 组件类型（对应组件库中的组件名） */
  type: string;
  /** 所属组件库 */
  library: ComponentLibrary;
  /** 组件属性 */
  props: Record<string, any>;
  /** 子组件列表 */
  children: ComponentSchema[];
  /** 父组件 ID */
  parentId?: string;
  /** 是否为分组容器 */
  isGroup?: boolean;
  /** 样式配置 */
  style?: ComponentStyle;
  /** 编辑器相关配置 */
  editor?: EditorConfig;
  /** 事件绑定列表 */
  events?: EventBinding[];
  /** 数据绑定配置 */
  bindings?: ComponentBindings;
  /** 组件级别变量定义 */
  variables?: VariableDefinition[];
}

/**
 * 组件样式
 */
export interface ComponentStyle {
  position?: 'absolute' | 'relative' | 'fixed';
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  opacity?: number;
  borderRadius?: number;
  backgroundColor?: string;
  [key: string]: any;
}

/**
 * 编辑器配置
 */
export interface EditorConfig {
  /** 是否选中 */
  selected?: boolean;
  /** 是否锁定 */
  locked?: boolean;
  /** 是否可见 */
  visible?: boolean;
}
