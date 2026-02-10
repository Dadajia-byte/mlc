import { useState, useCallback } from 'react';
import { Select, Input, Switch, Button, Empty } from 'antd';
import { Plus, Trash2, ChevronDown, ChevronRight, Zap } from 'lucide-react';
import { generateId } from '@mlc/utils';
import type { EventBinding, EventTrigger, EventActionType, EventDeclaration } from '@mlc/schema';
import { createDefaultActionConfig } from '@mlc/schema';
import './EventPanel.scss';

interface EventPanelProps {
  events: EventBinding[];
  supportedEvents: EventDeclaration[];
  onChange: (events: EventBinding[]) => void;
}

const ACTION_TYPE_OPTIONS: { label: string; value: EventActionType }[] = [
  { label: '页面跳转', value: 'navigate' },
  { label: '打开链接', value: 'openUrl' },
  { label: '显示消息', value: 'showMessage' },
  { label: '设置变量', value: 'setState' },
  { label: '调用接口', value: 'callApi' },
  { label: '自定义代码', value: 'custom' },
];

const MESSAGE_TYPE_OPTIONS = [
  { label: '成功', value: 'success' },
  { label: '错误', value: 'error' },
  { label: '警告', value: 'warning' },
  { label: '信息', value: 'info' },
];

const METHOD_OPTIONS = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
];

