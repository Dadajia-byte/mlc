import { useMemo, useCallback, useState } from 'react';
import { InputNumber, Input, Switch, ColorPicker, Empty } from 'antd';
import useCanvasStore from '@/store/canvasStore';
import { findComponent } from '@/utils/componentTree';
import { getComponent } from '@/registry/index';
import type { ComponentSchema, EventBinding } from '@/types/schema';
import type { ComponentLibrary } from '@/registry/index';
import PropConfigPanel from './PropConfigPanel';
import EventPanel from './EventPanel';
import {
  AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  AlignHorizontalSpaceAround, AlignVerticalSpaceAround,
  Lock, Unlock, Eye, EyeOff, Settings, Zap, Palette,
} from 'lucide-react';
import './index.scss';

const MIXED = '—';

type TabKey = 'style' | 'props' | 'events';

const RightBar = () => {
  const { canvas, selectedComponents, updateComponent, alignComponents, distributeComponents } = useCanvasStore();
  const [activeTab, setActiveTab] = useState<TabKey>('props');

  const selectedComp: ComponentSchema | null = useMemo(() => {
    if (!canvas || selectedComponents.length !== 1) return null;
    return findComponent(canvas.components, selectedComponents[0]) ?? null;
  }, [canvas, selectedComponents]);

  const multiSelected = selectedComponents.length > 1;

  const selectedComps: ComponentSchema[] = useMemo(() => {
    if (!canvas || !multiSelected) return [];
    return selectedComponents.map(id => findComponent(canvas.components, id)).filter(Boolean) as ComponentSchema[];
  }, [canvas, selectedComponents, multiSelected]);

  const multiStyle = useMemo(() => {
    if (selectedComps.length < 2) return null;
    const keys = ['opacity', 'borderRadius', 'backgroundColor', 'width', 'height'] as const;
    const result: Record<string, any> = {};
    keys.forEach(key => {
      const values = selectedComps.map(c => c.style?.[key]);
      const allSame = values.every(v => v === values[0]);
      result[key] = allSame ? values[0] : undefined;
    });
    return result;
  }, [selectedComps]);

  // 获取选中组件的 meta 信息（包含 propConfig 和 supportedEvents）
  const componentMeta = useMemo(() => {
    if (!selectedComp) return null;
    const library: ComponentLibrary = selectedComp.library || 'antd';
    const info = getComponent(library, selectedComp.type);
    return info?.meta ?? null;
  }, [selectedComp]);

  const updateStyle = useCallback((key: string, value: any) => {
    if (!selectedComp) return;
    updateComponent(selectedComp.id, { style: { ...selectedComp.style, [key]: value } });
  }, [selectedComp, updateComponent]);

  const updateMultiStyle = useCallback((key: string, value: any) => {
    selectedComps.forEach(comp => {
      updateComponent(comp.id, { style: { ...comp.style, [key]: value } });
    });
  }, [selectedComps, updateComponent]);

  const updateProp = useCallback((key: string, value: any) => {
    if (!selectedComp) return;
    updateComponent(selectedComp.id, { props: { ...selectedComp.props, [key]: value } });
  }, [selectedComp, updateComponent]);

  const updateEditor = useCallback((key: string, value: any) => {
    if (!selectedComp) return;
    updateComponent(selectedComp.id, { editor: { ...selectedComp.editor, [key]: value } });
  }, [selectedComp, updateComponent]);

  const updateMultiEditor = useCallback((key: string, value: any) => {
    selectedComps.forEach(comp => {
      updateComponent(comp.id, { editor: { ...comp.editor, [key]: value } });
    });
  }, [selectedComps, updateComponent]);

  const updateEvents = useCallback((events: EventBinding[]) => {
    if (!selectedComp) return;
    updateComponent(selectedComp.id, { events });
  }, [selectedComp, updateComponent]);

  // 无选中
  if (!selectedComp && !multiSelected) {
    return (
      <div className="right-bar">
        <div className="right-bar-empty">
          <Empty description="选中组件以编辑属性" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      </div>
    );
  }

  // 多选模式
  if (multiSelected) {
    const allLocked = selectedComps.every(c => c.editor?.locked);
    const allHidden = selectedComps.every(c => c.editor?.visible === false);

    return (
      <div className="right-bar">
        <div className="right-bar-header">
          <span className="right-bar-header-title">多选操作</span>
          <span className="right-bar-header-badge">{selectedComponents.length} 个组件</span>
          <div className="right-bar-header-controls">
            <button
              className={`right-bar-header-btn ${allLocked ? 'active' : ''}`}
              onClick={() => updateMultiEditor('locked', !allLocked)}
              title={allLocked ? '全部解锁' : '全部锁定'}
            >
              {allLocked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>
            <button
              className={`right-bar-header-btn ${allHidden ? 'active' : ''}`}
              onClick={() => updateMultiEditor('visible', allHidden)}
              title={allHidden ? '全部显示' : '全部隐藏'}
            >
              {allHidden ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div className="right-bar-content">
          <div className="section">
            <div className="section-title">对齐</div>
            <div className="align-grid">
              <button className="align-btn" onClick={() => alignComponents('left')} title="左对齐"><AlignHorizontalJustifyStart size={16} /></button>
              <button className="align-btn" onClick={() => alignComponents('horizontalCenter')} title="水平居中"><AlignHorizontalJustifyCenter size={16} /></button>
              <button className="align-btn" onClick={() => alignComponents('right')} title="右对齐"><AlignHorizontalJustifyEnd size={16} /></button>
              <button className="align-btn" onClick={() => alignComponents('top')} title="顶部对齐"><AlignVerticalJustifyStart size={16} /></button>
              <button className="align-btn" onClick={() => alignComponents('verticalCenter')} title="垂直居中"><AlignVerticalJustifyCenter size={16} /></button>
              <button className="align-btn" onClick={() => alignComponents('bottom')} title="底部对齐"><AlignVerticalJustifyEnd size={16} /></button>
            </div>
          </div>
          {selectedComponents.length >= 3 && (
            <div className="section">
              <div className="section-title">分布</div>
              <div className="align-grid cols-2">
                <button className="align-btn wide" onClick={() => distributeComponents('horizontal')}><AlignHorizontalSpaceAround size={16} /><span>水平等距</span></button>
                <button className="align-btn wide" onClick={() => distributeComponents('vertical')}><AlignVerticalSpaceAround size={16} /><span>垂直等距</span></button>
              </div>
            </div>
          )}
          <div className="section">
            <div className="section-title">批量尺寸</div>
            <div className="prop-grid-4">
              <div className="prop-cell">
                <label>W</label>
                <InputNumber size="small" value={multiStyle?.width as number ?? undefined} placeholder={multiStyle?.width === undefined ? MIXED : 'auto'} onChange={(v) => v != null && updateMultiStyle('width', v)} min={0} />
              </div>
              <div className="prop-cell">
                <label>H</label>
                <InputNumber size="small" value={multiStyle?.height as number ?? undefined} placeholder={multiStyle?.height === undefined ? MIXED : 'auto'} onChange={(v) => v != null && updateMultiStyle('height', v)} min={0} />
              </div>
            </div>
          </div>
          <div className="section">
            <div className="section-title">批量外观</div>
            <div className="prop-list">
              <div className="prop-row">
                <label>透明度</label>
                <InputNumber size="small" value={typeof multiStyle?.opacity === 'number' ? Math.round(multiStyle.opacity * 100) : undefined} placeholder={multiStyle?.opacity === undefined ? MIXED : undefined} onChange={(v) => v != null && updateMultiStyle('opacity', v / 100)} min={0} max={100} formatter={(v) => `${v}%`} parser={(v) => parseFloat(v?.replace('%', '') || '100')} />
              </div>
              <div className="prop-row">
                <label>圆角</label>
                <InputNumber size="small" value={multiStyle?.borderRadius as number ?? undefined} placeholder={multiStyle?.borderRadius === undefined ? MIXED : undefined} onChange={(v) => v != null && updateMultiStyle('borderRadius', v)} min={0} />
              </div>
              <div className="prop-row">
                <label>背景色</label>
                <ColorPicker size="small" value={multiStyle?.backgroundColor || undefined} onChange={(_, hex) => updateMultiStyle('backgroundColor', hex)} allowClear />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === 单选模式 ===
  const style = selectedComp!.style || {};
  const props = selectedComp!.props || {};
  const editor = selectedComp!.editor || {};
  const comp = selectedComp!;
  const hasPropConfig = !!componentMeta?.propConfig && Object.keys(componentMeta.propConfig).length > 0;
  const hasSupportedEvents = !!componentMeta?.supportedEvents && componentMeta.supportedEvents.length > 0;

  return (
    <div className="right-bar">
      <div className="right-bar-header">
        <span className="right-bar-header-title">{componentMeta?.title || comp.type}</span>
        <div className="right-bar-header-controls">
          <button
            className={`right-bar-header-btn ${editor.locked ? 'active' : ''}`}
            onClick={() => updateEditor('locked', !editor.locked)}
            title={editor.locked ? '解锁' : '锁定'}
          >
            {editor.locked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
          <button
            className={`right-bar-header-btn ${editor.visible === false ? 'active' : ''}`}
            onClick={() => updateEditor('visible', editor.visible === false)}
            title={editor.visible === false ? '显示' : '隐藏'}
          >
            {editor.visible === false ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="right-bar-tabs">
        <button
          className={`right-bar-tab ${activeTab === 'props' ? 'active' : ''}`}
          onClick={() => setActiveTab('props')}
          title="组件属性"
        >
          <Settings size={14} />
          <span>属性</span>
        </button>
        <button
          className={`right-bar-tab ${activeTab === 'style' ? 'active' : ''}`}
          onClick={() => setActiveTab('style')}
          title="样式"
        >
          <Palette size={14} />
          <span>样式</span>
        </button>
        <button
          className={`right-bar-tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
          title="事件"
        >
          <Zap size={14} />
          <span>事件</span>
          {(comp.events?.length ?? 0) > 0 && (
            <span className="right-bar-tab-badge">{comp.events!.length}</span>
          )}
        </button>
      </div>

      <div className="right-bar-content">
        {/* 属性 Tab */}
        {activeTab === 'props' && (
          <>
            {hasPropConfig ? (
              <div className="section">
                <div className="section-title">组件属性</div>
                <PropConfigPanel
                  propConfig={componentMeta!.propConfig!}
                  values={props}
                  onChange={updateProp}
                />
              </div>
            ) : (
              Object.keys(props).length > 0 && (
                <div className="section">
                  <div className="section-title">组件属性</div>
                  <div className="prop-list">
                    {Object.entries(props).map(([key, value]) => (
                      <div className="prop-row" key={key}>
                        <label>{key}</label>
                        {typeof value === 'boolean' ? (
                          <Switch size="small" checked={value} onChange={(v) => updateProp(key, v)} />
                        ) : typeof value === 'number' ? (
                          <InputNumber size="small" value={value} onChange={(v) => updateProp(key, v)} />
                        ) : (
                          <Input size="small" value={String(value ?? '')} onChange={(e) => updateProp(key, e.target.value)} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </>
        )}

        {/* 样式 Tab */}
        {activeTab === 'style' && (
          <>
            <div className="section">
              <div className="section-title">位置与尺寸</div>
              <div className="prop-grid-4">
                <div className="prop-cell">
                  <label>X</label>
                  <InputNumber size="small" value={Math.round((style.left as number) ?? 0)} onChange={(v) => updateStyle('left', v ?? 0)} />
                </div>
                <div className="prop-cell">
                  <label>Y</label>
                  <InputNumber size="small" value={Math.round((style.top as number) ?? 0)} onChange={(v) => updateStyle('top', v ?? 0)} />
                </div>
                <div className="prop-cell">
                  <label>W</label>
                  <InputNumber size="small" value={style.width as number ?? undefined} onChange={(v) => updateStyle('width', v ?? undefined)} placeholder="auto" min={0} />
                </div>
                <div className="prop-cell">
                  <label>H</label>
                  <InputNumber size="small" value={style.height as number ?? undefined} onChange={(v) => updateStyle('height', v ?? undefined)} placeholder="auto" min={0} />
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-title">外观</div>
              <div className="prop-list">
                <div className="prop-row">
                  <label>透明度</label>
                  <InputNumber
                    size="small"
                    value={typeof style.opacity === 'number' ? Math.round(style.opacity * 100) : 100}
                    onChange={(v) => updateStyle('opacity', (v ?? 100) / 100)}
                    min={0} max={100}
                    formatter={(v) => `${v}%`}
                    parser={(v) => parseFloat(v?.replace('%', '') || '100')}
                  />
                </div>
                <div className="prop-row">
                  <label>圆角</label>
                  <InputNumber
                    size="small"
                    value={(style as any).borderRadius ?? 0}
                    onChange={(v) => updateStyle('borderRadius', v ?? 0)}
                    min={0}
                  />
                </div>
                <div className="prop-row">
                  <label>背景色</label>
                  <ColorPicker
                    size="small"
                    value={(style as any).backgroundColor}
                    onChange={(_, hex) => updateStyle('backgroundColor', hex)}
                    allowClear
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* 事件 Tab */}
        {activeTab === 'events' && (
          <div className="section">
            <div className="section-title">事件绑定</div>
            <EventPanel
              events={comp.events || []}
              supportedEvents={hasSupportedEvents ? componentMeta!.supportedEvents! : []}
              onChange={updateEvents}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RightBar;
