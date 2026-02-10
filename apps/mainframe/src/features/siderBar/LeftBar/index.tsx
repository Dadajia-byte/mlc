import { useState, useMemo } from 'react';
import { getAllComponentsMeta } from '@/registry';
import LayerPanel from './LayerPanel';
import { LayoutGrid, Layers, Search, X } from 'lucide-react';
import './index.scss';

type TabKey = 'materials' | 'layers';

const LeftBar = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('materials');
  const [searchKeyword, setSearchKeyword] = useState('');

  const materials = useMemo(() => getAllComponentsMeta('antd'), []);

  const materialsByCategory = useMemo(() => {
    const grouped: Record<string, typeof materials> = {};
    materials.forEach((m) => {
      if (!grouped[m.category]) grouped[m.category] = [];
      grouped[m.category].push(m);
    });
    return grouped;
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    if (!searchKeyword) return null;
    return materials.filter(
      (m) =>
        m.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        m.name.toLowerCase().includes(searchKeyword.toLowerCase())
    );
  }, [materials, searchKeyword]);

  const handleDragStart = (e: React.DragEvent, componentType: string, library: string) => {
    e.dataTransfer.setData('componentType', componentType);
    e.dataTransfer.setData('componentLibrary', library);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="left-bar">
      {/* Tab */}
      <div className="left-bar-tabs">
        <div
          className={`left-bar-tabs-item ${activeTab === 'materials' ? 'active' : ''}`}
          onClick={() => setActiveTab('materials')}
        >
          <LayoutGrid size={16} />
          <span>组件</span>
        </div>
        <div
          className={`left-bar-tabs-item ${activeTab === 'layers' ? 'active' : ''}`}
          onClick={() => setActiveTab('layers')}
        >
          <Layers size={16} />
          <span>图层</span>
        </div>
      </div>

      {activeTab === 'materials' ? (
        <>
          <div className="left-bar-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="搜索组件..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            {searchKeyword && (
              <X size={14} className="clear" onClick={() => setSearchKeyword('')} />
            )}
          </div>

          <div className="left-bar-content">
            {filteredMaterials ? (
              filteredMaterials.length === 0 ? (
                <div className="left-bar-empty">未找到匹配的组件</div>
              ) : (
                <div className="material-grid">
                  {filteredMaterials.map((m) => (
                    <div
                      key={m.name}
                      className="material-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, m.name, m.library)}
                    >
                      <div className="material-card-preview">
                        {m.thumbnail ? <img src={m.thumbnail} alt={m.title} /> : <LayoutGrid size={20} />}
                      </div>
                      <div className="material-card-name">{m.title}</div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              Object.entries(materialsByCategory).map(([category, items]) => (
                <div key={category} className="material-section">
                  <div className="material-section-title">{category}</div>
                  <div className="material-grid">
                    {items.map((m) => (
                      <div
                        key={m.name}
                        className="material-card"
                        draggable
                        onDragStart={(e) => handleDragStart(e, m.name, m.library)}
                      >
                        <div className="material-card-preview">
                          {m.thumbnail ? <img src={m.thumbnail} alt={m.title} /> : <LayoutGrid size={20} />}
                        </div>
                        <div className="material-card-name">{m.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <LayerPanel />
      )}
    </div>
  );
};

export default LeftBar;
