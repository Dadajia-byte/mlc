import { useCallback } from 'react';
import { InputNumber, Input, Switch, ColorPicker, Select, Slider, Radio } from 'antd';
import type { PropConfig, PropFieldConfig } from '@mlc/schema';
import './PropConfigPanel.scss';

interface PropConfigPanelProps {
  propConfig: PropConfig;
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

const PropConfigPanel = ({ propConfig, values, onChange }: PropConfigPanelProps) => {
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
                onChange={onChange}
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
  onChange: (key: string, value: any) => void;
}

const PropField = ({ propKey, config, value, onChange }: PropFieldProps) => {
  const handleChange = useCallback((val: any) => {
    onChange(propKey, val);
  }, [propKey, onChange]);

  const renderField = () => {
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
        {renderField()}
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
