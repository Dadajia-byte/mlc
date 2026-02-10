import { useEffect, useRef, useCallback, useState } from 'react';
import { Spin } from 'antd';
import type { CanvasSchema } from '@mlc/schema';
import './index.scss';

export type PreviewTarget = 'react' | 'vue';

interface PreviewProps {
  schema: CanvasSchema | null;
  target?: PreviewTarget;
  visible: boolean;
  onClose?: () => void;
}

// 默认预览服务地址
const PREVIEW_URLS: Record<PreviewTarget, string> = {
  react: '/preview-react.html', // React 预览页
  vue: 'http://localhost:5174', // Vue renderer 子应用
};

/**
 * 预览组件 - 使用 iframe 加载渲染器
 */
export function Preview({ schema, target = 'vue', visible, onClose }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [iframeReady, setIframeReady] = useState(false);

  // 监听 iframe 就绪消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'MLC_RENDERER_READY') {
        setIframeReady(true);
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 当 iframe 就绪且 schema 变化时，发送 schema
  useEffect(() => {
    if (iframeReady && schema && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'MLC_SCHEMA_UPDATE',
          payload: schema,
        },
        '*'
      );
    }
  }, [iframeReady, schema]);

  // 重新加载时重置状态
  useEffect(() => {
    if (visible) {
      setLoading(true);
      setIframeReady(false);
    }
  }, [visible, target]);

  const handleIframeLoad = useCallback(() => {
    // iframe 加载完成后，等待渲染器发送就绪消息
    // 如果 3 秒内没收到，也标记为就绪
    setTimeout(() => {
      if (!iframeReady) {
        setIframeReady(true);
        setLoading(false);
        // 尝试发送 schema
        if (schema && iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            {
              type: 'MLC_SCHEMA_UPDATE',
              payload: schema,
            },
            '*'
          );
        }
      }
    }, 3000);
  }, [iframeReady, schema]);

  if (!visible) return null;

  const previewUrl = PREVIEW_URLS[target];

  return (
    <div className="preview-container">
      <div className="preview-header">
        <div className="preview-header-title">
          预览 ({target === 'vue' ? 'Vue + Element Plus' : 'React + Antd'})
        </div>
        <div className="preview-header-actions">
          <button className="preview-header-close" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>
      <div className="preview-content">
        {loading && (
          <div className="preview-loading">
            <Spin size="large" tip="加载预览..." />
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={previewUrl}
          className="preview-iframe"
          onLoad={handleIframeLoad}
          title="Preview"
        />
      </div>
    </div>
  );
}

/**
 * 在新窗口中打开预览
 */
export function openPreviewWindow(schema: CanvasSchema, target: PreviewTarget = 'vue') {
  const previewUrl = PREVIEW_URLS[target];
  
  // 将 schema 存储到 localStorage
  const previewKey = `mlc_preview_schema_${Date.now()}`;
  localStorage.setItem(previewKey, JSON.stringify(schema));
  
  // 打开新窗口，传递 schema key
  const url = `${previewUrl}?schemaKey=${previewKey}`;
  const previewWindow = window.open(url, '_blank', 'width=1200,height=800');
  
  // 5 分钟后清理 localStorage
  setTimeout(() => {
    localStorage.removeItem(previewKey);
  }, 5 * 60 * 1000);
  
  return previewWindow;
}

export default Preview;
