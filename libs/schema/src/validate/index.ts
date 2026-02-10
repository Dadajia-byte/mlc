import type { ComponentSchema, EventBinding } from '../types';

/**
 * 校验结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
}

/**
 * 校验组件 Schema
 */
export function validateComponent(schema: any, path = 'root'): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!schema || typeof schema !== 'object') {
    errors.push({ path, message: '组件 Schema 必须是一个对象' });
    return errors;
  }

  if (!schema.id || typeof schema.id !== 'string') {
    errors.push({ path: `${path}.id`, message: '组件 id 必须是非空字符串' });
  }

  if (!schema.type || typeof schema.type !== 'string') {
    errors.push({ path: `${path}.type`, message: '组件 type 必须是非空字符串' });
  }

  if (!schema.library || !['antd', 'element-plus', 'custom'].includes(schema.library)) {
    errors.push({ path: `${path}.library`, message: 'library 必须是 antd / element-plus / custom 之一' });
  }

  if (schema.props !== undefined && (typeof schema.props !== 'object' || schema.props === null)) {
    errors.push({ path: `${path}.props`, message: 'props 必须是一个对象' });
  }

  if (schema.style !== undefined && (typeof schema.style !== 'object' || schema.style === null)) {
    errors.push({ path: `${path}.style`, message: 'style 必须是一个对象' });
  }

  // 校验事件绑定
  if (schema.events) {
    if (!Array.isArray(schema.events)) {
      errors.push({ path: `${path}.events`, message: 'events 必须是数组' });
    } else {
      schema.events.forEach((evt: EventBinding, i: number) => {
        errors.push(...validateEventBinding(evt, `${path}.events[${i}]`));
      });
    }
  }

  // 递归校验子组件
  if (schema.children) {
    if (!Array.isArray(schema.children)) {
      errors.push({ path: `${path}.children`, message: 'children 必须是数组' });
    } else {
      schema.children.forEach((child: ComponentSchema, i: number) => {
        errors.push(...validateComponent(child, `${path}.children[${i}]`));
      });
    }
  }

  return errors;
}

/**
 * 校验事件绑定
 */
export function validateEventBinding(binding: any, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!binding.id || typeof binding.id !== 'string') {
    errors.push({ path: `${path}.id`, message: '事件绑定 id 必须是非空字符串' });
  }

  if (!binding.trigger || typeof binding.trigger !== 'string') {
    errors.push({ path: `${path}.trigger`, message: 'trigger 必须是非空字符串' });
  }

  const validActions = ['navigate', 'openUrl', 'showMessage', 'showModal', 'hideModal', 'setState', 'callApi', 'custom'];
  if (!binding.actionType || !validActions.includes(binding.actionType)) {
    errors.push({ path: `${path}.actionType`, message: `actionType 必须是 ${validActions.join(' / ')} 之一` });
  }

  if (!binding.config || typeof binding.config !== 'object') {
    errors.push({ path: `${path}.config`, message: 'config 必须是一个对象' });
  }

  return errors;
}

/**
 * 校验画布 Schema
 */
export function validateCanvas(schema: any): ValidationResult {
  const errors: ValidationError[] = [];

  if (!schema || typeof schema !== 'object') {
    return { valid: false, errors: [{ path: 'canvas', message: '画布 Schema 必须是一个对象' }] };
  }

  if (!schema.id || typeof schema.id !== 'string') {
    errors.push({ path: 'canvas.id', message: '画布 id 必须是非空字符串' });
  }

  if (typeof schema.width !== 'number' || schema.width <= 0) {
    errors.push({ path: 'canvas.width', message: 'width 必须是正数' });
  }

  if (typeof schema.height !== 'number' || schema.height <= 0) {
    errors.push({ path: 'canvas.height', message: 'height 必须是正数' });
  }

  if (!Array.isArray(schema.components)) {
    errors.push({ path: 'canvas.components', message: 'components 必须是数组' });
  } else {
    schema.components.forEach((comp: ComponentSchema, i: number) => {
      errors.push(...validateComponent(comp, `canvas.components[${i}]`));
    });
  }

  return { valid: errors.length === 0, errors };
}
