import { useState, useEffect, useMemo } from 'react';
import { InputNumber } from 'antd';
import { ToolMode } from '@/types/schema';
import type { CanvasRef } from '../Canvas';
import './index.scss';

interface ToolbarProps {
  canvasRef: React.RefObject<CanvasRef>;
  scale: number;
  toolMode: ToolMode;
}

const Toolbar = ({ canvasRef, scale, toolMode }: ToolbarProps) => {
  const [showMore, setShowMore] = useState(true);
  const [currentScale, setCurrentScale] = useState(scale);

  const { minScale, maxScale } = canvasRef.current?.config ?? { minScale: 0.2, maxScale: 3 };

  useEffect(() => {
    setCurrentScale(scale);
  }, [scale]);

  const handleScaleChange = (value: number | null) => {
    if (value === null) return;
    const clampedValue = Math.max(minScale, Math.min(maxScale, value / 100));
    setCurrentScale(clampedValue);
    canvasRef.current?.zoomTo(clampedValue);
  };

  const formatScale = (value: number) => Math.round(value * 100);

  const toolbarItems = useMemo(() => [
    {
      icon: 'icon-shouhuajiantou',
      key: ToolMode.HAND,
      tooltip: '抓手',
      onClick: () => canvasRef.current?.setToolMode(ToolMode.HAND),
    },
    {
      icon: 'icon-shubiaojiantou',
      key: ToolMode.MOUSE,
      tooltip: '鼠标',
      onClick: () => canvasRef.current?.setToolMode(ToolMode.MOUSE),
    },
    {
      icon: 'icon-shiyingpingmu',
      key: 'fit-screen',
      tooltip: '适应屏幕',
      onClick: () => canvasRef.current?.zoomToFit(),
    },
    {
      icon: 'icon-quark-yi-bi-yi',
      key: 'original-size',
      tooltip: '原始尺寸',
      onClick: () => canvasRef.current?.zoomTo(1),
    },
  ], [canvasRef]);

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        {showMore && (
          <div className="toolbar-left-items">
            {toolbarItems.map((item) => (
              <div
                className={`toolbar-left-items-item${toolMode === item.key ? ' active' : ''}`}
                key={item.key}
                onClick={item.onClick}
                title={item.tooltip}
              >
                {item.icon && <i className={`iconfont ${item.icon}`} />}
              </div>
            ))}
          </div>
        )}
        <div className="toolbar-left-scale-btn">
          <InputNumber
            className="toolbar-left-scale-btn-input"
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
    </div>
  );
};

export default Toolbar;
