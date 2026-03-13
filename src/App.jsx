import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, AlertCircle, ArrowRight, LayoutGrid, ScrollText, Play, Pause, Instagram, Mail } from 'lucide-react';

// ==============================================================================
// 🛠️ 网站配置区
// ==============================================================================

const SITE_CONFIG = {
  name: "ALEX.W",
  email: "hello@alex.com",
  instagram: "@alex.photos"
};

// 📌 调整分类顺序：Portrait First
const ALBUM_CATEGORIES = [
  { id: 'portrait', label: 'Portrait', folder: 'portarit' },
  { id: 'landscape', label: 'Landscape', folder: 'landscape' },
  { id: 'street', label: 'Street', folder: 'street' },
  { id: 'bw', label: 'B&W', folder: 'bw' }
];

// ==============================================================================
// 🤖 自动导入逻辑
// ==============================================================================

/**
 * ⚠️ 再次提醒 (REMINDER):
 * 1. 在本地 VS Code 中，请【取消注释】下面这一行 `import.meta.glob` 的代码。
 * 2. 确保您的文件夹结构是: src/photos/bw/xxx.jpg, src/photos/street/xxx.jpg 等。
 */
const imagesRecord = import.meta.glob('/src/photos/**/*.{jpg,jpeg,png,JPG,JPEG,PNG,webp}', { eager: true, as: 'url' });

// 这是一个占位符，防止在线预览报错。本地请忽略。
//const imagesRecord = {}; 

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

// 1. 初始化空数组
ALBUM_CATEGORIES.forEach(cat => {
  LOCAL_ALBUMS[cat.id] = [];
});

// 2. 遍历扫描到的文件并分配到对应分类
for (const path in imagesRecord) {
  hasLocalImages = true;
  const parts = path.split('/');
  
  const folderName = parts[parts.length - 2].toLowerCase();
  const fileName = parts[parts.length - 1];

  const matchedCategory = ALBUM_CATEGORIES.find(cat => cat.folder.toLowerCase() === folderName);

  if (matchedCategory) {
    LOCAL_ALBUMS[matchedCategory.id].push({
      src: imagesRecord[path],
      title: fileName.split('.')[0]
    });
  }
}

// 3. 随机排序
Object.keys(LOCAL_ALBUMS).forEach(key => {
  LOCAL_ALBUMS[key] = shuffleArray(LOCAL_ALBUMS[key]);
});

