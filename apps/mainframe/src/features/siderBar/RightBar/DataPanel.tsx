import { useState, useCallback } from 'react';
import { Button, Input, Select, InputNumber, Switch, Popconfirm, Empty, Tabs, Tag, message } from 'antd';
import { Plus, Trash2, Globe, Database, RefreshCw } from 'lucide-react';
import type { VariableDefinition, VariableType, DataSourceDefinition, HttpMethod } from '@mlc/schema';
import useCanvasStore from '@/store/canvasStore';
import useDataBindingStore from '@/store/dataBindingStore';
import './DataPanel.scss';

const VARIABLE_TYPES: { label: string; value: VariableType }[] = [
  { label: '字符串', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '布尔', value: 'boolean' },
  { label: '数组', value: 'array' },
  { label: '对象', value: 'object' },
];

const HTTP_METHODS: { label: string; value: HttpMethod }[] = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
];

const DataPanel = () => {
  const { canvas } = useCanvasStore();
  const {
    globalValues,
    pageValues,
    dataSourceValues,
    dataSourceLoading,
    dataSourceErrors,
    addGlobalVariable,
    addPageVariable,
    removeVariable,
    addDataSource,
    removeDataSource,
    fetchDataSource,
  } = useDataBindingStore();

  const [activeTab, setActiveTab] = useState<'variables' | 'dataSources'>('variables');

  // 新增变量状态
  const [showAddVar, setShowAddVar] = useState(false);
  const [newVarScope, setNewVarScope] = useState<'global' | 'page'>('page');
  const [newVarName, setNewVarName] = useState('');
  const [newVarLabel, setNewVarLabel] = useState('');
  const [newVarType, setNewVarType] = useState<VariableType>('string');
  const [newVarValue, setNewVarValue] = useState<any>('');

  // 新增数据源状态
  const [showAddDs, setShowAddDs] = useState(false);
  const [newDsName, setNewDsName] = useState('');
  const [newDsLabel, setNewDsLabel] = useState('');
  const [newDsType, setNewDsType] = useState<'static' | 'api'>('static');
  const [newDsData, setNewDsData] = useState('');
  const [newDsUrl, setNewDsUrl] = useState('');
  const [newDsMethod, setNewDsMethod] = useState<HttpMethod>('GET');
  const [newDsAutoFetch, setNewDsAutoFetch] = useState(true);
  const [newDsResponsePath, setNewDsResponsePath] = useState('');

  const globalVariables = canvas?.globalVariables || [];
  const pageVariables = canvas?.pageVariables || [];
  const dataSources = canvas?.dataSources || [];

  // 添加变量
  const handleAddVariable = useCallback(() => {
    if (!newVarName.trim()) {
      message.warning('请输入变量名');
      return;
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newVarName)) {
      message.warning('变量名只能包含字母、数字和下划线，且不能以数字开头');
      return;
    }

    const varData = {
      name: newVarName.trim(),
      label: newVarLabel.trim() || newVarName.trim(),
      type: newVarType,
      defaultValue: newVarValue,
    };

    if (newVarScope === 'global') {
      addGlobalVariable(varData);
    } else {
      addPageVariable(varData);
    }

    // 重置表单
    setShowAddVar(false);
    setNewVarName('');
    setNewVarLabel('');
    setNewVarType('string');
    setNewVarValue('');
    message.success('变量创建成功');
  }, [newVarName, newVarLabel, newVarType, newVarValue, newVarScope, addGlobalVariable, addPageVariable]);

  // 添加数据源
  const handleAddDataSource = useCallback(() => {
    if (!newDsName.trim()) {
      message.warning('请输入数据源名称');
      return;
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newDsName)) {
      message.warning('数据源名称只能包含字母、数字和下划线');
      return;
    }

    if (newDsType === 'static') {
      let data;
      try {
        data = newDsData ? JSON.parse(newDsData) : null;
      } catch {
        message.error('JSON 格式错误');
        return;
      }
      addDataSource({
        name: newDsName.trim(),
        label: newDsLabel.trim() || newDsName.trim(),
        type: 'static',
        staticConfig: { data },
      });
    } else {
      if (!newDsUrl.trim()) {
        message.warning('请输入 API URL');
        return;
      }
      addDataSource({
        name: newDsName.trim(),
        label: newDsLabel.trim() || newDsName.trim(),
        type: 'api',
        apiConfig: {
          url: newDsUrl.trim(),
          method: newDsMethod,
          autoFetch: newDsAutoFetch,
          responsePath: newDsResponsePath.trim() || undefined,
        },
      });
    }

    // 重置表单
    setShowAddDs(false);
    setNewDsName('');
    setNewDsLabel('');
    setNewDsType('static');
    setNewDsData('');
    setNewDsUrl('');
    setNewDsMethod('GET');
    setNewDsAutoFetch(true);
    setNewDsResponsePath('');
    message.success('数据源创建成功');
  }, [newDsName, newDsLabel, newDsType, newDsData, newDsUrl, newDsMethod, newDsAutoFetch, newDsResponsePath, addDataSource]);

  // 渲染变量值编辑器
  const renderValueEditor = (type: VariableType, value: any, onChange: (v: any) => void) => {
    switch (type) {
      case 'string':
        return <Input size="small" value={value} onChange={(e) => onChange(e.target.value)} placeholder="默认值" />;
      case 'number':
        return <InputNumber size="small" value={value} onChange={(v) => onChange(v ?? 0)} style={{ width: '100%' }} />;
      case 'boolean':
        return <Switch size="small" checked={!!value} onChange={onChange} />;
      case 'array':
      case 'object':
        return (
          <Input.TextArea
            size="small"
            rows={2}
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value));
              } catch {
                onChange(e.target.value);
              }
            }}
            placeholder={type === 'array' ? '[]' : '{}'}
          />
        );
      default:
        return <Input size="small" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />;
    }
  };

  // 渲染变量项
  const renderVariableItem = (variable: VariableDefinition, runtimeValue: any) => {
    return (
      <div key={variable.id} className="data-item">
        <div className="data-item-header">
          <div className="data-item-info">
            <span className="data-item-name">{variable.label}</span>
            <Tag color={variable.scope === 'global' ? 'blue' : 'green'} className="data-item-tag">
              {variable.scope === 'global' ? '全局' : '页面'}
            </Tag>
            <Tag className="data-item-type">{variable.type}</Tag>
          </div>
          <div className="data-item-actions">
            <Popconfirm
              title="确定删除此变量？"
              onConfirm={() => removeVariable(variable.id, variable.scope as 'global' | 'page')}
              okText="删除"
              cancelText="取消"
            >
              <button className="action-btn danger" title="删除">
                <Trash2 size={14} />
              </button>
            </Popconfirm>
          </div>
        </div>
        <div className="data-item-body">
          <div className="data-item-row">
            <span className="data-item-label">变量名:</span>
            <code className="data-item-code">{variable.name}</code>
          </div>
          <div className="data-item-row">
            <span className="data-item-label">当前值:</span>
            <span className="data-item-value">
              {typeof runtimeValue === 'object' ? JSON.stringify(runtimeValue) : String(runtimeValue ?? '')}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // 渲染数据源项
  const renderDataSourceItem = (ds: DataSourceDefinition) => {
    const data = dataSourceValues[ds.name];
    const loading = dataSourceLoading[ds.name];
    const error = dataSourceErrors[ds.name];

    return (
      <div key={ds.id} className="data-item">
        <div className="data-item-header">
          <div className="data-item-info">
            <span className="data-item-name">{ds.label}</span>
            <Tag color={ds.type === 'api' ? 'purple' : 'cyan'} className="data-item-tag">
              {ds.type === 'api' ? 'API' : '静态'}
            </Tag>
          </div>
          <div className="data-item-actions">
            {ds.type === 'api' && (
              <button
                className="action-btn"
                onClick={() => fetchDataSource(ds)}
                disabled={loading}
                title="刷新数据"
              >
                <RefreshCw size={14} className={loading ? 'spinning' : ''} />
              </button>
            )}
            <Popconfirm
              title="确定删除此数据源？"
              onConfirm={() => removeDataSource(ds.id)}
              okText="删除"
              cancelText="取消"
            >
              <button className="action-btn danger" title="删除">
                <Trash2 size={14} />
              </button>
            </Popconfirm>
          </div>
        </div>
        <div className="data-item-body">
          <div className="data-item-row">
            <span className="data-item-label">名称:</span>
            <code className="data-item-code">{ds.name}</code>
          </div>
          {ds.type === 'api' && ds.apiConfig && (
            <>
              <div className="data-item-row">
                <span className="data-item-label">URL:</span>
                <span className="data-item-value truncate">{ds.apiConfig.url}</span>
              </div>
              <div className="data-item-row">
                <span className="data-item-label">方法:</span>
                <Tag>{ds.apiConfig.method}</Tag>
              </div>
            </>
          )}
          {error && (
            <div className="data-item-error">
              错误: {error}
            </div>
          )}
          {data !== undefined && (
            <div className="data-item-preview">
              <span className="data-item-label">数据预览:</span>
              <pre className="data-preview-content">
                {typeof data === 'object' ? JSON.stringify(data, null, 2).slice(0, 200) : String(data)}
                {typeof data === 'object' && JSON.stringify(data).length > 200 && '...'}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="data-panel">
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as any)}
        size="small"
        items={[
          {
            key: 'variables',
            label: (
              <span className="tab-label">
                <Globe size={14} />
                变量
                {(globalVariables.length + pageVariables.length) > 0 && (
                  <span className="tab-badge">{globalVariables.length + pageVariables.length}</span>
                )}
              </span>
            ),
            children: (
              <div className="tab-content">
                <div className="panel-toolbar">
                  <Button
                    size="small"
                    type="primary"
                    icon={<Plus size={14} />}
                    onClick={() => setShowAddVar(true)}
                  >
                    新增变量
                  </Button>
                </div>

                {showAddVar && (
                  <div className="add-form">
                    <div className="form-row">
                      <label>作用域</label>
                      <Select
                        size="small"
                        value={newVarScope}
                        onChange={setNewVarScope}
                        options={[
                          { label: '页面变量', value: 'page' },
                          { label: '全局变量', value: 'global' },
                        ]}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div className="form-row">
                      <label>变量名 *</label>
                      <Input
                        size="small"
                        value={newVarName}
                        onChange={(e) => setNewVarName(e.target.value)}
                        placeholder="如: count, userName"
                      />
                    </div>
                    <div className="form-row">
                      <label>显示名称</label>
                      <Input
                        size="small"
                        value={newVarLabel}
                        onChange={(e) => setNewVarLabel(e.target.value)}
                        placeholder="可选，用于展示"
                      />
                    </div>
                    <div className="form-row">
                      <label>类型</label>
                      <Select
                        size="small"
                        value={newVarType}
                        onChange={setNewVarType}
                        options={VARIABLE_TYPES}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div className="form-row">
                      <label>默认值</label>
                      {renderValueEditor(newVarType, newVarValue, setNewVarValue)}
                    </div>
                    <div className="form-actions">
                      <Button size="small" onClick={() => setShowAddVar(false)}>取消</Button>
                      <Button size="small" type="primary" onClick={handleAddVariable}>创建</Button>
                    </div>
                  </div>
                )}

                <div className="data-list">
                  {globalVariables.length === 0 && pageVariables.length === 0 ? (
                    <Empty description="暂无变量" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <>
                      {globalVariables.map((v) => renderVariableItem(v, globalValues[v.name]))}
                      {pageVariables.map((v) => renderVariableItem(v, pageValues[v.name]))}
                    </>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'dataSources',
            label: (
              <span className="tab-label">
                <Database size={14} />
                数据源
                {dataSources.length > 0 && (
                  <span className="tab-badge">{dataSources.length}</span>
                )}
              </span>
            ),
            children: (
              <div className="tab-content">
                <div className="panel-toolbar">
                  <Button
                    size="small"
                    type="primary"
                    icon={<Plus size={14} />}
                    onClick={() => setShowAddDs(true)}
                  >
                    新增数据源
                  </Button>
                </div>

                {showAddDs && (
                  <div className="add-form">
                    <div className="form-row">
                      <label>类型</label>
                      <Select
                        size="small"
                        value={newDsType}
                        onChange={setNewDsType}
                        options={[
                          { label: '静态数据', value: 'static' },
                          { label: 'API 接口', value: 'api' },
                        ]}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div className="form-row">
                      <label>名称 *</label>
                      <Input
                        size="small"
                        value={newDsName}
                        onChange={(e) => setNewDsName(e.target.value)}
                        placeholder="如: userList, config"
                      />
                    </div>
                    <div className="form-row">
                      <label>显示名称</label>
                      <Input
                        size="small"
                        value={newDsLabel}
                        onChange={(e) => setNewDsLabel(e.target.value)}
                        placeholder="可选"
                      />
                    </div>
                    {newDsType === 'static' ? (
                      <div className="form-row">
                        <label>数据 (JSON)</label>
                        <Input.TextArea
                          size="small"
                          rows={4}
                          value={newDsData}
                          onChange={(e) => setNewDsData(e.target.value)}
                          placeholder='{"items": []}'
                        />
                      </div>
                    ) : (
                      <>
                        <div className="form-row">
                          <label>URL *</label>
                          <Input
                            size="small"
                            value={newDsUrl}
                            onChange={(e) => setNewDsUrl(e.target.value)}
                            placeholder="https://api.example.com/data"
                          />
                        </div>
                        <div className="form-row">
                          <label>请求方法</label>
                          <Select
                            size="small"
                            value={newDsMethod}
                            onChange={setNewDsMethod}
                            options={HTTP_METHODS}
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div className="form-row">
                          <label>响应路径</label>
                          <Input
                            size="small"
                            value={newDsResponsePath}
                            onChange={(e) => setNewDsResponsePath(e.target.value)}
                            placeholder="如: data.list"
                          />
                        </div>
                        <div className="form-row inline">
                          <label>自动请求</label>
                          <Switch
                            size="small"
                            checked={newDsAutoFetch}
                            onChange={setNewDsAutoFetch}
                          />
                        </div>
                      </>
                    )}
                    <div className="form-actions">
                      <Button size="small" onClick={() => setShowAddDs(false)}>取消</Button>
                      <Button size="small" type="primary" onClick={handleAddDataSource}>创建</Button>
                    </div>
                  </div>
                )}

                <div className="data-list">
                  {dataSources.length === 0 ? (
                    <Empty description="暂无数据源" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    dataSources.map((ds) => renderDataSourceItem(ds))
                  )}
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default DataPanel;
