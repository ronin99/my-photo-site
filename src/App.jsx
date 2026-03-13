import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, AlertCircle, ArrowRight, LayoutGrid, ScrollText, Play, Pause, Instagram, Mail } from 'lucide-react';

// ==============================================================================
// 🛠️ 网站全局配置
// ==============================================================================

const SITE_CONFIG = {
  name: "HARU FUJII",
  email: "fujii.haru@email.com", 
  instagramId: "_hharu_____",
  instagramUrl: "https://www.instagram.com/_hharu_____?igsh=M3loaHdqYmYzeXFk&utm_source=qr"
};

// ==============================================================================
// 🤖 动态文件夹读取逻辑
// ==============================================================================

/**
 * ⚠️ 重要 (Local Dev): 
 * 在本地 VS Code 中，请删除下面这一行开头的 // 符号，以加载您的照片。
 */
const imagesRecord = import.meta.glob('/src/photos/**/*.{jpg,jpeg,png,JPG,JPEG,PNG,webp}', { eager: true, as: 'url' });

//const imagesRecord = {}; 

const FIX_NAMES = {
  "portarit": "Portrait",
  "portrait": "Portrait",
  "bw": "B&W",
  "landscape": "Landscape",
  "street": "Street"
};

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const LOCAL_ALBUMS = {};
let hasLocalImages = false;

for (const path in imagesRecord) {
  hasLocalImages = true;
  const parts = path.split('/');
  const rawFolder = parts[parts.length - 2].toLowerCase();
  const fileName = parts[parts.length - 1];

  if (!LOCAL_ALBUMS[rawFolder]) LOCAL_ALBUMS[rawFolder] = [];
  LOCAL_ALBUMS[rawFolder].push({
    src: imagesRecord[path],
    title: fileName.split('.')[0]
  });
}

const dynamicCategories = Object.keys(LOCAL_ALBUMS).map(folder => ({
  id: folder,
  label: FIX_NAMES[folder] || folder.toUpperCase()
})).sort((a, b) => {
  const order = ["portrait", "portarit", "landscape", "street", "bw"];
  const idxA = order.indexOf(a.id);
  const idxB = order.indexOf(b.id);
  return (idxA > -1 ? idxA : 99) - (idxB > -1 ? idxB : 99);
});

Object.keys(LOCAL_ALBUMS).forEach(k => LOCAL_ALBUMS[k] = shuffleArray(LOCAL_ALBUMS[k]));

