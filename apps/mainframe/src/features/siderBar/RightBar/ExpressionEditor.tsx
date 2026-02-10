import { useState, useCallback, useMemo, useRef } from 'react';
import { Input, Popover, Button, Tabs, Tag, Tooltip, Select, message } from 'antd';
import { Link2, Link2Off, Code, Variable, Database } from 'lucide-react';
import type { PropertyBinding, VariableDefinition } from '@mlc/schema';
import { validateExpression, createStaticBinding, createExpressionBinding, createVariableBinding, createDataSourceBinding } from '@mlc/schema';
import useCanvasStore from '@/store/canvasStore';
import './ExpressionEditor.scss';

interface ExpressionEditorProps {
  /** 当前绑定配置 */
  binding?: PropertyBinding;
  /** 静态值（未绑定时的值） */
  staticValue?: any;
  /** 值类型 */
  valueType?: 'string' | 'number' | 'boolean' | 'any';
  /** 绑定变化回调 */
  onBindingChange: (binding: PropertyBinding | undefined) => void;
  /** 当前组件 ID */
  componentId?: string;
  /** placeholder */
  placeholder?: string;
}

const ExpressionEditor = ({
  binding,
  staticValue,
  onBindingChange,
}: ExpressionEditorProps) => {
  const { canvas } = useCanvasStore();
  
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'expression' | 'variable' | 'dataSource'>('expression');
  const [expressionInput, setExpressionInput] = useState(binding?.expression || '');
  const [selectedVariable, setSelectedVariable] = useState(binding?.variableName || '');
  const [selectedDataSource, setSelectedDataSource] = useState(binding?.dataSourceName || '');
  const [dataSourcePath, setDataSourcePath] = useState(binding?.dataSourcePath || '');
  const inputRef = useRef<any>(null);

  const isBound = binding && binding.type !== 'static';

  // 获取所有变量
  const allVariables = useMemo(() => {
    const vars: VariableDefinition[] = [];
    if (canvas?.globalVariables) vars.push(...canvas.globalVariables);
    if (canvas?.pageVariables) vars.push(...canvas.pageVariables);
    return vars;
  }, [canvas]);

  // 获取所有数据源
  const allDataSources = useMemo(() => {
    return canvas?.dataSources || [];
  }, [canvas]);

  // 验证表达式
  const expressionError = useMemo(() => {
    if (!expressionInput) return null;
    const result = validateExpression(expressionInput);
    return result.valid ? null : result.error;
  }, [expressionInput]);

  // 切换绑定/解绑
  const toggleBinding = useCallback(() => {
    if (isBound) {
      // 解绑 - 恢复为静态值
      onBindingChange(staticValue !== undefined ? createStaticBinding(staticValue) : undefined);
    } else {
      setPopoverOpen(true);
    }
  }, [isBound, staticValue, onBindingChange]);

  // 应用表达式绑定
  const applyExpressionBinding = useCallback(() => {
    if (!expressionInput) {
      message.warning('请输入表达式');
      return;
    }
    if (expressionError) {
      message.error('表达式语法错误');
      return;
    }
    onBindingChange(createExpressionBinding(expressionInput));
    setPopoverOpen(false);
  }, [expressionInput, expressionError, onBindingChange]);

  // 应用变量绑定
  const applyVariableBinding = useCallback(() => {
    if (!selectedVariable) {
      message.warning('请选择变量');
      return;
    }
    onBindingChange(createVariableBinding(selectedVariable));
    setPopoverOpen(false);
  }, [selectedVariable, onBindingChange]);

  // 应用数据源绑定
  const applyDataSourceBinding = useCallback(() => {
    if (!selectedDataSource) {
      message.warning('请选择数据源');
      return;
    }
    onBindingChange(createDataSourceBinding(selectedDataSource, dataSourcePath || undefined));
    setPopoverOpen(false);
  }, [selectedDataSource, dataSourcePath, onBindingChange]);

  // 插入变量到表达式
  const insertVariable = useCallback((varName: string, scope: 'global' | 'page') => {
    const prefix = scope === 'global' ? '$global' : '$page';
    const insertion = `${prefix}.${varName}`;
    setExpressionInput((prev) => prev + insertion);
    inputRef.current?.focus();
  }, []);

  // 插入数据源到表达式
  const insertDataSource = useCallback((dsName: string) => {
    const insertion = `$data.${dsName}`;
    setExpressionInput((prev) => prev + insertion);
    inputRef.current?.focus();
  }, []);

  // 获取绑定显示文本
  const getBindingDisplay = () => {
    if (!binding || binding.type === 'static') return null;
    switch (binding.type) {
      case 'expression':
        return binding.expression;
      case 'variable':
        return `${binding.variableName}`;
      case 'dataSource':
        return binding.dataSourcePath 
          ? `${binding.dataSourceName}.${binding.dataSourcePath}`
          : binding.dataSourceName;
      default:
        return null;
    }
  };

  const popoverContent = (
    <div className="expression-editor-popover">
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as any)}
        size="small"
        items={[
          {
            key: 'expression',
            label: (
              <span className="tab-label">
                <Code size={14} />
                表达式
              </span>
            ),
            children: (
              <div className="expression-tab">
                <div className="expression-input-wrapper">
                  <Input.TextArea
                    ref={inputRef}
                    value={expressionInput}
                    onChange={(e) => setExpressionInput(e.target.value)}
                    placeholder="例如: $global.count + 1"
                    rows={3}
                    status={expressionError ? 'error' : undefined}
                  />
                  {expressionError && (
                    <div className="expression-error">{expressionError}</div>
                  )}
                </div>
                
                <div className="quick-insert">
                  <div className="quick-insert-title">快速插入变量</div>
                  <div className="quick-insert-list">
                    {allVariables.map((v) => (
                      <Tag
                        key={v.id}
                        className="quick-insert-tag"
                        onClick={() => insertVariable(v.name, v.scope as 'global' | 'page')}
                      >
                        {v.scope === 'global' ? '全局' : '页面'}: {v.label}
                      </Tag>
                    ))}
                    {allDataSources.map((ds) => (
                      <Tag
                        key={ds.id}
                        className="quick-insert-tag datasource"
                        onClick={() => insertDataSource(ds.name)}
                      >
                        数据: {ds.label}
                      </Tag>
                    ))}
                    {allVariables.length === 0 && allDataSources.length === 0 && (
                      <span className="no-vars">暂无可用变量</span>
                    )}
                  </div>
                </div>

                <div className="expression-help">
                  <div className="help-title">可用上下文</div>
                  <code>$global.变量名</code> - 全局变量<br/>
                  <code>$page.变量名</code> - 页面变量<br/>
                  <code>$data.数据源名</code> - 数据源数据<br/>
                  <code>$props.属性名</code> - 组件属性
                </div>

                <div className="expression-actions">
                  <Button size="small" onClick={() => setPopoverOpen(false)}>取消</Button>
                  <Button size="small" type="primary" onClick={applyExpressionBinding}>
                    确定
                  </Button>
                </div>
              </div>
            ),
          },
          {
            key: 'variable',
            label: (
              <span className="tab-label">
                <Variable size={14} />
                变量
              </span>
            ),
            children: (
              <div className="variable-tab">
                <Select
                  value={selectedVariable || undefined}
                  onChange={setSelectedVariable}
                  placeholder="选择变量"
                  style={{ width: '100%' }}
                  options={allVariables.map((v) => ({
                    label: `${v.scope === 'global' ? '[全局]' : '[页面]'} ${v.label}`,
                    value: v.name,
                  }))}
                />
                {allVariables.length === 0 && (
                  <div className="no-data-tip">
                    暂无变量，请先在数据面板中创建
                  </div>
                )}
                <div className="expression-actions">
                  <Button size="small" onClick={() => setPopoverOpen(false)}>取消</Button>
                  <Button size="small" type="primary" onClick={applyVariableBinding}>
                    确定
                  </Button>
                </div>
              </div>
            ),
          },
          {
            key: 'dataSource',
            label: (
              <span className="tab-label">
                <Database size={14} />
                数据源
              </span>
            ),
            children: (
              <div className="datasource-tab">
                <Select
                  value={selectedDataSource || undefined}
                  onChange={setSelectedDataSource}
                  placeholder="选择数据源"
                  style={{ width: '100%', marginBottom: 8 }}
                  options={allDataSources.map((ds) => ({
                    label: `${ds.label} (${ds.type})`,
                    value: ds.name,
                  }))}
                />
                <Input
                  value={dataSourcePath}
                  onChange={(e) => setDataSourcePath(e.target.value)}
                  placeholder="数据路径（可选），如 data.list"
                  size="small"
                />
                {allDataSources.length === 0 && (
                  <div className="no-data-tip">
                    暂无数据源，请先在数据面板中创建
                  </div>
                )}
                <div className="expression-actions">
                  <Button size="small" onClick={() => setPopoverOpen(false)}>取消</Button>
                  <Button size="small" type="primary" onClick={applyDataSourceBinding}>
                    确定
                  </Button>
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );

  return (
    <div className="expression-editor">
      {isBound ? (
        <div className="expression-bound">
          <Tooltip title={getBindingDisplay()}>
            <span className="bound-value">
              {binding.type === 'expression' && <Code size={12} />}
              {binding.type === 'variable' && <Variable size={12} />}
              {binding.type === 'dataSource' && <Database size={12} />}
              <span className="bound-text">{getBindingDisplay()}</span>
            </span>
          </Tooltip>
          <Popover
            content={popoverContent}
            trigger="click"
            open={popoverOpen}
            onOpenChange={setPopoverOpen}
            placement="bottomRight"
          >
            <button className="binding-btn bound" title="编辑绑定">
              <Link2 size={14} />
            </button>
          </Popover>
          <button className="binding-btn unbind" onClick={toggleBinding} title="解除绑定">
            <Link2Off size={14} />
          </button>
        </div>
      ) : (
        <Popover
          content={popoverContent}
          trigger="click"
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
          placement="bottomRight"
        >
          <button className="binding-btn" title="添加数据绑定">
            <Link2 size={14} />
          </button>
        </Popover>
      )}
    </div>
  );
};

export default ExpressionEditor;
