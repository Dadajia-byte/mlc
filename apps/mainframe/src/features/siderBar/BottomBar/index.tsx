import './index.scss';
import { useState, useEffect } from 'react';
import { onSaveTimeChange } from '@/store/canvasStore';

const formatSaveTime = (ts: number) => {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const BottomBar = () => {
  const [linkStatus] = useState({ color: '#65c97a', text: '已连接' });
  const [saveTime, setSaveTime] = useState<string | null>(null);

  useEffect(() => onSaveTimeChange((ts) => setSaveTime(formatSaveTime(ts))), []);

  return (
    <div className="bottom-bar">
      <div className="bottom-bar-left">
        <div className="bottom-bar-status">
          <span className="bottom-bar-status-dot" style={{ backgroundColor: linkStatus.color }} />
          <span className="bottom-bar-status-text">{linkStatus.text}</span>
        </div>
        <span className="bottom-bar-separator">·</span>
        <span className="bottom-bar-save">{saveTime ? `自动保存于 ${saveTime}` : '未保存'}</span>
      </div>
      <div className="bottom-bar-right">
        <span className="bottom-bar-info">桌面端视图</span>
      </div>
    </div>
  );
};

export default BottomBar;
