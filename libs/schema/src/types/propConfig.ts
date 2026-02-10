/**
 * 属性配置字段类型
 */
export type PropFieldType =
  | 'string'     // 文本输入
  | 'number'     // 数字输入
  | 'boolean'    // 开关
  | 'color'      // 颜色选择
  | 'select'     // 下拉选择
  | 'radio'      // 单选
  | 'slider'     // 滑块
  | 'textarea'   // 多行文本
  | 'json'       // JSON 编辑
  | 'image'      // 图片上传
  | 'icon';      // 图标选择

/**
 * 下拉选项
 */
export interface SelectOption {
  label: string;
  value: string | number | boolean;
}

/**
 * 单个属性字段配置
 */
export interface PropFieldConfig {
  /** 字段类型 */
  type: PropFieldType;
  /** 显示标签 */
  label: string;
  /** 默认值 */
  defaultValue?: any;
  /** 描述/提示 */
  description?: string;
  /** 是否必填 */
  required?: boolean;
  /** 占位符 */
  placeholder?: string;

  // === 数字相关 ===
  /** 最小值 (number / slider) */
  min?: number;
  /** 最大值 (number / slider) */
  max?: number;
  /** 步长 (number / slider) */
  step?: number;
  /** 单位后缀 */
  suffix?: string;

  // === 选择相关 ===
  /** 选项 (select / radio) */
  options?: SelectOption[];

  // === 分组 ===
  /** 所属分组 */
  group?: string;
}

/**
 * 组件属性配置（key 为 prop name）
 */
export type PropConfig = Record<string, PropFieldConfig>;

/**
 * 属性分组定义
 */
export interface PropGroup {
  /** 分组 key */
  key: string;
  /** 分组显示名 */
  title: string;
  /** 排序权重（越大越靠后） */
  order?: number;
}
