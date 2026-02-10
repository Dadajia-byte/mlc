import type { ComponentSchema } from './component';
import type { VariableDefinition, DataSourceDefinition } from './binding';

/**
 * 画布整体 Schema
 */
export interface CanvasSchema {
  /** 画布唯一 ID */
  id: string;
  /** 画布名称 */
  name: string;
  /** 画布宽度 */
  width: number;
  /** 画布高度 */
  height: number;
  /** 组件列表 */
  components: ComponentSchema[];
  /** 画布配置 */
  config?: CanvasConfig;
  /** 全局变量定义 */
  globalVariables?: VariableDefinition[];
  /** 页面变量定义 */
  pageVariables?: VariableDefinition[];
  /** 数据源定义 */
  dataSources?: DataSourceDefinition[];
}

/**
 * 画布配置
 */
export interface CanvasConfig {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  backgroundAttachment?: string;
  backgroundOrigin?: string;
  grid?: GridConfig;
}

/**
 * 网格配置
 */
export interface GridConfig {
  enabled?: boolean;
  size?: number;
  color?: string;
}

/**
 * 编辑器工具模式
 */
export enum ToolMode {
  /** 鼠标模式 - 可以框选组件、选择组件等 */
  MOUSE = 'mouse',
  /** 抓手模式 - 只能拖拽画布 */
  HAND = 'hand',
}
