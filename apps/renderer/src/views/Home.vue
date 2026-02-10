<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { CanvasRenderer } from '@mlc/renderer-vue';
import type { CanvasSchema } from '@mlc/schema';
import { createElementPlusRegistry } from '../registry';
import 'element-plus/dist/index.css';

const registry = createElementPlusRegistry();
const schema = ref<CanvasSchema | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const isEmbedded = ref(false); // 是否以 iframe 嵌入

// 消息处理函数
const handleMessage = (event: MessageEvent) => {
  // MLC 统一消息协议
  if (event.data?.type === 'MLC_SCHEMA_UPDATE') {
    schema.value = event.data.payload;
    loading.value = false;
  }
  // 兼容旧协议
  else if (event.data?.type === 'SET_SCHEMA' && event.data?.schema) {
    schema.value = event.data.schema;
    loading.value = false;
  }
};

// 从 URL 参数或 postMessage 获取 Schema
onMounted(() => {
  // 检查是否以 iframe 嵌入
  isEmbedded.value = window.parent !== window;
  
  // 方式1: URL 参数 (schema JSON)
  const urlParams = new URLSearchParams(window.location.search);
  const schemaParam = urlParams.get('schema');
  
  if (schemaParam) {
    try {
      schema.value = JSON.parse(decodeURIComponent(schemaParam));
      loading.value = false;
    } catch (e) {
      error.value = 'Schema 解析失败';
      loading.value = false;
    }
    return;
  }

  // 方式2: URL 参数 (localStorage key)
  const schemaKey = urlParams.get('schemaKey');
  if (schemaKey) {
    const stored = localStorage.getItem(schemaKey);
    if (stored) {
      try {
        schema.value = JSON.parse(stored);
        loading.value = false;
        return;
      } catch (e) {
        console.error('解析 schema 失败:', e);
      }
    }
  }

  // 方式3: postMessage（微前端/iframe 场景）
  window.addEventListener('message', handleMessage);

  // 通知父窗口已就绪
  if (isEmbedded.value) {
    window.parent.postMessage({ type: 'MLC_RENDERER_READY' }, '*');
  }

  // 方式4: 使用 Demo Schema（仅在独立访问时）
  setTimeout(() => {
    if (!schema.value && !isEmbedded.value) {
      schema.value = getDemoSchema();
      loading.value = false;
    } else if (!schema.value && isEmbedded.value) {
      // iframe 模式下不加载 demo，保持等待状态
      loading.value = false;
    }
  }, 1000);
});

onUnmounted(() => {
  window.removeEventListener('message', handleMessage);
});

// Demo Schema
function getDemoSchema(): CanvasSchema {
  return {
    id: 'demo-canvas',
    name: 'Vue 渲染器 Demo',
    width: 800,
    height: 600,
    components: [
      {
        id: 'card-1',
        type: 'Card',
        library: 'element-plus',
        props: {
          header: 'Vue 渲染器演示',
          children: '这是使用 Element Plus 组件渲染的卡片',
        },
        style: {
          position: 'absolute',
          left: 50,
          top: 50,
          width: 300,
          height: 150,
        },
        children: [],
      },
      {
        id: 'btn-1',
        type: 'Button',
        library: 'element-plus',
        props: {
          type: 'primary',
          children: 'Element Plus 按钮',
        },
        style: {
          position: 'absolute',
          left: 50,
          top: 220,
          width: 150,
          height: 40,
        },
        children: [],
        events: [
          {
            trigger: 'onClick',
            actionType: 'showMessage',
            config: {
              type: 'success',
              content: '按钮被点击了！',
            },
          },
        ],
      },
      {
        id: 'input-1',
        type: 'Input',
        library: 'element-plus',
        props: {
          placeholder: '请输入内容',
          clearable: true,
        },
        style: {
          position: 'absolute',
          left: 50,
          top: 280,
          width: 200,
          height: 40,
        },
        children: [],
      },
      {
        id: 'text-1',
        type: 'Text',
        library: 'element-plus',
        props: {
          children: '这是一段文本内容',
          type: 'primary',
        },
        style: {
          position: 'absolute',
          left: 50,
          top: 340,
          width: 200,
          height: 24,
        },
        children: [],
      },
      {
        id: 'divider-1',
        type: 'Divider',
        library: 'element-plus',
        props: {
          children: '分割线',
        },
        style: {
          position: 'absolute',
          left: 50,
          top: 380,
          width: 300,
          height: 24,
        },
        children: [],
      },
    ],
  };
}

const canvasStyle = computed(() => ({
  width: schema.value ? `${schema.value.width}px` : '100%',
  height: schema.value ? `${schema.value.height}px` : '100%',
}));
</script>

<template>
  <div class="renderer-page" :class="{ embedded: isEmbedded }">
    <header v-if="!isEmbedded" class="renderer-header">
      <h1>MLC Vue 渲染器</h1>
      <span class="tag">Element Plus</span>
    </header>

    <main class="renderer-content">
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>{{ isEmbedded ? '等待 Schema...' : '加载中...' }}</p>
      </div>
      
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      
      <div v-else-if="schema" class="canvas-container" :style="canvasStyle">
        <CanvasRenderer
          :schema="schema"
          :registry="registry"
          mode="runtime"
        />
      </div>
      
      <div v-else class="empty">
        <p>暂无预览内容</p>
        <p class="empty-hint">请在编辑器中设计页面后预览</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.renderer-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.renderer-page.embedded {
  background: #fff;
}

.renderer-page.embedded .renderer-content {
  padding: 0;
}

.renderer-page.embedded .canvas-container {
  box-shadow: none;
  border-radius: 0;
}

.renderer-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
}

.renderer-header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.tag {
  padding: 2px 8px;
  font-size: 12px;
  color: #409eff;
  background: #ecf5ff;
  border-radius: 4px;
}

.renderer-content {
  padding: 24px;
  display: flex;
  justify-content: center;
}

.canvas-container {
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.loading,
.error,
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  width: 100%;
  background: #fff;
  border-radius: 8px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #eee;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  color: #f56c6c;
}

.empty {
  color: #909399;
}

.empty-hint {
  font-size: 12px;
  margin-top: 8px;
  color: #c0c4cc;
}
</style>