// 4. 生成演示数据 (如果没有本地图片)
if (!hasLocalImages) {
  const demoImgs = (seed) => [
    { src: `https://images.unsplash.com/photo-1543362906-ac1b4f87eec6?q=80&w=800`, title: "Contrast", aspect: "portrait" },
    { src: `https://images.unsplash.com/photo-1513279922550-250c2129b7b0?q=80&w=1200`, title: "Shadows", aspect: "landscape" },
    { src: `https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800`, title: "Mist", aspect: "portrait" },
    { src: `https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200`, title: "Yosemite", aspect: "landscape" },
    { src: `https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=800`, title: "Tokyo", aspect: "portrait" },
    { src: `https://images.unsplash.com/photo-1554048612-387768052bf7?q=80&w=800`, title: "Coffee", aspect: "square" },
    { src: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800`, title: "Gaze", aspect: "portrait" },
    { src: `https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1200`, title: "Red", aspect: "landscape" },
    { src: `https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=1200`, title: "Lines", aspect: "landscape" },
  ];
  ALBUM_CATEGORIES.forEach(cat => LOCAL_ALBUMS[cat.id] = demoImgs(cat.id));
}

// ==============================================================================
// 🎨 布局辅助
// ==============================================================================
const getRandomLayout = (index) => {
  const alignments = ['self-start', 'self-center', 'self-end'];
  const heights = ['h-[40vh]', 'h-[50vh]', 'h-[65vh]'];
  
  const alignIndex = (index * 7) % 3;
  const heightIndex = (index * 13) % 3;
  
  return {
    align: alignments[alignIndex],
    height: heights[heightIndex]
  };
};

// ==============================================================================
// ⚛️ Components
// ==============================================================================

const Lightbox = ({ item, onClose, onNext, onPrev, hasNext, hasPrev }) => {
  if (!item) return null;
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev, hasNext, hasPrev]);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-300 select-none">
      <div className="flex justify-end items-center p-8 z-10">
        <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full transition-colors group">
          <X size={32} strokeWidth={1} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>
      <div 
        className="flex-1 flex flex-col items-center justify-center relative p-8"
        onContextMenu={(e) => e.preventDefault()} // 禁止右键菜单
      >
        <img 
          src={item.src} 
          alt={item.title} 
          className="max-w-[90vw] max-h-[80vh] object-contain shadow-2xl pointer-events-none" 
          draggable="false" // 禁止拖拽
          onContextMenu={(e) => e.preventDefault()} // 禁止右键
        />
        {hasPrev && (
          <button onClick={onPrev} className="absolute left-8 top-1/2 -translate-y-1/2 p-6 hover:scale-110 transition-transform">
            <ChevronLeft size={48} strokeWidth={0.5} />
          </button>
        )}
        {hasNext && (
          <button onClick={onNext} className="absolute right-8 top-1/2 -translate-y-1/2 p-6 hover:scale-110 transition-transform">
            <ChevronRight size={48} strokeWidth={0.5} />
          </button>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState(ALBUM_CATEGORIES[0].id);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [viewMode, setViewMode] = useState('horizontal');
  const scrollContainerRef = useRef(null);

  // 🛡️ 全局安全保护：禁用右键菜单
  useEffect(() => {
    const handleContextmenu = (e) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextmenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextmenu);
    };
  }, []);

  // 🖱️ 自动滚动逻辑
  useEffect(() => {
    if (viewMode !== 'horizontal') return;

    const container = scrollContainerRef.current;
    if (!container) return;

    let animationFrameId;
    const scrollSpeed = 0.5; 

    const animate = () => {
      if (container && !isHoveringImage && isAutoPlaying) {
        container.scrollLeft += scrollSpeed;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isHoveringImage, activeTab, viewMode, isAutoPlaying]);

  // 🖱️ 鼠标滚轮逻辑
  useEffect(() => {
    if (viewMode !== 'horizontal') return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (window.innerWidth > 768) {
        if (e.deltaY !== 0) {
          e.preventDefault();
          container.scrollLeft += e.deltaY;
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [activeTab, viewMode]);

  const currentImages = LOCAL_ALBUMS[activeTab] || [];
  
  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(-1);
  const nextImage = () => setLightboxIndex((prev) => (prev + 1) < currentImages.length ? prev + 1 : prev);
  const prevImage = () => setLightboxIndex((prev) => (prev - 1) >= 0 ? prev - 1 : prev);

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'horizontal' ? 'grid' : 'horizontal');
  };

  return (
    // 添加 select-none 禁止文字/图片选中
    <div className={`h-screen w-full bg-[#fdfdfd] text-neutral-900 font-sans selection:bg-transparent selection:text-neutral-900 flex flex-col select-none ${viewMode === 'grid' ? 'overflow-y-auto' : 'overflow-hidden'}`}>
      
      {/* 1. Header */}
      <header className="fixed top-0 left-0 w-full z-40 px-8 py-8 flex justify-between items-start pointer-events-none bg-gradient-to-b from-white/80 to-transparent">
        <div className="pointer-events-auto">
          <h1 className="text-2xl font-black tracking-tighter uppercase cursor-pointer" onClick={() => window.location.reload()}>
            {SITE_CONFIG.name}
          </h1>
          <p className="text-[10px] text-gray-400 mt-1 tracking-[0.2em] uppercase">Visual Portfolio</p>
        </div>

        <div className="flex flex-col items-end gap-6 pointer-events-auto">
          <button 
            onClick={toggleViewMode}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-gray-500 transition-colors md:hidden"
            title={viewMode === 'horizontal' ? "Switch to Grid View" : "Switch to Scroll View"}
          >
            {viewMode === 'horizontal' ? <LayoutGrid size={16} /> : <ScrollText size={16} />}
          </button>

          <nav className="flex flex-col items-end gap-1">
            {ALBUM_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveTab(cat.id);
                  setViewMode('horizontal');
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                  }
                }}
                className={`text-sm font-medium tracking-widest uppercase transition-all duration-300 flex items-center gap-3 group ${
                  activeTab === cat.id ? 'text-black translate-x-0' : 'text-gray-300 hover:text-gray-500 translate-x-2 hover:translate-x-0'
                }`}
              >
                <span className={`h-[1px] bg-black transition-all duration-300 ${activeTab === cat.id ? 'w-8' : 'w-0'}`}></span>
                {cat.label}
                <span className="text-[9px] font-normal align-top opacity-50">0{idx + 1}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* 2. Main Content Area */}
      
      {/* MODE A: Horizontal Scroll */}
      {viewMode === 'horizontal' && (
        <main 
          ref={scrollContainerRef}
          className="flex-1 w-full overflow-x-auto overflow-y-hidden flex items-center px-[10vw] md:px-[15vw] hide-scrollbar"
          style={{ scrollBehavior: 'auto' }} 
        >
          <div className="flex gap-16 md:gap-40 h-[70vh] items-center py-10 min-w-max">
            
            {/* Title Card */}
            <div className="w-[30vw] md:w-[20vw] shrink-0 flex flex-col justify-center select-text">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-black rounded-full"></span>
                Selected Works
              </span>
              <h2 className="text-6xl md:text-8xl font-thin tracking-tighter leading-[0.8] text-gray-900 mb-6">
                {ALBUM_CATEGORIES.find(c => c.id === activeTab)?.label}
              </h2>
              <div className="w-16 h-[1px] bg-gray-300 mb-6"></div>
              <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
                Scroll horizontally or auto-play. <br/>
                Hover image to pause.
              </p>
            </div>

            {!hasLocalImages && (
              <div className="w-80 p-6 border border-dashed border-gray-300 rounded text-xs text-gray-400">
                <AlertCircle className="mb-2" />
                <strong>Dev Mode:</strong> <br/>
                Uncomment <code>import.meta.glob</code> in VS Code to load your local photos.
              </div>
            )}

            {/* Images */}
            {currentImages.map((img, index) => {
              const layout = getRandomLayout(index);
              
              return (
                <div 
                  key={index}
                  onClick={() => openLightbox(index)}
                  onMouseEnter={() => setIsHoveringImage(true)}
                  onMouseLeave={() => setIsHoveringImage(false)}
                  className={`relative shrink-0 group cursor-pointer ${layout.align} transition-all duration-700 hover:scale-[1.02]`}
                >
                  <span className="absolute -top-8 -left-4 text-[10px] font-mono text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    No. {String(index + 1).padStart(3, '0')}
                  </span>

                  <div 
                    className={`overflow-hidden transition-all duration-500 shadow-lg group-hover:shadow-2xl ${layout.height}`}
                    onContextMenu={(e) => e.preventDefault()} // 禁止右键
                  >
                    <img
                      src={img.src}
                      alt={img.title}
                      className="h-full w-auto object-cover max-w-[80vw] pointer-events-none" // pointer-events-none 防止拖拽但保留点击事件在父元素
                      draggable="false" // 禁止拖拽
                      onContextMenu={(e) => e.preventDefault()} 
                    />
                  </div>
                </div>
              );
            })}
            
            <div className="w-[10vw] shrink-0"></div>
          </div>
        </main>
      )}

      {/* MODE B: Grid View */}
      {viewMode === 'grid' && (
        <main className="flex-1 w-full pt-40 px-6 md:px-12 pb-20 max-w-[1920px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
           <div className="mb-12 flex justify-between items-end">
             <div>
               <h2 className="text-4xl font-light tracking-tighter mb-2">
                 {ALBUM_CATEGORIES.find(c => c.id === activeTab)?.label}
               </h2>
               <p className="text-gray-400 text-xs uppercase tracking-widest">
                 Full Collection
               </p>
             </div>
             
             <button 
               onClick={toggleViewMode} 
               className="text-xs font-bold uppercase tracking-widest hover:text-gray-500 flex items-center gap-2"
             >
               <X size={16} /> Close Grid
             </button>
           </div>

           <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8">
            {currentImages.map((img, index) => (
              <div 
                key={index}
                onClick={() => openLightbox(index)}
                className="break-inside-avoid group cursor-pointer relative"
                onContextMenu={(e) => e.preventDefault()}
              >
                <div className="w-full bg-gray-50 overflow-hidden relative">
                  <img
                    src={img.src}
                    alt={img.title}
                    loading="lazy"
                    className="w-full h-auto object-cover transition-all duration-700 group-hover:opacity-90 pointer-events-none"
                    draggable="false"
                  />
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors duration-300"></div>
                </div>
              </div>
            ))}
           </div>
        </main>
      )}

      {/* 3. Footer */}
      <footer className="fixed bottom-0 left-0 w-full p-8 flex justify-between items-end pointer-events-none text-[10px] text-gray-400 uppercase tracking-widest">
        <div className="pointer-events-auto flex items-center gap-6">
          <span>{currentImages.length} Photographs</span>
          
          {viewMode === 'horizontal' && (
            <React.Fragment>
               <button 
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="flex items-center gap-2 font-bold hover:text-black hover:scale-105 transition-all cursor-pointer text-gray-500"
                title={isAutoPlaying ? "Pause Auto-Scroll" : "Start Auto-Scroll"}
              >
                {isAutoPlaying ? <Pause size={12} /> : <Play size={12} />}
                {isAutoPlaying ? "Pause" : "Play"}
              </button>

              <div className="w-[1px] h-3 bg-gray-300"></div>

              <button 
                onClick={toggleViewMode}
                className="flex items-center gap-2 font-bold hover:text-black hover:scale-105 transition-all cursor-pointer text-gray-500"
              >
                <LayoutGrid size={12} />
                View Grid
              </button>
            </React.Fragment>
          )}
        </div>

        <div className="text-right pointer-events-auto flex flex-col items-end gap-2">
          <div className="flex items-center gap-4 text-gray-400">
             <a href={`https://instagram.com/${SITE_CONFIG.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="hover:text-black transition-colors">
               <Instagram size={14} />
             </a>
             <a href={`mailto:${SITE_CONFIG.email}`} className="hover:text-black transition-colors">
               <Mail size={14} />
             </a>
          </div>
          <span>© {new Date().getFullYear()} {SITE_CONFIG.name}</span>
        </div>
      </footer>

      {/* Lightbox */}
      {lightboxIndex >= 0 && (
        <Lightbox 
          item={currentImages[lightboxIndex]} 
          onClose={closeLightbox}
          onNext={nextImage}
          onPrev={prevImage}
          hasNext={lightboxIndex < currentImages.length - 1}
          hasPrev={lightboxIndex > 0}
        />
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}