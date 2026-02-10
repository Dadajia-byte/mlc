import type { ComponentSchema, CanvasSchema } from '@mlc/schema';
import type { SchemaVisitor } from './types';

/**
 * Schema 解析器 - 提供 Schema 遍历和查询能力
 */
export class SchemaParser {
  private schema: CanvasSchema;

  constructor(schema: CanvasSchema) {
    this.schema = schema;
  }

  /**
   * 获取 Canvas Schema
   */
  getCanvas(): CanvasSchema {
    return this.schema;
  }

  /**
   * 获取所有组件
   */
  getComponents(): ComponentSchema[] {
    return this.schema.components || [];
  }

  /**
   * 深度优先遍历所有组件
   */
  traverse(visitor: SchemaVisitor): void {
    const walk = (components: ComponentSchema[], parent?: ComponentSchema) => {
      for (const comp of components) {
        visitor.enter?.(comp, parent);
        if (comp.children?.length) {
          walk(comp.children, comp);
        }
        visitor.leave?.(comp, parent);
      }
    };
    walk(this.schema.components || []);
  }

  /**
   * 根据 ID 查找组件
   */
  findById(id: string): ComponentSchema | undefined {
    let found: ComponentSchema | undefined;
    this.traverse({
      enter: (comp) => {
        if (comp.id === id) {
          found = comp;
        }
      },
    });
    return found;
  }

  /**
   * 根据类型查找组件
   */
  findByType(type: string): ComponentSchema[] {
    const results: ComponentSchema[] = [];
    this.traverse({
      enter: (comp) => {
        if (comp.type === type) {
          results.push(comp);
        }
      },
    });
    return results;
  }

  /**
   * 获取组件的父组件
   */
  findParent(id: string): ComponentSchema | undefined {
    let parent: ComponentSchema | undefined;
    this.traverse({
      enter: (comp, p) => {
        if (comp.id === id) {
          parent = p;
        }
      },
    });
    return parent;
  }

  /**
   * 获取组件的所有祖先
   */
  getAncestors(id: string): ComponentSchema[] {
    const ancestors: ComponentSchema[] = [];
    let current = this.findParent(id);
    while (current) {
      ancestors.push(current);
      current = this.findParent(current.id);
    }
    return ancestors;
  }

  /**
   * 获取组件的所有后代
   */
  getDescendants(id: string): ComponentSchema[] {
    const target = this.findById(id);
    if (!target) return [];
    
    const descendants: ComponentSchema[] = [];
    const collect = (components: ComponentSchema[]) => {
      for (const comp of components) {
        descendants.push(comp);
        if (comp.children?.length) {
          collect(comp.children);
        }
      }
    };
    collect(target.children || []);
    return descendants;
  }

  /**
   * 获取扁平化的组件列表
   */
  flatten(): ComponentSchema[] {
    const result: ComponentSchema[] = [];
    this.traverse({
      enter: (comp) => {
        result.push(comp);
      },
    });
    return result;
  }

  /**
   * 统计组件数量
   */
  count(): number {
    let count = 0;
    this.traverse({ enter: () => count++ });
    return count;
  }

  /**
   * 获取组件路径（从根到目标的 ID 数组）
   */
  getPath(id: string): string[] {
    const ancestors = this.getAncestors(id);
    return [...ancestors.reverse().map((c) => c.id), id];
  }

  /**
   * 更新 Schema（返回新实例）
   */
  update(updater: (schema: CanvasSchema) => CanvasSchema): SchemaParser {
    return new SchemaParser(updater(this.schema));
  }
}

/**
 * 创建 Schema 解析器
 */
export function createSchemaParser(schema: CanvasSchema): SchemaParser {
  return new SchemaParser(schema);
}
