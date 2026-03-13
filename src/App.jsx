import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, AlertCircle, ArrowRight, LayoutGrid, ScrollText, Play, Pause, Instagram, Mail, Menu as MenuIcon } from 'lucide-react';

// ==============================================================================
// 🛠️ 网站配置区
// ==============================================================================

const SITE_CONFIG = {
  name: "HARU",
  email: "", 
  instagramId: "_hharu_____",
  instagramUrl: "https://www.instagram.com/_hharu_____?igsh=M3loaHdqYmYzeXFk&utm_source=qr"
};

const ALBUM_CATEGORIES = [
  { id: 'portrait', label: 'Portrait', folder: 'portarit' },
  { id: 'landscape', label: 'Landscape', folder: 'landscape' },
  { id: 'street', label: 'Street', folder: 'street' },
  { id: 'bw', label: 'B&W', folder: 'bw' }
];

// ==============================================================================
// 🤖 自动导入逻辑
// ==============================================================================

let imagesRecord = {};
try {
  // 本地开发请取消注释下面这行
  imagesRecord = import.meta.glob('/src/photos/**/*.{jpg,jpeg,png,JPG,JPEG,PNG,webp}', { eager: true, as: 'url' });
} catch (e) {
  console.warn("环境不支持 import.meta.glob");
}

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

ALBUM_CATEGORIES.forEach(cat => {
  LOCAL_ALBUMS[cat.id] = [];
});

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

Object.keys(LOCAL_ALBUMS).forEach(key => {
  LOCAL_ALBUMS[key] = shuffleArray(LOCAL_ALBUMS[key]);
});

if (!hasLocalImages) {
  const demoImgs = (seed) => [
    { src: `https://images.unsplash.com/photo-1543362906-ac1b4f87eec6?q=80&w=800`, title: "对峙" },
    { src: `https://images.unsplash.com/photo-1513279922550-250c2129b7b0?q=80&w=1200`, title: "阴影" },
    { src: `https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800`, title: "薄雾" },
    { src: `https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200`, title: "优胜美地" },
  ];
  ALBUM_CATEGORIES.forEach(cat => LOCAL_ALBUMS[cat.id] = demoImgs(cat.id));
}

