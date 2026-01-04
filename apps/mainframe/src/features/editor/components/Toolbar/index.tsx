import { useState, useEffect, useMemo, useCallback } from 'react';
import { InputNumber } from 'antd';
import { ToolMode } from '@/types/schema';
import useCanvasStore from '@/store/canvasStore';
import type { CanvasRef } from '../Canvas';
import HistoryPanel from '../HistoryPanel';
import './index.scss';

interface ToolbarProps {
  canvasRef: React.RefObject<CanvasRef>;
  scale: number;
  toolMode: ToolMode;
  setToolMode: (toolMode: ToolMode) => void;
}

const Toolbar = ({ canvasRef, scale, toolMode, setToolMode }: ToolbarProps) => {
  const [showMore, setShowMore] = useState(true);
  const [currentScale, setCurrentScale] = useState(scale);
  const [showHistory, setShowHistory] = useState(false);

  const {
    undo, redo, historyIndex, history,
    selectedComponents, clipboard,
    copySelectedComponents, cutSelectedComponents, pasteComponents, deleteSelectedComponents,
  } = useCanvasStore();
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const hasSelection = selectedComponents.length > 0;
  const hasClipboard = clipboard.length > 0;

  const { minScale, maxScale } = canvasRef.current?.config ?? { minScale: 0.2, maxScale: 3 };

  useEffect(() => {
    setCurrentScale(scale);
  }, [scale]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果焦点在输入框内，不处理快捷键
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // @ts-expect-error userAgentData 是较新的 API
      const isMac = navigator.userAgentData?.platform === 'macOS' || /Mac|iPhone|iPad/.test(navigator.userAgent);
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // 撤销 Ctrl+Z
      if (modifier && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
      // 重做 Ctrl+Y / Ctrl+Shift+Z
      else if (modifier && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        if (canRedo) redo();
      }
      // 复制 Ctrl+C
      else if (modifier && e.key === 'c') {
        e.preventDefault();
        if (hasSelection) copySelectedComponents();
      }
      // 剪切 Ctrl+X
      else if (modifier && e.key === 'x') {
        e.preventDefault();
        if (hasSelection) cutSelectedComponents();
      }
      // 粘贴 Ctrl+V
      else if (modifier && e.key === 'v') {
        e.preventDefault();
        if (hasClipboard) pasteComponents();
      }
      // 删除 Delete / Backspace
      else if ((e.key === 'Delete' || e.key === 'Backspace') && !modifier) {
        e.preventDefault();
        if (hasSelection) deleteSelectedComponents();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    undo, redo, canUndo, canRedo,
    copySelectedComponents, cutSelectedComponents, pasteComponents, deleteSelectedComponents,
    hasSelection, hasClipboard,
  ]);

  const handleScaleChange = (value: number | null) => {
    if (value === null) return;
    const clampedValue = Math.max(minScale, Math.min(maxScale, value / 100));
    setCurrentScale(clampedValue);
    canvasRef.current?.zoomTo(clampedValue);
  };

  const formatScale = (value: number) => Math.round(value * 100);

  const handleUndo = useCallback(() => {
    if (canUndo) undo();
  }, [canUndo, undo]);

  const handleRedo = useCallback(() => {
    if (canRedo) redo();
  }, [canRedo, redo]);

  const toolbarItems = useMemo(() => [
    {
      icon: 'icon-chexiao',
      key: 'undo',
      tooltip: '撤销 (Ctrl+Z)',
      onClick: handleUndo,
      position: 'left',
      disabled: !canUndo,
    },
    {
      icon: 'icon-zhongzuo',
      key: 'redo',
      tooltip: '重做 (Ctrl+Y)',
      onClick: handleRedo,
      position: 'left',
      disabled: !canRedo,
    },
    {
      icon: 'icon-lishijilu',
      key: 'history',
      tooltip: '历史记录',
      onClick: () => setShowHistory(!showHistory),
      position: 'left',
      active: showHistory,
    },
    {
      icon: 'icon-zhuashou',
      key: ToolMode.HAND,
      tooltip: '抓手',
      onClick: () => setToolMode(ToolMode.HAND),
      position: 'right',
    },
    {
      icon: 'icon-shubiaojiantou',
      key: ToolMode.MOUSE,
      tooltip: '鼠标',
      onClick: () => setToolMode(ToolMode.MOUSE),
      position: 'right',
    },
    {
      icon: 'icon-shiyingpingmu',
      key: 'fit-screen',
      tooltip: '适应屏幕',
      onClick: () => canvasRef.current?.zoomToFit(),
      position: 'right',
    },
    {
      icon: 'icon-quark-yi-bi-yi',
      key: 'original-size',
      tooltip: '原始尺寸',
      onClick: () => canvasRef.current?.zoomTo(1),
      position: 'right',
    },
  ], [canvasRef, setToolMode, handleUndo, handleRedo, canUndo, canRedo, showHistory]);

  return (
    <div className="toolbar">
      <div className='toolbar-left'>
        <div className='toolbar-left-items'>
          {toolbarItems.filter((item) => item.position === 'left').map((item) => (
            <div
              className={`toolbar-left-items-item${item.disabled ? ' disabled' : ''}${item.active ? ' active' : ''}`}
              key={item.key}
              onClick={item.disabled ? undefined : item.onClick}
              title={item.tooltip}
            >
              {item.icon && <i className={`iconfont ${item.icon}`} />}
            </div>
          ))}
        </div>
      </div>
      <div className="toolbar-right">
        {showMore && (
          <div className="toolbar-right-items">
            {toolbarItems.filter((item) => item.position === 'right').map((item) => (
              <div
                className={`toolbar-right-items-item${toolMode === item.key ? ' active' : ''}`}
                key={item.key}
                onClick={item.onClick}
                title={item.tooltip}
              >
                {item.icon && <i className={`iconfont ${item.icon}`} />}
              </div>
            ))}
          </div>
        )}
        <div className="toolbar-right-scale-btn">
          <InputNumber
            className="toolbar-right-scale-btn-input"
            mode="spinner"
            size="small"
            value={formatScale(currentScale)}
            onChange={handleScaleChange}
            formatter={(value) => `${value}%`}
            parser={(value) => parseFloat(value?.replace('%', '') || '0')}
            min={formatScale(minScale)}
            max={formatScale(maxScale)}
            step={0.1}
            precision={0}
            onStep={(_value, info) => {
              if (info.type === 'up') {
                canvasRef.current?.zoomIn();
              } else {
                canvasRef.current?.zoomOut();
              }
            }}
          />
        </div>
      </div>

      <div className="toolbar-more" onClick={() => setShowMore(!showMore)}>
        <i className={`iconfont ${showMore ? 'icon-xiangyouzhankai' : 'icon-xiangzuoshouqi'}`} />
      </div>

      <HistoryPanel visible={showHistory} onClose={() => setShowHistory(false)} />
    </div>
  );
};

export default Toolbar;
