// UI样式常量
export const STYLES = {
  // 容器样式
  mainContainer: "flex flex-col h-full bg-[#121212] relative overflow-hidden",
  header: "h-16 border-b border-zinc-800 bg-[#1A1A1A] px-6 flex items-center justify-between shrink-0",
  content: "flex-1 overflow-y-auto p-8 space-y-12",
  
  // 卡片样式
  card: "bg-[#141414] border border-zinc-800 rounded-xl overflow-hidden flex flex-col group hover:border-zinc-600 transition-all hover:shadow-lg",
  cardDark: "bg-[#0A0A0A] p-4 rounded-xl border border-zinc-800",
  
  // 按钮样式
  primaryButton: "px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-2 shadow-lg shadow-white/5",
  secondaryButton: "px-4 py-2 bg-[#141414] text-zinc-400 border border-zinc-700 hover:text-white hover:border-zinc-500 rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-2",
  iconButton: "p-2 hover:bg-zinc-800 rounded-full transition-colors",
  smallButton: "px-3 py-1.5 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded text-[10px] font-bold transition-all border border-zinc-700 flex items-center gap-1",
  
  // 输入框样式
  input: "w-full bg-[#141414] border border-zinc-800 rounded px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600",
  textarea: "w-full bg-[#141414] border border-zinc-800 rounded px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none",
  
  // 图片容器样式
  imageContainer: "aspect-video bg-zinc-900 relative rounded-lg overflow-hidden cursor-pointer",
  imagePreview: "w-full h-full object-cover",
  
  // 标签样式
  badge: "px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-zinc-400 font-mono uppercase",
  
  // 模态框样式
  modalOverlay: "absolute inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200",
  modalContainer: "bg-[#141414] border border-zinc-800 w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden",
  modalHeader: "h-16 px-8 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-[#1A1A1A]",
  modalBody: "flex-1 overflow-y-auto p-8",
};

// 网格布局常量
export const GRID_LAYOUTS = {
  cards: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  twoColumn: "grid grid-cols-1 md:grid-cols-2 gap-8",
};

// 默认配置
export const DEFAULTS = {
  language: '中文',
  visualStyle: 'live-action',
  genre: 'Cinematic',
  modelVersion: 'gpt-5.1',
  batchGenerateDelay: 3000, // 批量生成延迟（毫秒）
};

// 地域特征配置
export const REGIONAL_FEATURES = {
  Chinese: {
    character: 'Chinese person, East Asian facial features, Chinese ethnicity, ',
    scene: 'Chinese setting, East Asian architecture and aesthetics, ',
  },
  Japanese: {
    character: 'Japanese person, East Asian facial features, Japanese ethnicity, ',
    scene: 'Japanese setting, Japanese architecture and aesthetics, ',
  },
};

// 语言映射
export const LANGUAGE_MAP: Record<string, keyof typeof REGIONAL_FEATURES> = {
  '中文': 'Chinese',
  'Chinese': 'Chinese',
  '日本語': 'Japanese',
  'Japanese': 'Japanese',
};