// ==============================================================================
// 🎨 布局辅助
// ==============================================================================
const getRandomLayout = (index) => {
  const alignments = ['md:self-start', 'md:self-center', 'md:self-end'];
  const heights = ['md:h-[40vh]', 'md:h-[50vh]', 'md:h-[65vh]'];
  const alignIndex = (index * 7) % 3;
  const heightIndex = (index * 13) % 3;
  return { align: alignments[alignIndex], height: heights[heightIndex] };
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
      <div className="flex justify-end items-center px-8 py-6 z-10">
        <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full transition-colors group">
          <X size={32} strokeWidth={1} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative p-8">
        <div className="relative flex items-center justify-center max-w-full h-full" onContextMenu={(e) => e.preventDefault()}>
          <img 
            src={item.src} 
            alt={item.title} 
            className="max-w-full max-h-[80vh] object-contain shadow-2xl pointer-events-none" 
            draggable="false" 
          />
        </div>

        {hasPrev && (
          <button onClick={onPrev} className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-4 md:p-6 hover:scale-110 transition-transform bg-white/50 backdrop-blur rounded-full md:bg-transparent">
            <ChevronLeft size={48} strokeWidth={0.5} />
          </button>
        )}
        {hasNext && (
          <button onClick={onNext} className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-4 md:p-6 hover:scale-110 transition-transform bg-white/50 backdrop-blur rounded-full md:bg-transparent">
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const handleContextmenu = (e) => { e.preventDefault(); };
    document.addEventListener('contextmenu', handleContextmenu);
    return () => { document.removeEventListener('contextmenu', handleContextmenu); };
  }, []);

  useEffect(() => {
    if (viewMode !== 'horizontal' || window.innerWidth < 768) return;
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

  useEffect(() => {
    if (viewMode !== 'horizontal') return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleWheel = (e) => {
      if (window.innerWidth > 768 && e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [activeTab, viewMode]);

  const currentImages = LOCAL_ALBUMS[activeTab] || [];
  const activeCategory = ALBUM_CATEGORIES.find(c => c.id === activeTab);
  
  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(-1);
  const nextImage = () => setLightboxIndex((prev) => (prev + 1) < currentImages.length ? prev + 1 : prev);
  const prevImage = () => setLightboxIndex((prev) => (prev - 1) >= 0 ? prev - 1 : prev);
  const toggleViewMode = () => setViewMode(prev => prev === 'horizontal' ? 'grid' : 'horizontal');

  return (
    <div className={`h-screen w-full bg-[#fdfdfd] text-neutral-900 font-sans selection:bg-transparent selection:text-neutral-900 flex flex-col select-none ${viewMode === 'grid' ? 'overflow-y-auto' : 'md:overflow-hidden overflow-y-auto'}`}>
      
      <header className="fixed top-0 left-0 w-full z-50 px-8 py-8 flex justify-between items-start pointer-events-none bg-gradient-to-b from-white/95 to-transparent">
        <div className="pointer-events-auto">
          <h1 className="text-2xl font-black tracking-tighter uppercase cursor-pointer" onClick={() => window.location.reload()}>
            {SITE_CONFIG.name}
          </h1>
          <p className="text-[10px] text-gray-400 mt-1 tracking-[0.2em] uppercase">Visual Portfolio</p>
        </div>

        <div className="flex flex-col items-end gap-6 pointer-events-auto">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 md:hidden text-black transition-transform active:scale-95">
            {isMenuOpen ? <X size={28} /> : <MenuIcon size={28} />}
          </button>

          <nav className={`flex flex-col items-end gap-2 transition-all duration-300 ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none md:opacity-100 md:translate-y-0 md:pointer-events-auto md:flex'}`}>
            {ALBUM_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveTab(cat.id);
                  setViewMode('horizontal');
                  setIsMenuOpen(false);
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`text-sm font-medium tracking-widest uppercase transition-all duration-300 flex items-center gap-3 group ${activeTab === cat.id ? 'text-black translate-x-0' : 'text-gray-300 hover:text-gray-500 translate-x-1 md:translate-x-2 hover:translate-x-0'}`}
              >
                <span className={`h-[1px] bg-black transition-all duration-300 ${activeTab === cat.id ? 'w-6 md:w-8' : 'w-0'}`}></span>
                {cat.label}
                <span className="text-[9px] font-normal align-top opacity-50">0{idx + 1}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {viewMode === 'horizontal' ? (
        <main ref={scrollContainerRef} className="flex-1 w-full flex flex-col md:flex-row items-center px-6 md:px-[15vw] md:overflow-x-auto hide-scrollbar pt-32 pb-24 md:pt-0" style={{ scrollBehavior: 'auto' }}>
          <div className="flex flex-col md:flex-row gap-12 md:gap-40 items-center min-w-full md:min-w-max">
            <div className="w-full md:w-[20vw] shrink-0 flex flex-col justify-center select-text mb-10 md:mb-0">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-black rounded-full"></span>
                Selected Works
              </span>
              <h2 className="text-5xl md:text-8xl font-thin tracking-tighter leading-[0.8] text-gray-900 mb-6">
                {activeCategory?.label}
              </h2>
              <div className="w-16 h-[1px] bg-gray-300 mb-6"></div>
              <p className="text-gray-400 text-xs md:text-sm max-w-xs leading-relaxed uppercase tracking-tighter">
                {window.innerWidth > 768 ? "Scroll or auto-play. Hover to pause." : "Scroll down to explore."}
              </p>
            </div>

            {currentImages.map((img, index) => {
              const layout = getRandomLayout(index);
              return (
                <div key={index} onClick={() => openLightbox(index)} onMouseEnter={() => setIsHoveringImage(true)} onMouseLeave={() => setIsHoveringImage(false)} className={`relative shrink-0 w-full md:w-auto group cursor-pointer ${layout.align} transition-all duration-700 md:hover:scale-[1.02]`}>
                  <div className={`overflow-hidden transition-all duration-500 shadow-xl group-hover:shadow-2xl bg-neutral-50 ${layout.height} w-full`}>
                    <img src={img.src} alt={img.title} className="w-full md:w-auto md:h-full object-contain pointer-events-none" draggable="false" />
                  </div>
                </div>
              );
            })}
            <div className="hidden md:block w-[10vw] shrink-0"></div>
          </div>
        </main>
      ) : (
        <main className="flex-1 w-full pt-40 px-6 md:px-12 pb-20 max-w-[1920px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
           <div className="mb-12 flex justify-between items-end">
             <div>
               <h2 className="text-4xl font-light tracking-tighter mb-2">{activeCategory?.label}</h2>
               <p className="text-gray-400 text-xs uppercase tracking-widest">Full Collection</p>
             </div>
             <button onClick={toggleViewMode} className="text-xs font-bold uppercase tracking-widest hover:text-gray-500 flex items-center gap-2">
               <X size={16} /> Close Grid
             </button>
           </div>
           <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8">
            {currentImages.map((img, index) => (
              <div key={index} onClick={() => openLightbox(index)} className="break-inside-avoid group cursor-pointer relative shadow-sm hover:shadow-md transition-shadow">
                <div className="w-full bg-gray-50 overflow-hidden relative">
                  <img src={img.src} alt={img.title} loading="lazy" className="w-full h-auto object-cover transition-all duration-700 group-hover:opacity-90 pointer-events-none" draggable="false" />
                </div>
              </div>
            ))}
           </div>
        </main>
      )}

      <footer className="fixed bottom-0 left-0 w-full p-8 flex justify-between items-end pointer-events-none text-[10px] text-gray-400 uppercase tracking-widest bg-gradient-to-t from-white/95 to-transparent">
        <div className="pointer-events-auto flex items-center gap-6">
          <span className="hidden sm:inline">{currentImages.length} Photographs</span>
          {viewMode === 'horizontal' && (
            <div className="flex items-center gap-4">
               <button onClick={() => setIsAutoPlaying(!isAutoPlaying)} className="flex items-center gap-2 font-bold hover:text-black transition-all cursor-pointer text-gray-500">
                {isAutoPlaying ? <Pause size={12} /> : <Play size={12} />} {isAutoPlaying ? "Pause" : "Play"}
              </button>
              <div className="w-[1px] h-3 bg-gray-300"></div>
              <button onClick={toggleViewMode} className="flex items-center gap-2 font-bold hover:text-black transition-all cursor-pointer text-gray-500">
                <LayoutGrid size={12} /> Grid
              </button>
            </div>
          )}
        </div>

        <div className="text-right pointer-events-auto flex flex-col items-end gap-2">
          <div className="flex items-center gap-4 text-gray-400">
             <a href={SITE_CONFIG.instagramUrl} target="_blank" rel="noreferrer" className="hover:text-black transition-colors"><Instagram size={18} /></a>
             <a href={`mailto:${SITE_CONFIG.email}`} className="hover:text-black transition-colors"><Mail size={18} /></a>
          </div>
          <span>© {new Date().getFullYear()} {SITE_CONFIG.name}</span>
        </div>
      </footer>

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
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}