import React, { useState, useMemo, useEffect } from 'react';
import { Search, Download, FileText, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import type { FileData } from './FileUpload';

interface ReaderProps {
  file: FileData | null;
}

const Reader: React.FC<ReaderProps> = ({ file }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const readerRef = React.useRef<HTMLDivElement>(null);
  const totalPages = file?.pages.length || 0;

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        setIsFullScreen(false);
        setFullScreenImage(null);
      }
      if (e.key === 'ArrowRight') {
        setCurrentPageIndex(p => p < totalPages - 1 ? p + 1 : p);
      } else if (e.key === 'ArrowLeft') {
        setCurrentPageIndex(p => p > 0 ? p - 1 : p);
      }
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [totalPages]);

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

  const handleExport = async (format: 'original' | 'pdf' | 'txt' | 'cbz') => {
    setIsExportMenuOpen(false);
    
    if (format === 'original' && (file as any).originalFile) {
      const url = URL.createObjectURL((file as any).originalFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (format === 'txt') {
      let content = '';
      file.pages.forEach(page => {
        page.forEach(el => { if (el.type === 'text') content += el.content + '\n\n'; });
        content += '\n--- PÁGINA ---\n\n';
      });
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.split('.')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (format === 'cbz') {
      const zip = new JSZip();
      let imgCount = 0;
      file.pages.forEach((page, i) => {
        page.forEach((el, j) => {
          if (el.type === 'image') {
            const base64Data = el.content.split(',')[1];
            zip.file(`image_${i}_${j}.jpg`, base64Data, { base64: true });
            imgCount++;
          }
        });
      });
      if (imgCount === 0) {
        alert('Nenhuma imagem encontrada para criar um CBZ.');
        return;
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.split('.')[0]}.cbz`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (format === 'pdf') {
      const doc = new jsPDF();
      let y = 10;
      
      file.pages.forEach((page, pIndex) => {
        if (pIndex > 0) doc.addPage();
        y = 10;
        
        page.forEach(el => {
          if (el.type === 'text') {
            const lines = doc.splitTextToSize(el.content, 180);
            if (y + (lines.length * 7) > 280) {
              doc.addPage();
              y = 10;
            }
            doc.text(lines, 10, y);
            y += lines.length * 7 + 5;
          } else if (el.type === 'image') {
            try {
              if (y > 200) { doc.addPage(); y = 10; }
              doc.addImage(el.content, 'JPEG', 10, y, 180, 100);
              y += 110;
            } catch (e) {
              console.error("Erro ao adicionar imagem ao PDF", e);
            }
          }
        });
      });
      
      doc.save(`${file.name.split('.')[0]}.pdf`);
      return;
    }
  };

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
        <div className="reader-header-section search-section" style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 15px', width: '100%' }}>
            <Search size={18} color="var(--accent-cyan)" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '0.8rem' }}
            />
          </div>
        </div>
        
        <div className="reader-header-section actions-section" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={toggleFullScreen} className="btn-neon fullscreen-btn" style={{ padding: '10px 15px', border: '2px solid var(--accent-cyan)' }}>
              {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <div className="export-wrapper" style={{ position: 'relative' }}>
              <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="btn-neon btn-export" style={{ padding: '10px 20px', fontSize: '0.8rem' }}>
                <Download size={18} /> <span>Exportar</span>
              </button>
              {isExportMenuOpen && (
                <div style={{ 
                  position: 'absolute', top: '100%', right: 0, marginTop: '10px', 
                  background: 'rgba(5,5,10,0.95)', border: '1px solid var(--accent-cyan)', 
                  borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px',
                  minWidth: '150px', zIndex: 100
                }}>
                  {(file as any).originalFile && (
                    <button onClick={() => handleExport('original')} style={{ background: 'transparent', border: 'none', color: 'white', textAlign: 'left', padding: '8px', cursor: 'pointer', borderRadius: '4px' }} className="hover-cyan">
                      Original ({file.type.toUpperCase()})
                    </button>
                  )}
                  <button onClick={() => handleExport('pdf')} style={{ background: 'transparent', border: 'none', color: 'white', textAlign: 'left', padding: '8px', cursor: 'pointer', borderRadius: '4px' }} className="hover-cyan">
                    PDF
                  </button>
                  <button onClick={() => handleExport('txt')} style={{ background: 'transparent', border: 'none', color: 'white', textAlign: 'left', padding: '8px', cursor: 'pointer', borderRadius: '4px' }} className="hover-cyan">
                    TXT
                  </button>
                  <button onClick={() => handleExport('cbz')} style={{ background: 'transparent', border: 'none', color: 'white', textAlign: 'left', padding: '8px', cursor: 'pointer', borderRadius: '4px' }} className="hover-cyan">
                    CBZ (Imagens)
                  </button>
                </div>
              )}
            </div>
        </div>
      </div>

      <div className="document-view glass-card" style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: currentPageElements.length > 0 ? 'flex-start' : 'center'
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPageIndex}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.25 }}
            style={{ 
              maxWidth: isFullScreen ? '100%' : '800px', 
              width: '100%',
              margin: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '25px', 
              alignItems: 'center',
              justifyContent: 'flex-start',
              minHeight: '100%',
              paddingTop: currentPageElements.some(el => el.type === 'image') ? '0px' : '40px',
              paddingBottom: '120px'
            }}
          >
            {currentPageElements.map((el, i) => (
              <div key={i} style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: isFullScreen ? '0 5%' : '0 40px' }}>
                {el.type === 'text' ? (
                  <p className="document-content" style={{ 
                    whiteSpace: 'pre-wrap', 
                    lineHeight: '1.9', 
                    color: '#e0e0e0', 
                    textAlign: 'justify', 
                    width: '100%',
                    maxWidth: isFullScreen ? '95%' : '700px',
                    fontSize: isFullScreen ? '1.25rem' : '1.1rem',
                    padding: '0 20px',
                    borderLeft: '1px solid rgba(0, 242, 255, 0.1)'
                  }}>
                    {highlightText(el.content, searchTerm)}
                  </p>
                ) : (
                  <div className="reader-content-img-wrapper" style={{ position: 'relative', marginTop: '10px', marginBottom: '10px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)', display: 'inline-block', maxWidth: '100%' }}>
                    <img 
                      src={el.content} 
                      alt="Extracted asset" 
                      style={{ 
                        maxWidth: '100%', 
                        height: 'auto', 
                        maxHeight: isFullScreen ? '90vh' : 'calc(85vh - 220px)',
                        objectFit: 'contain',
                        display: 'block', 
                        cursor: 'zoom-in',
                        margin: '0 auto'
                      }}
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

      {/* Refactored Floating Navigation Control */}
      <div className="floating-reader-nav">
        <button 
          onClick={goToPrevPage} 
          disabled={currentPageIndex === 0} 
          className="nav-control-btn"
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="nav-info">
          <span className="current">{currentPageIndex + 1}</span>
          <span className="separator">/</span>
          <span className="total">{totalPages}</span>
        </div>

        <button 
          onClick={goToNextPage} 
          disabled={currentPageIndex === totalPages - 1} 
          className="nav-control-btn"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Side Navigation Buttons for FullScreen */}
      <AnimatePresence>
        {isFullScreen && (
          <>
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={goToPrevPage}
              disabled={currentPageIndex === 0}
              className="hover-cyan fullscreen-side-nav-btn"
              style={{
                position: 'fixed',
                left: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 50,
                background: 'rgba(5, 5, 10, 0.6)',
                border: '1px solid var(--accent-cyan)',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: currentPageIndex === 0 ? 'not-allowed' : 'pointer',
                opacity: currentPageIndex === 0 ? 0.3 : 1,
                backdropFilter: 'blur(10px)',
                color: 'var(--accent-cyan)'
              }}
            >
              <ChevronLeft size={40} />
            </motion.button>
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={goToNextPage}
              disabled={currentPageIndex === totalPages - 1}
              className="hover-cyan fullscreen-side-nav-btn"
              style={{
                position: 'fixed',
                right: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 50,
                background: 'rgba(5, 5, 10, 0.6)',
                border: '1px solid var(--accent-cyan)',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: currentPageIndex === totalPages - 1 ? 'not-allowed' : 'pointer',
                opacity: currentPageIndex === totalPages - 1 ? 0.3 : 1,
                backdropFilter: 'blur(10px)',
                color: 'var(--accent-cyan)'
              }}
            >
              <ChevronRight size={40} />
            </motion.button>
          </>
        )}
      </AnimatePresence>

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
