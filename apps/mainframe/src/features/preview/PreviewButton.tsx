import { useState, useRef, useEffect } from 'react';
import { Play, ChevronDown } from 'lucide-react';
import type { CanvasSchema } from '@mlc/schema';
import { Preview, openPreviewWindow, PreviewTarget } from './index';
import './index.scss';

interface PreviewButtonProps {
  schema: CanvasSchema | null;
}

/**
 * 预览按钮组件 - 支持选择预览目标
 */
export function PreviewButton({ schema }: PreviewButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget>('vue');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handlePreview = (target: PreviewTarget, newWindow: boolean = false) => {
    if (!schema) return;
    
    setShowDropdown(false);
    
    if (newWindow) {
      openPreviewWindow(schema, target);
    } else {
      setPreviewTarget(target);
      setShowPreview(true);
    }
  };

  return (
    <>
      <div className="preview-btn-dropdown" ref={dropdownRef}>
        <button
          className="preview-btn"
          onClick={() => handlePreview('vue')}
          disabled={!schema}
        >
          <Play size={14} />
          预览
          <span
            className="preview-btn-arrow"
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
          >
            <ChevronDown size={14} />
          </span>
        </button>

        {showDropdown && (
          <div className="preview-btn-dropdown-menu">
            <div
              className="preview-btn-dropdown-menu-item"
              onClick={() => handlePreview('vue', false)}
            >
              <span className="preview-btn-dropdown-menu-item-icon">🟢</span>
              Vue (Element Plus)
            </div>
            <div
              className="preview-btn-dropdown-menu-item"
              onClick={() => handlePreview('react', false)}
            >
              <span className="preview-btn-dropdown-menu-item-icon">🔵</span>
              React (Antd)
            </div>
            <div style={{ borderTop: '1px solid #eee', margin: '4px 0' }} />
            <div
              className="preview-btn-dropdown-menu-item"
              onClick={() => handlePreview('vue', true)}
            >
              <span className="preview-btn-dropdown-menu-item-icon">↗</span>
              Vue - 新窗口
            </div>
            <div
              className="preview-btn-dropdown-menu-item"
              onClick={() => handlePreview('react', true)}
            >
              <span className="preview-btn-dropdown-menu-item-icon">↗</span>
              React - 新窗口
            </div>
          </div>
        )}
      </div>

      <Preview
        schema={schema}
        target={previewTarget}
        visible={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </>
  );
}

export default PreviewButton;
