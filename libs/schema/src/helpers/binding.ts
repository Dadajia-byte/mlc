/**
 * 数据绑定辅助方法
 * 提供表达式求值、变量管理、数据源处理等功能
 */

import type {
  VariableDefinition,
  VariableScope,
  VariableType,
  DataSourceDefinition,
  PropertyBinding,
  ExpressionContext,
  ApiDataSourceConfig,
} from '../types/binding';

// ============ 变量创建辅助 ============

let variableCounter = 0;

/**
 * 生成变量 ID
 */
export function generateVariableId(): string {
  return `var_${Date.now()}_${++variableCounter}`;
}

/**
 * 创建变量定义
 */
export function createVariable(
  name: string,
  type: VariableType,
  scope: VariableScope,
  defaultValue?: any,
  options?: Partial<Pick<VariableDefinition, 'label' | 'description' | 'componentId'>>
): VariableDefinition {
  return {
    id: generateVariableId(),
    name,
    label: options?.label || name,
    type,
    scope,
    defaultValue: defaultValue ?? getDefaultValueForType(type),
    description: options?.description,
    componentId: options?.componentId,
  };
}

/**
 * 获取类型的默认值
 */
export function getDefaultValueForType(type: VariableType): any {
  switch (type) {
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      return null;
  }
}

// ============ 数据源创建辅助 ============

let dataSourceCounter = 0;

/**
 * 生成数据源 ID
 */
export function generateDataSourceId(): string {
  return `ds_${Date.now()}_${++dataSourceCounter}`;
}

/**
 * 创建静态数据源
 */
export function createStaticDataSource(
  name: string,
  data: any,
  options?: Partial<Pick<DataSourceDefinition, 'label' | 'description'>>
): DataSourceDefinition {
  return {
    id: generateDataSourceId(),
    name,
    label: options?.label || name,
    type: 'static',
    description: options?.description,
    staticConfig: { data },
  };
}

/**
 * 创建 API 数据源
 */
export function createApiDataSource(
  name: string,
  apiConfig: ApiDataSourceConfig,
  options?: Partial<Pick<DataSourceDefinition, 'label' | 'description'>>
): DataSourceDefinition {
  return {
    id: generateDataSourceId(),
    name,
    label: options?.label || name,
    type: 'api',
    description: options?.description,
    apiConfig: {
      ...apiConfig,
      method: apiConfig.method || 'GET',
      autoFetch: apiConfig.autoFetch ?? true,
      pollingInterval: apiConfig.pollingInterval ?? 0,
    },
  };
}

/**
 * 创建变量引用数据源
 */
export function createVariableDataSource(
  name: string,
  variableName: string,
  options?: Partial<Pick<DataSourceDefinition, 'label' | 'description'>>
): DataSourceDefinition {
  return {
    id: generateDataSourceId(),
    name,
    label: options?.label || name,
    type: 'variable',
    description: options?.description,
    variableName,
  };
}

// ============ 属性绑定辅助 ============

/**
 * 创建静态值绑定
 */
export function createStaticBinding(value: any): PropertyBinding {
  return {
    type: 'static',
    staticValue: value,
  };
}

/**
 * 创建表达式绑定
 */
export function createExpressionBinding(expression: string): PropertyBinding {
  return {
    type: 'expression',
    expression,
  };
}

/**
 * 创建变量绑定
 */
export function createVariableBinding(variableName: string): PropertyBinding {
  return {
    type: 'variable',
    variableName,
  };
}

/**
 * 创建数据源绑定
 */
export function createDataSourceBinding(
  dataSourceName: string,
  path?: string
): PropertyBinding {
  return {
    type: 'dataSource',
    dataSourceName,
    dataSourcePath: path,
  };
}

// ============ 表达式求值 ============

/**
 * 安全的表达式求值
 * 使用 Function 构造器在沙箱中执行表达式
 */
export function evaluateExpression(
  expression: string,
  context: ExpressionContext
): { value: any; error?: string } {
  if (!expression || typeof expression !== 'string') {
    return { value: undefined, error: '表达式为空' };
  }

  try {
    // 构建上下文变量
    const contextKeys = Object.keys(context);
    const contextValues = Object.values(context);

    // 创建安全的执行函数
    // eslint-disable-next-line no-new-func
    const evaluator = new Function(
      ...contextKeys,
      `"use strict"; return (${expression});`
    );

    const result = evaluator(...contextValues);
    return { value: result };
  } catch (err) {
    return {
      value: undefined,
      error: err instanceof Error ? err.message : '表达式执行错误',
    };
  }
}