const EventPanel = ({ events, supportedEvents, onChange }: EventPanelProps) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const triggerOptions = supportedEvents.map(e => ({
    label: e.label,
    value: e.trigger,
  }));

  const handleAdd = useCallback(() => {
    const defaultTrigger = supportedEvents[0]?.trigger || 'onClick';
    const newBinding: EventBinding = {
      id: generateId('evt_'),
      trigger: defaultTrigger as EventTrigger,
      actionType: 'showMessage',
      config: createDefaultActionConfig('showMessage'),
    };
    const newEvents = [...events, newBinding];
    onChange(newEvents);
    setExpandedIds(prev => new Set([...prev, newBinding.id]));
  }, [events, supportedEvents, onChange]);

  const handleRemove = useCallback((id: string) => {
    onChange(events.filter(e => e.id !== id));
  }, [events, onChange]);

  const handleUpdate = useCallback((id: string, updates: Partial<EventBinding>) => {
    onChange(events.map(e => {
      if (e.id !== id) return e;
      // 当 actionType 切换时重建 config
      if (updates.actionType && updates.actionType !== e.actionType) {
        return { ...e, ...updates, config: createDefaultActionConfig(updates.actionType) };
      }
      return { ...e, ...updates };
    }));
  }, [events, onChange]);

  const handleConfigUpdate = useCallback((id: string, configKey: string, value: any) => {
    onChange(events.map(e =>
      e.id === id ? { ...e, config: { ...e.config, [configKey]: value } } : e
    ));
  }, [events, onChange]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  if (supportedEvents.length === 0) {
    return (
      <div className="event-panel">
        <Empty description="此组件不支持事件" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  return (
    <div className="event-panel">
      {events.length === 0 ? (
        <div className="event-panel-empty">
          <Zap size={20} />
          <span>暂无事件绑定</span>
        </div>
      ) : (
        <div className="event-panel-list">
          {events.map(binding => {
            const isExpanded = expandedIds.has(binding.id);
            const triggerLabel = supportedEvents.find(e => e.trigger === binding.trigger)?.label || binding.trigger;

            return (
              <div key={binding.id} className={`event-item ${isExpanded ? 'expanded' : ''}`}>
                <div className="event-item-header" onClick={() => toggleExpand(binding.id)}>
                  <div className="event-item-header-left">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <Zap size={12} className="event-item-icon" />
                    <span className="event-item-trigger">{triggerLabel}</span>
                    <span className="event-item-arrow">→</span>
                    <span className="event-item-action">
                      {ACTION_TYPE_OPTIONS.find(a => a.value === binding.actionType)?.label}
                    </span>
                  </div>
                  <button
                    className="event-item-remove"
                    onClick={(e) => { e.stopPropagation(); handleRemove(binding.id); }}
                    title="删除事件"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {isExpanded && (
                  <div className="event-item-body">
                    <div className="event-field">
                      <label>触发事件</label>
                      <Select
                        size="small"
                        value={binding.trigger}
                        options={triggerOptions}
                        onChange={(v) => handleUpdate(binding.id, { trigger: v })}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div className="event-field">
                      <label>执行动作</label>
                      <Select
                        size="small"
                        value={binding.actionType}
                        options={ACTION_TYPE_OPTIONS}
                        onChange={(v) => handleUpdate(binding.id, { actionType: v })}
                        style={{ width: '100%' }}
                      />
                    </div>

                    {/* 动作配置区 */}
                    <ActionConfigEditor
                      actionType={binding.actionType}
                      config={binding.config}
                      onUpdate={(key, value) => handleConfigUpdate(binding.id, key, value)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Button
        type="dashed"
        size="small"
        icon={<Plus size={14} />}
        onClick={handleAdd}
        className="event-panel-add"
        block
      >
        添加事件
      </Button>
    </div>
  );
};

interface ActionConfigEditorProps {
  actionType: EventActionType;
  config: Record<string, any>;
  onUpdate: (key: string, value: any) => void;
}

const ActionConfigEditor = ({ actionType, config, onUpdate }: ActionConfigEditorProps) => {
  switch (actionType) {
    case 'navigate':
    case 'openUrl':
      return (
        <div className="action-config">
          <div className="event-field">
            <label>URL</label>
            <Input
              size="small"
              value={config.url || ''}
              placeholder="https://..."
              onChange={(e) => onUpdate('url', e.target.value)}
            />
          </div>
          <div className="event-field event-field--inline">
            <label>新窗口</label>
            <Switch size="small" checked={config.newWindow || false} onChange={(v) => onUpdate('newWindow', v)} />
          </div>
        </div>
      );

    case 'showMessage':
      return (
        <div className="action-config">
          <div className="event-field">
            <label>消息类型</label>
            <Select
              size="small"
              value={config.type || 'info'}
              options={MESSAGE_TYPE_OPTIONS}
              onChange={(v) => onUpdate('type', v)}
              style={{ width: '100%' }}
            />
          </div>
          <div className="event-field">
            <label>消息内容</label>
            <Input
              size="small"
              value={config.content || ''}
              placeholder="提示内容"
              onChange={(e) => onUpdate('content', e.target.value)}
            />
          </div>
          <div className="event-field">
            <label>持续时间(ms)</label>
            <Input
              size="small"
              value={config.duration ?? 3000}
              type="number"
              onChange={(e) => onUpdate('duration', Number(e.target.value))}
            />
          </div>
        </div>
      );

    case 'setState':
      return (
        <div className="action-config">
          <div className="event-field">
            <label>变量名</label>
            <Input
              size="small"
              value={config.key || ''}
              placeholder="变量名"
              onChange={(e) => onUpdate('key', e.target.value)}
            />
          </div>
          <div className="event-field">
            <label>值</label>
            <Input
              size="small"
              value={config.value ?? ''}
              placeholder="值"
              onChange={(e) => onUpdate('value', e.target.value)}
            />
          </div>
        </div>
      );

    case 'callApi':
      return (
        <div className="action-config">
          <div className="event-field">
            <label>请求方法</label>
            <Select
              size="small"
              value={config.method || 'GET'}
              options={METHOD_OPTIONS}
              onChange={(v) => onUpdate('method', v)}
              style={{ width: '100%' }}
            />
          </div>
          <div className="event-field">
            <label>URL</label>
            <Input
              size="small"
              value={config.url || ''}
              placeholder="https://api.example.com/..."
              onChange={(e) => onUpdate('url', e.target.value)}
            />
          </div>
          <div className="event-field">
            <label>请求体</label>
            <Input.TextArea
              size="small"
              value={config.body || ''}
              placeholder='{"key": "value"}'
              rows={2}
              onChange={(e) => onUpdate('body', e.target.value)}
            />
          </div>
        </div>
      );

    case 'custom':
      return (
        <div className="action-config">
          <div className="event-field">
            <label>JavaScript 代码</label>
            <Input.TextArea
              size="small"
              value={config.code || ''}
              placeholder="// 在此编写代码"
              rows={4}
              onChange={(e) => onUpdate('code', e.target.value)}
              className="code-editor"
            />
          </div>
        </div>
      );

    default:
      return null;
  }
};

export default EventPanel;