if (!hasLocalImages) {
  dynamicCategories.push({ id: 'demo', label: 'PREVIEW' });
  LOCAL_ALBUMS['demo'] = [
    { src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200", title: "Demo 1" },
    { src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200", title: "Demo 2" },
    { src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1200", title: "Demo 3" }
  ];
}

// ==============================================================================
// ⚛️ UI 核心组件
// ==============================================================================

const Lightbox = ({ item, onClose, onNext, onPrev, hasNext, hasPrev }) => {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-300 select-none" onContextMenu={e => e.preventDefault()}>
      <div className="flex justify-end p-6 md:p-8">
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-all hover:rotate-90">
          <X size={28} md:size={32} strokeWidth={1} />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center relative p-4 md:p-8">
        <img src={item.src} className="max-w-full max-h-full md:max-w-[90vw] md:max-h-[80vh] object-contain shadow-2xl pointer-events-none" draggable="false" />
        {hasPrev && <button onClick={onPrev} className="absolute left-4 md:left-8 p-4 bg-white/50 md:bg-transparent rounded-full"><ChevronLeft size={32} md:size={48} strokeWidth={0.5} /></button>}
        {hasNext && <button onClick={onNext} className="absolute right-4 md:right-8 p-4 bg-white/50 md:bg-transparent rounded-full"><ChevronRight size={32} md:size={48} strokeWidth={0.5} /></button>}
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState(dynamicCategories[0]?.id);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [viewMode, setViewMode] = useState('horizontal'); 
  const scrollRef = useRef(null);

  // 全局防盗
  useEffect(() => {
    const handleContext = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContext);
    return () => document.removeEventListener('contextmenu', handleContext);
  }, []);

  // 自动漫游逻辑 (仅限桌面端)
  useEffect(() => {
    if (viewMode !== 'horizontal' || !isAutoPlaying || window.innerWidth < 768) return;
    let frame;
    const animate = () => {
      if (scrollRef.current && !isHoveringImage) {
        scrollRef.current.scrollLeft += 0.8;
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isHoveringImage, activeTab, viewMode, isAutoPlaying]);

  // 滚轮映射 (仅限桌面端)
  useEffect(() => {
    if (viewMode !== 'horizontal' || !scrollRef.current || window.innerWidth < 768) return;
    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        scrollRef.current.scrollLeft += e.deltaY;
      }
    };
    const el = scrollRef.current;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [activeTab, viewMode]);

  const currentImages = LOCAL_ALBUMS[activeTab] || [];

  return (
    <div className={`min-h-screen w-full bg-[#fdfdfd] text-neutral-900 font-sans selection:bg-transparent flex flex-col select-none overflow-x-hidden ${viewMode === 'grid' ? 'overflow-y-auto' : 'md:overflow-hidden overflow-y-auto'}`}>
      
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 w-full z-40 px-6 py-6 md:px-8 md:py-8 flex justify-between items-start pointer-events-none bg-gradient-to-b from-white/95 to-transparent">
        <div className="pointer-events-auto">
          <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase cursor-pointer" onClick={() => window.location.reload()}>{SITE_CONFIG.name}</h1>
          <p className="text-[9px] md:text-[10px] text-gray-400 mt-1 tracking-[0.2em] uppercase font-medium">Visual Portfolio</p>
        </div>
        
        <nav className="pointer-events-auto flex flex-col items-end gap-1.5 md:gap-1">
          {dynamicCategories.map((cat, idx) => (
            <button 
              key={cat.id} 
              onClick={() => { 
                setActiveTab(cat.id); 
                setViewMode('horizontal'); 
                window.scrollTo({top: 0, behavior: 'smooth'});
              }} 
              className={`text-[10px] md:text-sm font-medium tracking-widest uppercase transition-all flex items-center gap-2 md:gap-3 ${activeTab === cat.id ? 'text-black translate-x-0' : 'text-gray-300 hover:text-gray-500 translate-x-1 md:translate-x-2 hover:translate-x-0'}`}
            >
              <span className={`h-[1px] bg-black transition-all duration-300 ${activeTab === cat.id ? 'w-4 md:w-8' : 'w-0'}`}></span>
              {cat.label} <span className="text-[8px] md:text-[9px] opacity-50">0{idx + 1}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* 主展示区 */}
      <main 
        ref={scrollRef} 
        className={`flex-1 w-full flex flex-col md:flex-row items-center hide-scrollbar ${viewMode === 'horizontal' ? 'pt-32 pb-24 md:pt-0 md:pb-0 md:overflow-x-auto overflow-y-visible' : 'pt-40 pb-24 overflow-y-auto'}`}
      >
        {viewMode === 'horizontal' ? (
          /* 核心自适应逻辑：手机端 flex-col (垂直纵向), 桌面端 md:flex-row (横向漫游) */
          <div className="flex flex-col md:flex-row gap-10 md:gap-48 items-center px-6 md:px-[15vw] w-full md:w-auto md:min-w-max">
            
            {/* 封面标题 */}
            <div className="w-full md:w-[25vw] shrink-0 flex flex-col justify-center mb-10 md:mb-0">
              <h2 className="text-5xl md:text-8xl font-thin tracking-tighter leading-none mb-4 md:mb-6">{dynamicCategories.find(c => c.id === activeTab)?.label}</h2>
              <div className="w-10 h-[1px] bg-neutral-200 mb-6"></div>
              <p className="text-gray-400 text-[10px] md:text-xs uppercase tracking-widest leading-loose">Haru Fujii Collection</p>
              <div className="hidden md:block">
                <ArrowRight className="mt-8 animate-pulse text-neutral-300" size={32} strokeWidth={1} />
              </div>
            </div>

            {/* 照片列表 */}
            {currentImages.map((img, index) => (
              <div 
                key={index} 
                onClick={() => setLightboxIndex(index)} 
                onMouseEnter={() => setIsHoveringImage(true)} 
                onMouseLeave={() => setIsHoveringImage(false)}
                className={`relative shrink-0 transition-all duration-1000 md:hover:scale-[1.03] cursor-pointer w-full md:w-auto
                  ${window.innerWidth > 768 ? 
                    ((index % 3 === 0) ? 'self-start mt-12' : (index % 3 === 1) ? 'self-center' : 'self-end mb-12') 
                    : 'mb-6'
                  }
                `}
              >
                <div className="overflow-hidden shadow-xl md:shadow-2xl w-full h-auto md:max-h-[60vh] bg-neutral-50 flex items-center justify-center rounded-sm">
                  {/* 使用 w-full 确保手机端铺满宽度，h-full md:w-auto 确保桌面端维持比例 */}
                  <img 
                    src={img.src} 
                    loading="lazy" 
                    className="w-full h-auto md:h-full md:w-auto object-contain pointer-events-none" 
                    draggable="false" 
                  />
                </div>
              </div>
            ))}
            <div className="hidden md:block w-[10vw] shrink-0"></div>
          </div>
        ) : (
          /* 网格预览模式 */
          <div className="w-full px-6 md:px-16 max-w-[1920px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="mb-12 flex justify-between items-baseline border-b border-neutral-100 pb-8">
               <h2 className="text-3xl md:text-5xl font-light tracking-tighter">{dynamicCategories.find(c => c.id === activeTab)?.label}</h2>
               <button onClick={() => setViewMode('horizontal')} className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-50 transition-opacity"><X size={16} /> Close Grid</button>
             </div>
             <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 md:gap-12 space-y-6 md:space-y-12">
              {currentImages.map((img, index) => (
                <div key={index} onClick={() => setLightboxIndex(index)} className="break-inside-avoid group cursor-pointer relative overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 rounded-sm">
                  <img src={img.src} loading="lazy" className="w-full h-auto object-contain pointer-events-none" draggable="false" />
                </div>
              ))}
             </div>
          </div>
        )}
      </main>

      {/* 底部控制栏 */}
      <footer className="fixed bottom-0 left-0 w-full p-6 md:p-8 flex flex-row justify-between items-end pointer-events-none text-[9px] md:text-[10px] text-gray-400 uppercase tracking-[0.2em] bg-gradient-to-t from-white/95 to-transparent">
        <div className="pointer-events-auto flex items-center gap-4 md:gap-8">
          <span className="hidden sm:inline">{currentImages.length} Photographs</span>
          <div className="flex items-center gap-4 md:gap-6">
            <button onClick={() => setIsAutoPlaying(!isAutoPlaying)} className="hidden md:flex items-center gap-2 font-bold hover:text-black transition-colors">
              {isAutoPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />} {isAutoPlaying ? "Pause" : "Play"}
            </button>
            <button onClick={() => setViewMode(viewMode === 'grid' ? 'horizontal' : 'grid')} className="flex items-center gap-2 font-bold hover:text-black transition-colors">
              <LayoutGrid size={14} md:size={12} /> {viewMode === 'grid' ? "Scroll" : "Grid View"}
            </button>
          </div>
        </div>
        
        <div className="text-right pointer-events-auto flex flex-col items-end gap-2 md:gap-3">
          <div className="flex items-center gap-4 md:gap-5">
             <a href={SITE_CONFIG.instagramUrl} target="_blank" rel="noreferrer" className="hover:text-black transition-colors"><Instagram size={18} md:size={16} strokeWidth={1.5} /></a>
             <a href={`mailto:${SITE_CONFIG.email}`} className="hover:text-black transition-colors"><Mail size={18} md:size={16} strokeWidth={1.5} /></a>
          </div>
          <span className="opacity-60 tracking-normal text-[8px] md:text-[10px]">© {new Date().getFullYear()} {SITE_CONFIG.name}</span>
        </div>
      </footer>

      {/* 灯箱 */}
      {lightboxIndex >= 0 && (
        <Lightbox 
          item={currentImages[lightboxIndex]} 
          onClose={() => setLightboxIndex(-1)} 
          onNext={() => setLightboxIndex(i => (i+1)%currentImages.length)} 
          onPrev={() => setLightboxIndex(i => (i-1+currentImages.length)%currentImages.length)} 
          hasNext={true} 
          hasPrev={true} 
        />
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; } 
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @media (max-width: 768px) {
          body { overflow-y: auto !important; height: auto !important; position: static !important; }
          #root { height: auto !important; overflow: visible !important; }
        }
      `}</style>
    </div>
  );
}