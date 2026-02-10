/**
 * 数据绑定类型定义
 * 支持变量系统、数据源绑定、表达式编辑
 */

/**
 * 变量作用域
 */
export type VariableScope = 'global' | 'page' | 'component';

/**
 * 变量类型
 */
export type VariableType = 'string' | 'number' | 'boolean' | 'array' | 'object';

/**
 * 变量定义
 */
export interface VariableDefinition {
  /** 变量唯一标识 */
  id: string;
  /** 变量名称（用于表达式引用） */
  name: string;
  /** 显示名称 */
  label: string;
  /** 变量类型 */
  type: VariableType;
  /** 作用域 */
  scope: VariableScope;
  /** 默认值 */
  defaultValue: any;
  /** 描述 */
  description?: string;
  /** 所属组件ID（仅 component 作用域） */
  componentId?: string;
}

// ============ 数据源 ============

/**
 * 数据源类型
 */
export type DataSourceType = 'static' | 'api' | 'variable';

/**
 * HTTP 请求方法
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * API 数据源配置
 */
export interface ApiDataSourceConfig {
  /** 请求 URL（支持表达式） */
  url: string;
  /** 请求方法 */
  method: HttpMethod;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 请求参数（URL 参数） */
  params?: Record<string, any>;
  /** 请求体 */
  body?: any;
  /** 响应数据路径（如 data.list） */
  responsePath?: string;
  /** 是否自动请求 */
  autoFetch?: boolean;
  /** 轮询间隔（毫秒，0 表示不轮询） */
  pollingInterval?: number;
  /** 依赖的变量（变量变化时重新请求） */
  dependencies?: string[];
}

/**
 * 静态数据源配置
 */
export interface StaticDataSourceConfig {
  /** 静态数据 */
  data: any;
}

/**
 * 数据源定义
 */
export interface DataSourceDefinition {
  /** 数据源唯一标识 */
  id: string;
  /** 数据源名称（用于表达式引用） */
  name: string;
  /** 显示名称 */
  label: string;
  /** 数据源类型 */
  type: DataSourceType;
  /** 描述 */
  description?: string;
  /** API 配置（type 为 api 时） */
  apiConfig?: ApiDataSourceConfig;
  /** 静态数据配置（type 为 static 时） */
  staticConfig?: StaticDataSourceConfig;
  /** 关联的变量名（type 为 variable 时） */
  variableName?: string;
}

// ============ 表达式绑定 ============

/**
 * 绑定类型
 */
export type BindingType = 'static' | 'expression' | 'variable' | 'dataSource';

/**
 * 属性绑定配置
 */
export interface PropertyBinding {
  /** 绑定类型 */
  type: BindingType;
  /** 静态值（type 为 static 时） */
  staticValue?: any;
  /** 表达式（type 为 expression 时） */
  expression?: string;
  /** 变量名（type 为 variable 时） */
  variableName?: string;
  /** 数据源名称（type 为 dataSource 时） */
  dataSourceName?: string;
  /** 数据源字段路径 */
  dataSourcePath?: string;
}

/**
 * 组件绑定配置（存储在组件 schema 中）
 */
export interface ComponentBindings {
  /** 属性绑定映射：propKey -> PropertyBinding */
  props?: Record<string, PropertyBinding>;
  /** 样式绑定映射：styleKey -> PropertyBinding */
  styles?: Record<string, PropertyBinding>;
  /** 可见性绑定 */
  visible?: PropertyBinding;
  /** 禁用状态绑定 */
  disabled?: PropertyBinding;
}

// ============ 表达式上下文 ============

/**
 * 表达式执行上下文
 */
export interface ExpressionContext {
  /** 全局变量 */
  $global: Record<string, any>;
  /** 页面变量 */
  $page: Record<string, any>;
  /** 组件变量 */
  $component: Record<string, any>;
  /** 数据源数据 */
  $data: Record<string, any>;
  /** 当前组件 props */
  $props: Record<string, any>;
  /** 系统变量（如 $index 用于循环） */
  $system: {
    /** 当前循环索引 */
    $index?: number;
    /** 当前循环项 */
    $item?: any;
    /** 当前用户 */
    $user?: any;
    /** 当前时间 */
    $now?: Date;
  };
}

// ============ 画布级别数据配置 ============

/**
 * 画布数据配置（扩展 CanvasSchema）
 */
export interface CanvasDataConfig {
  /** 全局变量定义 */
  globalVariables?: VariableDefinition[];
  /** 页面变量定义 */
  pageVariables?: VariableDefinition[];
  /** 数据源定义 */
  dataSources?: DataSourceDefinition[];
}
