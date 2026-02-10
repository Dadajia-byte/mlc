import { ComponentType } from 'react';
import { Button, Input, Card, Typography, Divider, FloatButton } from 'antd';
import type { ComponentMapping } from '@mlc/renderer-core';
import { antdMaterialsMeta } from '../meta/antd';

const { Text } = Typography;

/**
 * Antd 组件映射表
 */
const antdComponentMap: Record<string, ComponentType<any>> = {
  Button,
  FloatButton,
  Input,
  Card,
  Text,
  Divider,
};

/**
 * 获取 Antd 组件映射（用于 React 渲染器）
 */
export function getAntdReactMappings(): ComponentMapping[] {
  return antdMaterialsMeta.map((meta) => ({
    type: meta.name,
    library: 'antd',
    component: antdComponentMap[meta.name],
    meta,
  })).filter((m) => m.component); // 过滤掉没有实现的组件
}

/**
 * 注册 Antd 组件到 React 注册表
 */
export function registerAntdToReactRegistry(registry: {
  register: (mapping: ComponentMapping) => void;
}): void {
  getAntdReactMappings().forEach((mapping) => {
    registry.register(mapping);
  });
}
