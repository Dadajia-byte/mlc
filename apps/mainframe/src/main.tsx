import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { initFlexible } from '@mlc/utils'
import './styles/normalize.scss'
import { initMaterials } from './registry/index'
import useDataBindingStore from './store/dataBindingStore'
import 'antd/dist/antd.css'; // 引入 Ant Design 样式(后续再引入优化)

initFlexible({
  designWidth: 1920,
  maxWidth: 1920,
  baseCount: 16,
});

// 初始化物料
initMaterials();

// 初始化数据绑定（从 canvas 加载变量和数据源）
setTimeout(() => {
  useDataBindingStore.getState().initFromCanvas();
}, 0);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
