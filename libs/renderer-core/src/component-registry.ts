import type { ComponentMapping, IComponentRegistry, ComponentMetadata } from './types';

/**
 * 通用组件注册表实现
 */
export class ComponentRegistry implements IComponentRegistry {
  private components: Map<string, ComponentMapping> = new Map();

  /**
   * 生成组件键
   */
  private getKey(library: string, type: string): string {
    return `${library}:${type}`;
  }

  /**
   * 注册组件
   */
  register(mapping: ComponentMapping): void {
    const key = this.getKey(mapping.library, mapping.type);
    if (this.components.has(key)) {
      console.warn(`[ComponentRegistry] Component ${key} already registered, overwriting.`);
    }
    this.components.set(key, mapping);
  }

  /**
   * 批量注册组件
   */
  registerMany(mappings: ComponentMapping[]): void {
    mappings.forEach((m) => this.register(m));
  }

  /**
   * 获取组件
   */
  get(library: string, type: string): ComponentMapping | undefined {
    return this.components.get(this.getKey(library, type));
  }

  /**
   * 检查组件是否存在
   */
  has(library: string, type: string): boolean {
    return this.components.has(this.getKey(library, type));
  }

  /**
   * 获取所有组件
   */
  getAll(): ComponentMapping[] {
    return Array.from(this.components.values());
  }

  /**
   * 按库获取组件
   */
  getByLibrary(library: string): ComponentMapping[] {
    return this.getAll().filter((m) => m.library === library);
  }

  /**
   * 获取所有已注册的库
   */
  getLibraries(): string[] {
    const libs = new Set<string>();
    this.components.forEach((m) => libs.add(m.library));
    return Array.from(libs);
  }

  /**
   * 获取所有组件元数据
   */
  getAllMetadata(): ComponentMetadata[] {
    return this.getAll()
      .map((m) => m.meta)
      .filter((m): m is ComponentMetadata => !!m);
  }

  /**
   * 按类别获取元数据
   */
  getMetadataByCategory(category: string): ComponentMetadata[] {
    return this.getAllMetadata().filter((m) => m.category === category);
  }

  /**
   * 获取所有类别
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    this.getAllMetadata().forEach((m) => categories.add(m.category));
    return Array.from(categories);
  }

  /**
   * 移除组件
   */
  remove(library: string, type: string): boolean {
    return this.components.delete(this.getKey(library, type));
  }

  /**
   * 清空注册表
   */
  clear(): void {
    this.components.clear();
  }

  /**
   * 获取组件数量
   */
  size(): number {
    return this.components.size;
  }
}

/**
 * 创建组件注册表
 */
export function createComponentRegistry(): IComponentRegistry {
  return new ComponentRegistry();
}
