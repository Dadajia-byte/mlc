import '@/styles/app.scss'
import { useRef, useState, useCallback } from 'react'
import Header from './features/header'
import { LeftBar, RightBar, BottomBar } from './features/siderBar'
import Editor from './features/editor'
import { ToolMode } from '@/types/schema'
import type { CanvasRef } from '@/features/editor/components/Canvas'

function App() {
  const canvasRef = useRef<CanvasRef>(null);
  const [toolMode, setToolMode] = useState<ToolMode>(ToolMode.MOUSE);
  const [scale, setScale] = useState(1);
  const [isPreview, setIsPreview] = useState(false);

  const handleViewportChange = useCallback(() => {
    if (canvasRef.current) {
      setScale(canvasRef.current.getViewport().scale);
    }
  }, []);

  const handleTogglePreview = useCallback(() => {
    setIsPreview(prev => !prev);
  }, []);

  return (
    <div className="app">
      <Header
        canvasRef={canvasRef}
        scale={scale}
        toolMode={toolMode}
        setToolMode={setToolMode}
        isPreview={isPreview}
        onTogglePreview={handleTogglePreview}
      />
      <main className="main-content">
        {!isPreview && <LeftBar />}
        <Editor
          canvasRef={canvasRef}
          toolMode={toolMode}
          setToolMode={setToolMode}
          onViewportChange={handleViewportChange}
          isPreview={isPreview}
        />
        {!isPreview && <RightBar />}
      </main>
      <BottomBar />
    </div>
  )
}

export default App