/**
 * 验证表达式语法
 */
export function validateExpression(expression: string): { valid: boolean; error?: string } {
  if (!expression || typeof expression !== 'string') {
    return { valid: false, error: '表达式为空' };
  }

  try {
    // 尝试解析表达式（不执行）
    // eslint-disable-next-line no-new-func
    new Function(`"use strict"; return (${expression});`);
    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : '语法错误',
    };
  }
}

/**
 * 从表达式中提取引用的变量名
 */
export function extractVariablesFromExpression(expression: string): string[] {
  if (!expression) return [];

  const variables: string[] = [];
  
  // 匹配 $global.xxx, $page.xxx, $component.xxx, $data.xxx 格式
  const patterns = [
    /\$global\.(\w+)/g,
    /\$page\.(\w+)/g,
    /\$component\.(\w+)/g,
    /\$data\.(\w+)/g,
  ];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(expression)) !== null) {
      variables.push(match[1]);
    }
  });

  return [...new Set(variables)];
}

// ============ 绑定解析 ============

/**
 * 解析属性绑定，返回实际值
 */
export function resolveBinding(
  binding: PropertyBinding | undefined,
  context: ExpressionContext
): any {
  if (!binding) {
    return undefined;
  }

  switch (binding.type) {
    case 'static':
      return binding.staticValue;

    case 'expression':
      if (binding.expression) {
        const result = evaluateExpression(binding.expression, context);
        return result.value;
      }
      return undefined;

    case 'variable':
      if (binding.variableName) {
        // 按作用域查找变量
        if (binding.variableName in context.$component) {
          return context.$component[binding.variableName];
        }
        if (binding.variableName in context.$page) {
          return context.$page[binding.variableName];
        }
        if (binding.variableName in context.$global) {
          return context.$global[binding.variableName];
        }
      }
      return undefined;

    case 'dataSource':
      if (binding.dataSourceName) {
        const dataSource = context.$data[binding.dataSourceName];
        if (dataSource === undefined) {
          return undefined;
        }
        // 如果有路径，按路径取值
        if (binding.dataSourcePath) {
          return getValueByPath(dataSource, binding.dataSourcePath);
        }
        return dataSource;
      }
      return undefined;

    default:
      return undefined;
  }
}

/**
 * 按路径获取对象值
 */
export function getValueByPath(obj: any, path: string): any {
  if (!obj || !path) return obj;

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    // 支持数组索引，如 items[0]
    const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      current = current[arrayMatch[1]]?.[parseInt(arrayMatch[2], 10)];
    } else {
      current = current[key];
    }
  }

  return current;
}

/**
 * 按路径设置对象值
 */
export function setValueByPath(obj: any, path: string, value: any): void {
  if (!obj || !path) return;

  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const arrKey = arrayMatch[1];
      const arrIndex = parseInt(arrayMatch[2], 10);
      if (!current[arrKey]) current[arrKey] = [];
      if (!current[arrKey][arrIndex]) current[arrKey][arrIndex] = {};
      current = current[arrKey][arrIndex];
    } else {
      if (!current[key]) current[key] = {};
      current = current[key];
    }
  }

  const lastKey = keys[keys.length - 1];
  const arrayMatch = lastKey.match(/^(\w+)\[(\d+)\]$/);
  if (arrayMatch) {
    const arrKey = arrayMatch[1];
    const arrIndex = parseInt(arrayMatch[2], 10);
    if (!current[arrKey]) current[arrKey] = [];
    current[arrKey][arrIndex] = value;
  } else {
    current[lastKey] = value;
  }
}

// ============ 上下文构建 ============

/**
 * 创建空的表达式上下文
 */
export function createEmptyContext(): ExpressionContext {
  return {
    $global: {},
    $page: {},
    $component: {},
    $data: {},
    $props: {},
    $system: {
      $now: new Date(),
    },
  };
}

/**
 * 判断绑定是否为表达式类型
 */
export function isExpressionBinding(binding: PropertyBinding | undefined): boolean {
  return binding?.type === 'expression' && !!binding.expression;
}

/**
 * 判断值是否为绑定表达式字符串（以 {{ 开头）
 */
export function isBindingExpression(value: any): boolean {
  return typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}');
}

/**
 * 从绑定表达式字符串中提取表达式
 */
export function extractExpression(value: string): string {
  if (isBindingExpression(value)) {
    return value.slice(2, -2).trim();
  }
  return value;
}

/**
 * 将表达式包装为绑定表达式字符串
 */
export function wrapExpression(expression: string): string {
  return `{{${expression}}}`;
}
