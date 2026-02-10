import type { PropConfig, EventDeclaration } from '@mlc/schema';
import type { ComponentMetadata } from '@mlc/renderer-core';

/**
 * 物料元数据 - 纯数据，不包含组件实现
 */
export interface MaterialMeta extends ComponentMetadata {
  /** 组件库标识 */
  library: string;
  /** 框架标识（react/vue） */
  framework?: string;
  /** 属性配置 */
  propConfig?: PropConfig;
  /** 支持的事件 */
  supportedEvents?: EventDeclaration[];
}

/**
 * 物料库配置
 */
export interface MaterialLibraryConfig {
  /** 库 ID */
  id: string;
  /** 库名称 */
  name: string;
  /** 版本 */
  version?: string;
  /** 图标 */
  icon?: string;
  /** 是否启用 */
  enabled?: boolean;
  /** 框架 */
  framework?: 'react' | 'vue';
  /** 物料列表 */
  materials: MaterialMeta[];
}
