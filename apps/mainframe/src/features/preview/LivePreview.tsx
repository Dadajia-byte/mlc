import { useEffect, useRef, useCallback, useState } from 'react';
import { Spin, Segmented } from 'antd';
import type { CanvasSchema } from '@mlc/schema';
import { MicroFrontendBridge, MLC_MESSAGE_TYPE } from './microFrontendBridge';
import './LivePreview.scss';

export type PreviewTarget = 'react' | 'vue';

interface LivePreviewProps {
  schema: CanvasSchema | null;
  visible: boolean;
  onClose?: () => void;
  /** 是否实时同步 Schema 变化 */
  liveSync?: boolean;
}

// 预览服务地址
const PREVIEW_URLS: Record<PreviewTarget, string> = {
  react: '/preview-react.html',
  vue: 'http://localhost:5174',
};

/**
 * 实时预览组件 - 支持微前端通信
 */
export function LivePreview({ schema, visible, onClose, liveSync = true }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const bridgeRef = useRef<MicroFrontendBridge | null>(null);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<PreviewTarget>('vue');

  // 初始化通信桥
  useEffect(() => {
    if (!visible) return;

    const bridge = new MicroFrontendBridge();
    bridgeRef.current = bridge;

    // 监听渲染器就绪
    const unsubReady = bridge.onReady(() => {
      setLoading(false);
      // 就绪后发送当前 Schema
      if (schema) {
        bridge.sendSchema(schema);
      }
    });

    // 监听渲染器事件（可选）
    const unsubEvent = bridge.on(MLC_MESSAGE_TYPE.RENDERER_EVENT, (payload) => {
      console.log('[LivePreview] Renderer event:', payload);
    });

    return () => {
      unsubReady();
      unsubEvent();
      bridge.destroy();
      bridgeRef.current = null;
    };
  }, [visible]);

  // 当 iframe 加载完成时设置引用
  const handleIframeLoad = useCallback(() => {
    if (iframeRef.current && bridgeRef.current) {
      bridgeRef.current.setIframe(iframeRef.current);
    }
  }, []);

  // 实时同步 Schema 变化
  useEffect(() => {
    if (liveSync && bridgeRef.current && schema) {
      bridgeRef.current.sendSchema(schema);
    }
  }, [schema, liveSync]);

  // 切换目标时重置状态
  useEffect(() => {
    if (visible) {
      setLoading(true);
    }
  }, [visible, target]);

  if (!visible) return null;

  const previewUrl = PREVIEW_URLS[target];

  return (
    <div className="live-preview-container">
      <div className="live-preview-header">
        <div className="live-preview-header-left">
          <span className="live-preview-title">实时预览</span>
          <Segmented
            size="small"
            value={target}
            onChange={(val) => setTarget(val as PreviewTarget)}
            options={[
              { label: '🟢 Vue', value: 'vue' },
              { label: '🔵 React', value: 'react' },
            ]}
          />
        </div>
        <div className="live-preview-header-right">
          <span className={`live-preview-status ${loading ? '' : 'connected'}`}>
            {loading ? '连接中...' : '已连接'}
          </span>
          <button className="live-preview-close" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>
      
      <div className="live-preview-content">
        {loading && (
          <div className="live-preview-loading">
            <Spin size="large" tip="等待渲染器连接..." />
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={previewUrl}
          className="live-preview-iframe"
          onLoad={handleIframeLoad}
          title="Live Preview"
        />
      </div>
    </div>
  );
}

export default LivePreview;
