import React, { useState } from 'react';
import { FileText, Trash2, Eye, Download, ShieldCheck, X } from 'lucide-react';

import type { PageElement } from './FileUpload';

interface LibraryProps {
  files: { name: string; pages: PageElement[][]; type: string; originalFile?: File }[];
  onSelect: (file: any) => void;
  onDelete: (index: number) => void;
}

const Library: React.FC<LibraryProps> = ({ files, onSelect, onDelete }) => {
  const [showAuth, setShowAuth] = useState<{ index: number } | null>(null);
  const [authAdm, setAuthAdm] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authError, setAuthError] = useState(false);

  const getCoverImage = (file: any) => {
    for (const page of file.pages) {
      for (const el of page) {
        if (el.type === 'image') {
          return el.content;
        }
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

  return (
    <div className="library-container" style={{ position: 'relative', height: '100%' }}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '30px', fontWeight: '800', letterSpacing: '-0.5px' }}>Biblioteca Digital</h2>
      
      {files.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>A biblioteca está vazia. Comece enviando sua primeira sonda de dados.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {files.map((file, index) => {
            const coverImage = getCoverImage(file);
            return (
            <div key={index} className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '15px', position: 'relative' }}>
              {coverImage ? (
                <div style={{
                  width: '100%',
                  height: '160px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '5px',
                  position: 'relative',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <img src={coverImage} alt="Capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                    {(file as any).category || 'Não classificado'}
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
                      <img src={(file as any).metadata?.uploader_photo || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${(file as any).metadata?.uploaded_by}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontSize: '0.6rem', color: '#888', fontWeight: '600' }}>
                      {(file as any).metadata?.uploaded_by || 'Agente'}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap', marginBottom: '12px' }}>
                <button 
                  onClick={() => onSelect(file)}
                  className="btn-primary" 
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '0.7rem', minWidth: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Eye size={14} /> Abrir
                </button>
                {file.originalFile && (
                  <button 
                    onClick={() => {
                      const url = URL.createObjectURL(file.originalFile!);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = file.name;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="btn-storage"
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '0.7rem', border: '1px solid var(--glass-border)', color: 'white', minWidth: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Download size={14} /> Baixar
                  </button>
                )}
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
