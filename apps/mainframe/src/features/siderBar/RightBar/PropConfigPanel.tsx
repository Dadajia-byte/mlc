import { useCallback, useMemo } from 'react';
import { InputNumber, Input, Switch, ColorPicker, Select, Slider, Radio } from 'antd';
import type { PropConfig, PropFieldConfig, PropertyBinding, ComponentBindings } from '@mlc/schema';
import ExpressionEditor from './ExpressionEditor';
import './PropConfigPanel.scss';

interface PropConfigPanelProps {
  propConfig: PropConfig;
  values: Record<string, any>;
  bindings?: ComponentBindings;
  componentId?: string;
  onChange: (key: string, value: any) => void;
  onBindingChange?: (key: string, binding: PropertyBinding | undefined) => void;
  /** 是否显示绑定按钮 */
  showBinding?: boolean;
}

const PropConfigPanel = ({
  propConfig,
  values,
  bindings,
  componentId,
  onChange,
  onBindingChange,
  showBinding = true,
}: PropConfigPanelProps) => {
  // 按 group 分组
  const grouped = groupBySection(propConfig);

  return (
    <div className="prop-config-panel">
      {grouped.map(({ group, fields }) => (
        <div key={group} className="prop-config-group">
          {group && <div className="prop-config-group-title">{group}</div>}
          <div className="prop-config-fields">
            {fields.map(([key, config]) => (
              <PropField
                key={key}
                propKey={key}
                config={config}
                value={values[key]}
                binding={bindings?.props?.[key]}
                componentId={componentId}
                onChange={onChange}
                onBindingChange={onBindingChange}
                showBinding={showBinding}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

interface PropFieldProps {
  propKey: string;
  config: PropFieldConfig;
  value: any;
  binding?: PropertyBinding;
  componentId?: string;
  onChange: (key: string, value: any) => void;
  onBindingChange?: (key: string, binding: PropertyBinding | undefined) => void;
  showBinding?: boolean;
}

const PropField = ({
  propKey,
  config,
  value,
  binding,
  componentId,
  onChange,
  onBindingChange,
  showBinding,
}: PropFieldProps) => {
  const handleChange = useCallback((val: any) => {
    onChange(propKey, val);
  }, [propKey, onChange]);

  const handleBindingChange = useCallback((newBinding: PropertyBinding | undefined) => {
    onBindingChange?.(propKey, newBinding);
  }, [propKey, onBindingChange]);

  // 判断是否已绑定（非 static）
  const isBound = binding && binding.type !== 'static';

  // 获取值类型
  const valueType = useMemo(() => {
    switch (config.type) {
      case 'number':
      case 'slider':
        return 'number';
      case 'boolean':
        return 'boolean';
      default:
        return 'string';
    }
  }, [config.type]);

  const renderField = () => {
    // 如果已绑定，显示绑定状态而不是输入框
    if (isBound) {
      return (
        <div className="prop-field-bound-placeholder">
          已绑定
        </div>
      );
    }

    switch (config.type) {
      case 'string':
        return (
          <Input
            size="small"
            value={value ?? config.defaultValue ?? ''}
            placeholder={config.placeholder}
            onChange={(e) => handleChange(e.target.value)}
          />
        );

      case 'textarea':
        return (
          <Input.TextArea
            size="small"
            value={value ?? config.defaultValue ?? ''}
            placeholder={config.placeholder}
            rows={2}
            onChange={(e) => handleChange(e.target.value)}
          />
        );

      case 'number':
        return (
          <InputNumber
            size="small"
            value={value ?? config.defaultValue}
            placeholder={config.placeholder}
            min={config.min}
            max={config.max}
            step={config.step ?? 1}
            onChange={handleChange}
            addonAfter={config.suffix}
            style={{ width: '100%' }}
          />
        );

      case 'boolean':
        return (
          <Switch
            size="small"
            checked={value ?? config.defaultValue ?? false}
            onChange={handleChange}
          />
        );

      case 'color':
        return (
          <ColorPicker
            size="small"
            value={value || undefined}
            onChange={(_, hex) => handleChange(hex)}
            allowClear
          />
        );

      case 'select':
        return (
          <Select
            size="small"
            value={value ?? config.defaultValue}
            placeholder={config.placeholder}
            onChange={handleChange}
            options={config.options?.map(opt => ({ label: opt.label, value: opt.value }))}
            style={{ width: '100%' }}
          />
        );

      case 'radio':
        return (
          <Radio.Group
            size="small"
            value={value ?? config.defaultValue}
            onChange={(e) => handleChange(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            options={config.options?.map(opt => ({ label: opt.label, value: opt.value }))}
          />
        );

      case 'slider':
        return (
          <div className="prop-field-slider">
            <Slider
              min={config.min ?? 0}
              max={config.max ?? 100}
              step={config.step ?? 1}
              value={value ?? config.defaultValue ?? 0}
              onChange={handleChange}
            />
            <span className="prop-field-slider-value">{value ?? config.defaultValue ?? 0}</span>
          </div>
        );

      case 'json':
        return (
          <Input.TextArea
            size="small"
            value={typeof value === 'string' ? value : JSON.stringify(value ?? config.defaultValue, null, 2)}
            placeholder="JSON"
            rows={3}
            onChange={(e) => {
              try {
                handleChange(JSON.parse(e.target.value));
              } catch {
                // 暂不解析无效 JSON
              }
            }}
            className="prop-field-json"
          />
        );

      default:
        return (
          <Input
            size="small"
            value={String(value ?? config.defaultValue ?? '')}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
    }
  };

  return (
    <div className={`prop-field ${config.type === 'boolean' ? 'prop-field--inline' : ''}`}>
      <label className="prop-field-label" title={config.description}>
        {config.label}
        {config.required && <span className="prop-field-required">*</span>}
      </label>
      <div className="prop-field-control">
        <div className="prop-field-input">
          {renderField()}
        </div>
        {showBinding && onBindingChange && (
          <ExpressionEditor
            binding={binding}
            staticValue={value}
            valueType={valueType}
            componentId={componentId}
            onBindingChange={handleBindingChange}
          />
        )}
      </div>
    </div>
  );
};

/**
 * 按 group 分组排序
 */
function groupBySection(propConfig: PropConfig) {
  const groups: Map<string, [string, PropFieldConfig][]> = new Map();

  Object.entries(propConfig).forEach(([key, config]) => {
    const group = config.group || '';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push([key, config]);
  });

  return Array.from(groups.entries()).map(([group, fields]) => ({
    group,
    fields,
  }));
}

export default PropConfigPanel;
