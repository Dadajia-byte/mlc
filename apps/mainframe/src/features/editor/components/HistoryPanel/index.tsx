import { useMemo, useEffect, useRef } from 'react';
import useCanvasStore, { HistoryEntry } from '@/store/canvasStore';
import { CanvasSchema, ComponentSchema } from '@/types/schema';
import { X, Undo2, Redo2 } from 'lucide-react';
import './index.scss';

// 格式化时间：今天显示 HH:mm，其他显示 MM-DD HH:mm
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  
  if (isToday) {
    return time;
  }
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${time}`;
};

// 获取组件显示名称
const getComponentName = (comp: ComponentSchema): string => {
  return comp.props?.children || comp.type || '组件';
};

// 生成历史记录的描述
const getHistoryDescription = (
  current: CanvasSchema,
  prev: CanvasSchema | null,
  index: number
): string => {
  if (index === 0 || !prev) return '初始状态';

  const currentIds = new Set(current.components.map(c => c.id));
  const prevIds = new Set(prev.components.map(c => c.id));

  // 查找新增的组件
  const addedComps = current.components.filter(c => !prevIds.has(c.id));
  if (addedComps.length > 0) {
    if (addedComps.length === 1) {
      return `添加 ${getComponentName(addedComps[0])}`;
    }
    return `添加 ${addedComps.length} 个组件`;
  }

  // 查找删除的组件
  const deletedComps = prev.components.filter(c => !currentIds.has(c.id));
  if (deletedComps.length > 0) {
    if (deletedComps.length === 1) {
      return `删除 ${getComponentName(deletedComps[0])}`;
    }
    return `删除 ${deletedComps.length} 个组件`;
  }

  // 检查位置变化
  const movedComps: ComponentSchema[] = [];
  current.components.forEach(comp => {
    const prevComp = prev.components.find(c => c.id === comp.id);
    if (prevComp && (
      comp.style?.left !== prevComp.style?.left ||
      comp.style?.top !== prevComp.style?.top
    )) {
      movedComps.push(comp);
    }
  });

  if (movedComps.length > 0) {
    if (movedComps.length === 1) {
      return `移动 ${getComponentName(movedComps[0])}`;
    }
    return `移动 ${movedComps.length} 个组件`;
  }

  return '修改属性';
};

interface HistoryPanelProps {
  visible: boolean;
  onClose: () => void;
}

const HistoryPanel = ({ visible, onClose }: HistoryPanelProps) => {
  const { history, historyIndex, undo, redo } = useCanvasStore();
  const panelRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // 排除点击历史按钮本身
      if (target.closest('[title="历史记录"]')) return;
      if (panelRef.current && !panelRef.current.contains(target)) {
        onClose();
      }
    };

    // 延迟添加监听，避免打开时立即触发
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, onClose]);

  const historyItems = useMemo(() => {
    return history.map((entry: HistoryEntry, index: number) => ({
      index,
      description: getHistoryDescription(
        entry.canvas,
        index > 0 ? history[index - 1].canvas : null,
        index
      ),
      componentCount: entry.canvas.components.length,
      timestamp: entry.timestamp,
      isCurrent: index === historyIndex,
    }));
  }, [history, historyIndex]);

  const handleGoTo = (targetIndex: number) => {
    const diff = targetIndex - historyIndex;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) redo();
    } else if (diff < 0) {
      for (let i = 0; i < Math.abs(diff); i++) undo();
    }
  };

  if (!visible) return null;

  return (
    <div className="history-panel" ref={panelRef}>
      <div className="history-panel-header">
        <span className="history-panel-title">历史记录</span>
        <span className="history-panel-count">{history.length} 条</span>
        <button className="history-panel-close" onClick={onClose}>
          <X size={14} />
        </button>
      </div>
      <div className="history-panel-list">
        {historyItems.map((item) => (
          <div
            key={item.index}
            className={`history-panel-item${item.isCurrent ? ' current' : ''}${item.index > historyIndex ? ' future' : ''}`}
            onClick={() => handleGoTo(item.index)}
          >
            <div className="history-panel-item-indicator">
              {item.isCurrent && <div className="history-panel-item-dot" />}
            </div>
            <div className="history-panel-item-content">
              <span className="history-panel-item-desc">{item.description}</span>
              <span className="history-panel-item-meta">{item.componentCount} 个组件</span>
            </div>
            <div className="history-panel-item-right">
              <span className="history-panel-item-time">{formatTime(item.timestamp)}</span>
              <span className='history-panel-item-index'>#{item.index}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="history-panel-footer">
        <button
          className="history-panel-btn"
          disabled={historyIndex <= 0}
          onClick={undo}
        >
          <Undo2 size={14} />
          撤销
        </button>
        <button
          className="history-panel-btn"
          disabled={historyIndex >= history.length - 1}
          onClick={redo}
        >
          重做
          <Redo2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default HistoryPanel;
