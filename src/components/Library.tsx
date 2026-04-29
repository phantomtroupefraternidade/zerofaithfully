import React, { useState } from 'react';
import { FileText, Trash2, Eye, Download, ShieldCheck, X, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

import type { PageElement } from './FileUpload';

interface LibraryProps {
  files: { name: string; pages: PageElement[][]; type: string; originalFile?: File; id?: any; metadata?: any; cover_image?: string | null; storage_path?: string | null; category?: string }[];
  onSelect: (file: any) => void;
  onDelete: (index: number) => void;
  onDownloadAll: () => void;
  folderHandle: any;
}

const Library: React.FC<LibraryProps> = ({ files, onSelect, onDelete, onDownloadAll, folderHandle }) => {
  const [showAuth, setShowAuth] = useState<{ index: number } | null>(null);
  const [authAdm, setAuthAdm] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authError, setAuthError] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const getCoverImage = (file: any) => {
    if (file.cover_image) return file.cover_image;
    for (const page of file.pages || []) {
      for (const el of page) {
        if (el.type === 'image') return el.content;
      }
    }
    return null;
  };

  const handleAuthDelete = () => {
    if (authAdm === 'PhantomTroupeFraternidade' && authPass === '0PTPhantomTroupeFraternidadePT0') {
      onDelete(showAuth!.index);
      setShowAuth(null);
      setAuthAdm('');
      setAuthPass('');
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const handleOpenBook = async (file: any) => {
    // If file already has pages loaded, open directly
    if (file.pages && file.pages.length > 0) {
      onSelect(file);
      return;
    }

    // Otherwise download from Supabase and reprocess
    if (!file.storage_path) {
      alert('Arquivo não disponível para leitura online.');
      return;
    }

    setDownloading(file.id);
    try {
      const { data, error } = await supabase.storage
        .from('books')
        .download(file.storage_path);

      if (error || !data) throw error || new Error('Download failed');

      const fileObj = new File([data], file.name, { type: data.type });

      // Reprocess the file using the same logic as FileUpload
      const { processBookFile } = await import('./FileUpload');
      const pages = await processBookFile(fileObj);

      onSelect({ ...file, pages, originalFile: fileObj });
    } catch (e) {
      console.error('Failed to open book from storage:', e);
      alert('Falha ao carregar o livro. Tente novamente.');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownload = async (file: any) => {
    // If we have the original file in memory
    if (file.originalFile) {
      const url = URL.createObjectURL(file.originalFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // Download from Supabase storage
    if (!file.storage_path) {
      alert('Arquivo não disponível para download.');
      return;
    }

    setDownloading(file.id);
    try {
      const { data, error } = await supabase.storage
        .from('books')
        .download(file.storage_path);
      if (error || !data) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Falha ao baixar o arquivo.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="library-container" style={{ position: 'relative', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div className="library-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Biblioteca Digital</h2>
          <span className="nucleo-badge" style={{
            fontSize: '0.65rem',
            color: 'var(--accent-cyan)',
            background: 'rgba(0, 242, 255, 0.08)',
            border: '1px solid rgba(0, 242, 255, 0.2)',
            padding: '3px 8px',
            borderRadius: '20px',
            letterSpacing: '1px',
            fontWeight: '700'
          }}>
            NÚCLEO · {files.length} livro{files.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="library-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-storage btn-sync"
            style={{ 
              padding: '8px 15px', 
              fontSize: '0.7rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              borderRadius: '10px',
              width: '100%',
              justifyContent: 'center'
            }}
          >
            <RefreshCw size={14} /> Sincronizar Agora
          </button>

          <button
            onClick={onDownloadAll}
            className="btn-download-all"
            title={folderHandle ? 'Baixar todos os livros na pasta vinculada' : 'Vincule uma pasta para ativar'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 15px',
              background: folderHandle ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${folderHandle ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '10px',
              color: folderHandle ? 'white' : '#555',
              fontSize: '0.7rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: folderHandle ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              width: '100%',
              fontWeight: '600'
            }}
          >
            <Download size={14} /> Baixar Todos
          </button>
        </div>
      </div>
      
      {files.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>A biblioteca está vazia. Comece enviando sua primeira sonda de dados.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {files.map((file, index) => {
            const coverImage = getCoverImage(file);
            const isLoading = downloading === file.id;
            return (
            <div key={file.id || index} className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '15px', position: 'relative' }}>
              {coverImage ? (
                <div className="library-book-cover" style={{
                  width: '100%',
                  height: '160px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '5px',
                  position: 'relative',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <img className="library-book-img" src={coverImage} alt="Capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '50%', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  boxShadow: '0 0 15px rgba(255, 255, 255, 0.1)'
                }}>
                  <FileText size={30} color="white" />
                </div>
              )}
              <div style={{ width: '100%' }}>
                <p style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                  <p style={{ fontSize: '0.65rem', color: 'white', background: 'rgba(255, 255, 255, 0.1)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                    {(file as any).category || file.metadata?.category || 'Não classificado'}
                  </p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    {file.type}
                  </p>
                  
                  {/* Uploader Attribution */}
                  <div style={{ 
                    marginTop: '8px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    padding: '4px 8px', 
                    background: 'rgba(255,255,255,0.03)', 
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
                      <img src={file.metadata?.uploader_photo || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${file.metadata?.uploaded_by}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontSize: '0.6rem', color: '#888', fontWeight: '600' }}>
                      {file.metadata?.uploaded_by || 'Agente'}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap', marginBottom: '12px' }}>
                <button 
                  onClick={() => handleOpenBook(file)}
                  className="btn-primary" 
                  disabled={isLoading}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '0.7rem', minWidth: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: isLoading ? 0.6 : 1 }}
                >
                  {isLoading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Eye size={14} />}
                  {isLoading ? 'Carregando...' : 'Abrir'}
                </button>
                <button 
                  onClick={() => handleDownload(file)}
                  disabled={isLoading}
                  className="btn-storage"
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '0.7rem', border: '1px solid var(--glass-border)', color: 'white', minWidth: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Download size={14} /> Baixar
                </button>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <button 
                  onClick={() => setShowAuth({ index })}
                  style={{ 
                    background: 'rgba(0, 0, 0, 0.5)', 
                    color: '#ff5555', 
                    border: '1px solid rgba(255, 85, 85, 0.3)', 
                    padding: '8px', 
                    borderRadius: '50%', 
                    cursor: 'pointer', 
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}
                  title="Apagar Livro"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Security Verification Modal */}
      {showAuth && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div className="glass-card" style={{ 
            width: '400px', 
            padding: '40px', 
            background: '#0a0a0a', 
            border: '1px solid rgba(255, 85, 85, 0.3)',
            boxShadow: '0 0 50px rgba(255, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldCheck color="#ff5555" size={24} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '1px' }}>AUTENTICAÇÃO ADM</h3>
              </div>
              <X 
                size={20} 
                style={{ cursor: 'pointer', opacity: 0.5 }} 
                onClick={() => {
                  setShowAuth(null);
                  setAuthError(false);
                  setAuthAdm('');
                  setAuthPass('');
                }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.7rem', color: '#666', fontWeight: '700', letterSpacing: '1px' }}>ADMINISTRADOR</label>
                <input 
                  type="text" 
                  value={authAdm}
                  onChange={(e) => setAuthAdm(e.target.value)}
                  style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    color: 'white',
                    outline: 'none'
                  }}
                  placeholder="ID de acesso..."
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.7rem', color: '#666', fontWeight: '700', letterSpacing: '1px' }}>SENHA MESTRA</label>
                <input 
                  type="password" 
                  value={authPass}
                  onChange={(e) => setAuthPass(e.target.value)}
                  style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    color: 'white',
                    outline: 'none'
                  }}
                  placeholder="••••••••••••"
                />
              </div>

              {authError && (
                <p style={{ color: '#ff5555', fontSize: '0.75rem', textAlign: 'center', background: 'rgba(255, 85, 85, 0.1)', padding: '10px', borderRadius: '6px' }}>
                  Credenciais de acesso inválidas. Acesso negado.
                </p>
              )}

              <button 
                onClick={handleAuthDelete}
                className="btn-primary"
                style={{ 
                  width: '100%', 
                  background: '#ff5555', 
                  color: 'white', 
                  padding: '15px', 
                  marginTop: '10px',
                  justifyContent: 'center'
                }}
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;
