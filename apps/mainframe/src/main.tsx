import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { initFlexible } from '@mlc/utils'
import './styles/normalize.scss'
import { initMaterials } from './registry/index'
import 'antd/dist/antd.css'; // 引入 Ant Design 样式(后续再引入优化)
import './assets/icons/iconfont/iconfont.css'

initFlexible({
  designWidth: 1920,
  maxWidth: 1920,
  baseCount: 16,
});

// 初始化物料
initMaterials();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
