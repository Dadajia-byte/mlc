import { useState, useCallback, useEffect, useRef } from 'react';
import useCanvasStore from '@/store/canvasStore';
import { ToolMode } from '@/types/schema';
import type { CanvasRef } from '@/features/editor/components/Canvas';
import HistoryPanel from '@/features/editor/components/HistoryPanel';
import { Undo2, Redo2, History, MousePointer2, Hand, ZoomOut, ZoomIn, Maximize, Eye, Download, Upload } from 'lucide-react';
import styles from './index.module.scss';

const avator = new URL('../../assets/temp/avator.png', import.meta.url).href;

interface HeaderProps {
  canvasRef: React.RefObject<CanvasRef>;
  scale: number;
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  isPreview?: boolean;
  onTogglePreview?: () => void;
}

const Header = ({ canvasRef, scale, toolMode, setToolMode, isPreview, onTogglePreview }: HeaderProps) => {
  const {
    canvas,
    setCanvas,
    undo, redo, historyIndex, history,
    selectedComponents,
    clipboard,
    copySelectedComponents, cutSelectedComponents, pasteComponents, deleteSelectedComponents,
    bringForward, sendBackward, bringToFront, sendToBack,
    updateComponent,
    groupComponents, ungroupComponents,
  } = useCanvasStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const hasSelection = selectedComponents.length > 0;
  const hasClipboard = clipboard.length > 0;

  const [projectName, setProjectName] = useState('未命名项目');
  const [isEditing, setIsEditing] = useState(false);
  const [currentScale, setCurrentScale] = useState(scale);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setCurrentScale(scale); }, [scale]);

  // 全局键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      // @ts-expect-error userAgentData
      const isMac = navigator.userAgentData?.platform === 'macOS' || /Mac|iPhone|iPad/.test(navigator.userAgent);
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); if (canUndo) undo(); }
      else if (mod && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); if (canRedo) redo(); }
      else if (mod && e.key === 'c') { e.preventDefault(); if (hasSelection) copySelectedComponents(); }
      else if (mod && e.key === 'x') { e.preventDefault(); if (hasSelection) cutSelectedComponents(); }
      else if (mod && e.key === 'v') { e.preventDefault(); if (hasClipboard) pasteComponents(); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && !mod) { e.preventDefault(); if (hasSelection) deleteSelectedComponents(); }
      else if (mod && e.key === 'a') {
        e.preventDefault();
        if (canvas) useCanvasStore.getState().setSelectedComponents(canvas.components.map(c => c.id));
      }
      else if (mod && !e.shiftKey && e.key === ']') { e.preventDefault(); if (selectedComponents.length === 1) bringForward(selectedComponents[0]); }
      else if (mod && !e.shiftKey && e.key === '[') { e.preventDefault(); if (selectedComponents.length === 1) sendBackward(selectedComponents[0]); }
      else if (mod && e.shiftKey && e.key === '}') { e.preventDefault(); if (selectedComponents.length === 1) bringToFront(selectedComponents[0]); }
      else if (mod && e.shiftKey && e.key === '{') { e.preventDefault(); if (selectedComponents.length === 1) sendToBack(selectedComponents[0]); }
      else if (mod && e.key === 'l') {
        e.preventDefault();
        if (selectedComponents.length === 1 && canvas) {
          const comp = canvas.components.find(c => c.id === selectedComponents[0]);
          if (comp) updateComponent(comp.id, { editor: { ...comp.editor, locked: !comp.editor?.locked } });
        }
      }
      else if (mod && e.key === 'h') {
        e.preventDefault();
        if (selectedComponents.length === 1 && canvas) {
          const comp = canvas.components.find(c => c.id === selectedComponents[0]);
          if (comp) updateComponent(comp.id, { editor: { ...comp.editor, visible: comp.editor?.visible === false } });
        }
      }
      // 方向键微调
      else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !mod) {
        if (selectedComponents.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const updates = selectedComponents.map(id => ({
            id,
            deltaX: e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0,
            deltaY: e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0,
          }));
          useCanvasStore.getState().updateComponentsPosition(updates);
        }
      }
      // 编组 Cmd+G
      else if (mod && !e.shiftKey && e.key === 'g') {
        e.preventDefault();
        if (selectedComponents.length >= 2) groupComponents();
      }
      // 取消编组 Cmd+Shift+G
      else if (mod && e.shiftKey && (e.key === 'G' || e.key === 'g')) {
        e.preventDefault();
        if (selectedComponents.length === 1 && canvas) {
          const comp = canvas.components.find(c => c.id === selectedComponents[0]);
          if (comp?.isGroup) ungroupComponents();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo, copySelectedComponents, cutSelectedComponents, pasteComponents,
    deleteSelectedComponents, hasSelection, hasClipboard, selectedComponents, canvas,
    bringForward, sendBackward, bringToFront, sendToBack, updateComponent,
    groupComponents, ungroupComponents]);

  const handleZoomIn = useCallback(() => canvasRef.current?.zoomIn(), [canvasRef]);
  const handleZoomOut = useCallback(() => canvasRef.current?.zoomOut(), [canvasRef]);
  const handleZoomFit = useCallback(() => canvasRef.current?.zoomToFit(), [canvasRef]);
  const handleZoom100 = useCallback(() => canvasRef.current?.zoomTo(1), [canvasRef]);

  // 导出 JSON
  const handleExport = useCallback(() => {
    if (!canvas) return;
    const json = JSON.stringify(canvas, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName || 'canvas'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [canvas, projectName]);

  // 导入 JSON
  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (data && data.components && data.width && data.height) {
          setCanvas(data);
        }
      } catch { /* invalid json */ }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [setCanvas]);

  return (
    <div className={styles.header}>
      {/* 左侧: Logo + 项目名 */}
      <div className={styles.left}>
        <div className={styles.logo}>LC</div>
        {isEditing ? (
          <input
            className={styles.projectInput}
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
            autoFocus
          />
        ) : (
          <span className={styles.projectName} onClick={() => setIsEditing(true)}>{projectName}</span>
        )}
      </div>

      {/* 中间: 工具栏 */}
      <div className={styles.center}>
        {/* 撤销/重做/历史 */}
        <div className={styles.toolGroup}>
          <button className={`${styles.toolBtn} ${!canUndo ? styles.disabled : ''}`} onClick={() => canUndo && undo()} title="撤销 ⌘Z">
            <Undo2 size={16} />
          </button>
          <button className={`${styles.toolBtn} ${!canRedo ? styles.disabled : ''}`} onClick={() => canRedo && redo()} title="重做 ⌘⇧Z">
            <Redo2 size={16} />
          </button>
          <button
            className={`${styles.toolBtn} ${showHistory ? styles.active : ''}`}
            onClick={() => setShowHistory(v => !v)}
            title="历史记录"
          >
            <History size={16} />
          </button>
        </div>
        {showHistory && (
          <HistoryPanel visible={showHistory} onClose={() => setShowHistory(false)} />
        )}

        <div className={styles.divider} />

        {/* 鼠标/抓手 */}
        <div className={styles.toolGroup}>
          <button className={`${styles.toolBtn} ${toolMode === ToolMode.MOUSE ? styles.active : ''}`} onClick={() => setToolMode(ToolMode.MOUSE)} title="选择工具 V">
            <MousePointer2 size={16} />
          </button>
          <button className={`${styles.toolBtn} ${toolMode === ToolMode.HAND ? styles.active : ''}`} onClick={() => setToolMode(ToolMode.HAND)} title="抓手工具 H">
            <Hand size={16} />
          </button>
        </div>

        <div className={styles.divider} />

        {/* 缩放 */}
        <div className={styles.toolGroup}>
          <button className={styles.toolBtn} onClick={handleZoomOut} title="缩小">
            <ZoomOut size={16} />
          </button>
          <span className={styles.scaleText} onClick={handleZoom100} title="点击恢复100%">{Math.round(currentScale * 100)}%</span>
          <button className={styles.toolBtn} onClick={handleZoomIn} title="放大">
            <ZoomIn size={16} />
          </button>
          <button className={styles.toolBtn} onClick={handleZoomFit} title="适应屏幕">
            <Maximize size={16} />
          </button>
        </div>
      </div>

      {/* 右侧: 操作 + 用户 */}
      <div className={styles.right}>
        <button className={styles.actionBtn} onClick={handleImport} title="导入 JSON">
          <Upload size={16} />
          <span>导入</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button className={`${styles.actionBtn} ${isPreview ? styles.active : ''}`} onClick={onTogglePreview} title="预览">
          <Eye size={16} />
          <span>预览</span>
        </button>
        <button className={`${styles.actionBtn} ${styles.primary}`} onClick={handleExport} title="导出 JSON">
          <Download size={16} />
          <span>导出</span>
        </button>
        <div className={styles.avatar}>
          <img src={avator} alt="avatar" />
        </div>
      </div>
    </div>
  );
};

export default Header;
