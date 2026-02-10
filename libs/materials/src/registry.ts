import { ComponentType } from 'react';
import type { ComponentLibrary, ComponentFramework, PropConfig, EventDeclaration } from '@mlc/schema';

/**
 * 组件元数据
 */
export interface ComponentMeta {
  name: string;
  title: string;
  library: ComponentLibrary;
  framework: ComponentFramework;
  icon?: string;
  category: string;
  description?: string;
  defaultProps?: Record<string, any>;
  props?: Record<string, any>;
  /** 属性配置面板定义（驱动 RightBar 动态表单） */
  propConfig?: PropConfig;
  defaultStyle?: Record<string, any>;
  styleConfig?: Record<string, any>;
  thumbnail?: string;
  /** 组件支持的事件声明 */
  supportedEvents?: EventDeclaration[];
}

/**
 * 组件注册项
 */
export interface ComponentRegistryItem {
  component: ComponentType<any>;
  meta: ComponentMeta;
}

/**
 * 组件库配置
 */
export interface ComponentLibraryConfig {
  id: ComponentLibrary;
  name: string;
  version?: string;
  icon?: string;
  enabled?: boolean;
  framework?: ComponentFramework;
  components: Map<string, ComponentRegistryItem>;
}

/**
 * 组件注册表管理器
 */
class ComponentRegistryManager {
  private libraries: Map<ComponentLibrary, ComponentLibraryConfig> = new Map();
  private currentLibrary: ComponentLibrary | null = null;

  /**
   * 注册组件库
   */
  registerLibrary(config: Omit<ComponentLibraryConfig, 'components'>) {
    if (!this.libraries.has(config.id)) {
      this.libraries.set(config.id, {
        ...config,
        components: new Map(),
      });
    }
    return this;
  }

  /**
   * 注册组件到指定组件库
   */
  registerComponent(
    library: ComponentLibrary,
    name: string,
    component: ComponentType<any>,
    meta: ComponentMeta
  ): ComponentRegistryManager {
    const lib = this.libraries.get(library);
    if (!lib) {
      console.warn(`Component library ${library} not found`);
      return this;
    }
    if (lib.components.has(name)) {
      console.warn(`Component ${name} already registered in library ${library}`);
      return this;
    }
    lib.components.set(name, { component, meta });
    return this;
  }

  /**
   * 批量注册组件
   */
  registerComponents(
    library: ComponentLibrary,
    components: Array<{
      name: string;
      component: ComponentType<any>;
      meta: ComponentMeta;
    }>
  ): ComponentRegistryManager {
    components.forEach(({ name, component, meta }) => {
      this.registerComponent(library, name, component, meta);
    });
    return this;
  }

  /**
   * 获取组件
   */
  getComponent(library: ComponentLibrary, name: string) {
    return this.libraries.get(library)?.components.get(name);
  }

  /**
   * 获取当前组件库的所有组件
   */
  getCurrentLibraryComponents() {
    if (!this.currentLibrary) return [];
    const lib = this.libraries.get(this.currentLibrary);
    return lib ? Array.from(lib.components.values()) : [];
  }

  /**
   * 获取所有组件元数据
   */
  getAllComponentsMeta(library?: ComponentLibrary) {
    if (library) {
      const lib = this.libraries.get(library);
      return lib
        ? Array.from(lib.components.values()).map(({ meta }) => meta)
        : [];
    }
    const allMeta: ComponentMeta[] = [];
    this.libraries.forEach((lib) => {
      if (lib.enabled) {
        lib.components.forEach(({ meta }) => {
          allMeta.push(meta);
        });
      }
    });
    return allMeta;
  }

  /**
   * 设置当前使用的组件库
   */
  setCurrentLibrary(library: ComponentLibrary) {
    if (this.libraries.has(library)) {
      this.currentLibrary = library;
    }
    return this;
  }

  /**
   * 获取当前组件库
   */
  getCurrentLibrary() {
    return this.currentLibrary;
  }

  /**
   * 获取所有组件库配置
   */
  getLibraries() {
    return Array.from(this.libraries.values());
  }

  /**
   * 启用/禁用组件库
   */
  toggleLibrary(library: ComponentLibrary, enabled: boolean) {
    const lib = this.libraries.get(library);
    if (lib) {
      lib.enabled = enabled;
    }
    return this;
  }
}

// 单例导出
export const componentRegistry = new ComponentRegistryManager();

// 便捷方法
export const registerComponent = (
  library: ComponentLibrary,
  name: string,
  component: ComponentType<any>,
  meta: ComponentMeta
) => componentRegistry.registerComponent(library, name, component, meta);

export const getComponent = (library: ComponentLibrary, name: string) =>
  componentRegistry.getComponent(library, name);

export const getAllComponentsMeta = (library?: ComponentLibrary) =>
  componentRegistry.getAllComponentsMeta(library);
