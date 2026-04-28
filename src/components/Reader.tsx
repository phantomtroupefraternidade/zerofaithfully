import React, { useState, useMemo, useEffect } from 'react';
import { Search, Download, FileText, ChevronLeft, ChevronRight, Maximize2, Minimize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PageElement } from './FileUpload';

interface ReaderProps {
  file: { name: string; pages: PageElement[][]; type: string } | null;
}

const Reader: React.FC<ReaderProps> = ({ file }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const readerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        setIsFullScreen(false);
        setFullScreenImage(null);
      }
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const toggleFullScreen = async () => {
    if (!readerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await readerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Erro ao alternar tela cheia:", err);
      // Fallback para CSS fullscreen se a API falhar
      setIsFullScreen(!isFullScreen);
    }
  };

  const totalPages = file?.pages.length || 0;

  const currentPageElements = useMemo(() => {
    if (!file || totalPages === 0) return [];
    return file.pages[currentPageIndex];
  }, [file, currentPageIndex]);

  if (!file) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        <FileText size={80} style={{ marginBottom: '20px', opacity: 0.3 }} />
        <p>Aguardando satélite de dados...</p>
        <p style={{ fontSize: '0.8rem' }}>Selecione um arquivo rico em mídia na biblioteca.</p>
      </div>
    );
  }

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === highlight.toLowerCase() ? (
        <span key={i} className="highlight">{part}</span>
      ) : part
    );
  };

  const goToNextPage = () => { if (currentPageIndex < totalPages - 1) setCurrentPageIndex(p => p + 1); };
  const goToPrevPage = () => { if (currentPageIndex > 0) setCurrentPageIndex(p => p - 1); };

  const readerStyles: React.CSSProperties = isFullScreen ? {
    width: '100vw',
    height: '100vh',
    background: 'var(--bg-color)',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  } : {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  };

  return (
    <div ref={readerRef} className={`reader-container ${isFullScreen ? 'is-fullscreen' : ''}`} style={readerStyles}>
      <div className="window-header" style={{ 
        position: 'sticky', 
        top: 0, 
        background: isFullScreen ? 'rgba(10, 10, 25, 0.98)' : 'rgba(5, 5, 10, 0.8)', 
        zIndex: 10, 
        borderRadius: '12px', 
        marginBottom: '20px',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)',
        boxShadow: isFullScreen ? '0 0 30px rgba(0, 242, 255, 0.1)' : 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 15px', flex: 0.6 }}>
            <Search size={18} color="var(--accent-cyan)" />
            <input 
              type="text" 
              placeholder="Buscar na página..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={goToPrevPage} disabled={currentPageIndex === 0} className="nav-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <ChevronLeft size={32} color={currentPageIndex === 0 ? '#444' : 'var(--accent-cyan)'} />
                </button>
                <span style={{ fontSize: '1.1rem', fontWeight: '700', letterSpacing: '2px', minWidth: '100px', textAlign: 'center', color: 'var(--accent-cyan)' }}>
                  {currentPageIndex + 1} / {totalPages}
                </span>
                <button onClick={goToNextPage} disabled={currentPageIndex === totalPages - 1} className="nav-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <ChevronRight size={32} color={currentPageIndex === totalPages - 1 ? '#444' : 'var(--accent-cyan)'} />
                </button>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={toggleFullScreen} className="btn-neon" style={{ padding: '10px 15px', border: '2px solid var(--accent-cyan)' }}>
                  {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
                <button className="btn-neon" style={{ padding: '10px 20px', fontSize: '0.8rem' }}>
                  <Download size={18} /> Exportar
                </button>
            </div>
        </div>
      </div>

      <div className="document-view glass-card" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPageIndex}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.25 }}
            style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            {currentPageElements.map((el, i) => (
              <div key={i}>
                {el.type === 'text' ? (
                  <p className="document-content" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: '#e0e0e0' }}>
                    {highlightText(el.content, searchTerm)}
                  </p>
                ) : (
                  <div style={{ position: 'relative', marginTop: '10px', marginBottom: '10px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                    <img 
                      src={el.content} 
                      alt="Extracted asset" 
                      style={{ width: '100%', height: 'auto', display: 'block', cursor: 'zoom-in' }}
                      onClick={() => setFullScreenImage(el.content)}
                    />
                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', padding: '5px', borderRadius: '5px' }}>
                        <Maximize2 size={14} color="var(--accent-cyan)" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Image Overlay */}
      <AnimatePresence>
        {fullScreenImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', cursor: 'zoom-out' }}
            onClick={() => setFullScreenImage(null)}
          >
            <motion.img 
              initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              src={fullScreenImage} 
              style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reader;
