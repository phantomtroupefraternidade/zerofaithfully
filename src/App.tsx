import React, { useState, useEffect } from 'react';
import SpaceBackground from './components/SpaceBackground';
import Sidebar from './components/Sidebar';
import FileUpload from './components/FileUpload';
import Library from './components/Library';
import Reader from './components/Reader';
import Interpretation from './components/Interpretation';
import Login from './components/Login';
import HistoryView from './components/HistoryView';
import confetti from 'canvas-confetti';
import type { FileData } from './components/FileUpload';
import { getLibraryFolder, setLibraryFolder, saveFileToFolder } from './utils/storage';
import { supabase } from './lib/supabaseClient';
import { FolderOpen, Download } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [renderedTab, setRenderedTab] = useState('home');
  const [tabAnimClass, setTabAnimClass] = useState('tab-entering');
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [folderHandle, setFolderHandle] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; photo_url: string | null } | null>(() => {
    const saved = localStorage.getItem('zf_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('zf_theme') || '#ffffff';
  });

  const handleTabChange = (newTab: string) => {
    if (newTab === activeTab) return;
    setActiveTab(newTab);
    setTabAnimClass('tab-exiting');
    setTimeout(() => {
      setRenderedTab(newTab);
      setTabAnimClass('tab-entering');
    }, 150);
  };

  // Sync theme color with CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', themeColor);
    localStorage.setItem('zf_theme', themeColor);
  }, [themeColor]);
  // Fetch shared library from Supabase on mount
  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const { data, error } = await supabase
          .from('zf_books')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (data) {
          const remoteFiles: FileData[] = data.map((row: any) => ({
            id: row.id,
            name: row.name,
            type: row.type,
            pages: [],
            category: row.metadata?.category,
            metadata: row.metadata,
            cover_image: row.cover_image,
            storage_path: row.storage_path,
          }));
          setFiles(remoteFiles);
        }
      } catch (e) {
        console.warn('Could not fetch library from Supabase:', e);
      }
    };

    fetchLibrary();

    // Real-time subscription for shared library
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'zf_books'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newBook = payload.new;
            setFiles(prev => {
              // Avoid duplicates
              if (prev.some(f => f.id === newBook.id)) return prev;
              return [{
                id: newBook.id,
                name: newBook.name,
                type: newBook.type,
                pages: [],
                category: newBook.metadata?.category,
                metadata: newBook.metadata,
                cover_image: newBook.cover_image,
                storage_path: newBook.storage_path,
              }, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            setFiles(prev => prev.filter(f => f.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Also grab folder handle
    getLibraryFolder().then(h => { if (h) setFolderHandle(h); });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogin = (user: { name: string; photo_url: string | null }) => {
    setCurrentUser(user);
    localStorage.setItem('zf_user', JSON.stringify(user));
  };

  // Heartbeat: update last_login every 30s while user is active
  useEffect(() => {
    if (!currentUser) return;

    const ping = async () => {
      await supabase
        .from('zf_profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('name', currentUser.name);
    };

    ping(); // immediate ping on load
    const interval = setInterval(ping, 30000); // every 30 seconds

    return () => clearInterval(interval);
  }, [currentUser]);

  const handlePickFolder = async () => {
    const handle = await setLibraryFolder();
    if (handle) {
      setFolderHandle(handle);
      confetti({
        particleCount: 50,
        spread: 30,
        colors: ['#ffffff']
      });
    }
  };

  const handleFileProcessed = async (fileData: FileData) => {
    const fileId = String(Date.now());
    
    // Extract first image as cover
    let coverImage: string | null = null;
    for (const page of fileData.pages) {
      for (const el of page) {
        if (el.type === 'image') { coverImage = el.content; break; }
      }
      if (coverImage) break;
    }

    let storagePath: string | null = null;

    try {
      // 1. Upload file to Supabase Storage
      if (fileData.originalFile) {
        const path = `${fileId}/${fileData.name}`;
        const { error: storageErr } = await supabase.storage
          .from('books')
          .upload(path, fileData.originalFile, { upsert: true });
        
        if (storageErr) {
          console.error('Storage upload error:', storageErr);
          alert('Erro ao enviar arquivo para o storage. Verifique sua conexão.');
          return; // Stop here if storage fails
        }
        storagePath = path;
      }

      // 2. Insert into zf_books
      const { data: inserted, error } = await supabase
        .from('zf_books')
        .insert([{
          id: fileId,
          name: fileData.name,
          type: fileData.type,
          cover_image: coverImage,
          storage_path: storagePath,
          metadata: {
            pages_count: fileData.pages.length,
            category: fileData.category,
            uploaded_by: currentUser?.name || 'Agente Anônimo',
            uploader_photo: currentUser?.photo_url
          }
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        alert('Erro ao registrar livro no banco de dados.');
      } else if (inserted) {
        const newEntry: FileData = {
          ...fileData,
          id: fileId as any,
          cover_image: coverImage,
          storage_path: storagePath,
          metadata: inserted.metadata,
        };
        
        // We update state immediately for the uploader, 
        // while others will receive it via real-time subscription.
        setFiles(prev => {
          if (prev.some(f => f.id === fileId)) return prev;
          return [newEntry, ...prev];
        });
        
        setSelectedFile(newEntry);
        handleTabChange('reader');

        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: [themeColor, '#888888', '#cccccc']
        });
      }
    } catch (e) {
      console.error('Critical error during upload:', e);
      alert('Ocorreu um erro crítico no processamento do upload.');
    }

    // Always try to save locally if folder is linked
    if (folderHandle && fileData.originalFile) {
      try {
        await saveFileToFolder(folderHandle, fileData.name, fileData.originalFile, fileData.category);
      } catch (err) {
        console.warn('Failed local save:', err);
      }
    }
  };

  const handleSelectFile = (file: FileData) => {
    setSelectedFile(file);
    handleTabChange('reader');
  };

  const handleDeleteFile = async (index: number) => {
    const fileToDelete = files[index];
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    if (selectedFile === fileToDelete) setSelectedFile(null);

    // Delete from Supabase
    try {
      if (fileToDelete.storage_path) {
        await supabase.storage.from('books').remove([fileToDelete.storage_path]);
      }
      await supabase.from('zf_books').delete().eq('id', String(fileToDelete.id));
    } catch (e) {
      console.warn('Could not delete from Supabase:', e);
    }
  };

  const handleDownloadAll = async () => {
    if (!folderHandle) {
      alert('Vincule uma pasta local primeiro para baixar os arquivos.');
      return;
    }
    let count = 0;
    for (const file of files) {
      if (file.originalFile) {
        try {
          await saveFileToFolder(folderHandle, file.name, file.originalFile, file.category);
          count++;
        } catch (e) {
          console.warn('Failed to save:', file.name);
        }
      }
    }
    if (count > 0) {
      alert(`${count} arquivo(s) salvo(s) na pasta vinculada.`);
    } else {
      alert('Nenhum arquivo disponível para baixar. Os arquivos precisam ser carregados nesta sessão.');
    }
  };

  if (!currentUser) {
    return (
      <>
        <SpaceBackground />
        <Login onLogin={handleLogin} />
      </>
    );
  }

  return (
    <>
      <SpaceBackground />
      
      <div className="desktop-app">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={handleTabChange} 
          themeColor={themeColor}
          setThemeColor={setThemeColor}
          currentUser={currentUser}
        />
        
        <div className="content-area">
          <header className="window-header" style={{ position: 'relative' }}>
            <div className="title-group" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <h1>ZERO FAITHFULLY</h1>
            </div>
            
            {/* Centered Sync Button */}
            <div style={{ 
              position: 'absolute', 
              left: '50%', 
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center'
            }}>
              <button 
                onClick={handlePickFolder}
                className={`btn-storage ${folderHandle ? 'active' : ''}`}
                title={folderHandle ? 'Pasta Local Vinculada' : 'Vincular Pasta Local'}
                style={{ padding: '8px 20px', borderRadius: '12px' }}
              >
                <FolderOpen size={18} />
                <span style={{ fontSize: '0.7rem' }}>
                  {folderHandle ? 'Sincronizado' : 'Vincular Pasta'}
                </span>
              </button>
            </div>

            {/* Right panel: label + download button, flush to wall */}
            <div style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: '8px',
              paddingRight: '16px'
            }}>
              <div className="header-subtitle" style={{ 
                textAlign: 'right', 
                fontSize: '1.2rem', 
                letterSpacing: '1px', 
                fontWeight: '600',
                background: 'linear-gradient(to right, #ffffff, #888888)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                whiteSpace: 'nowrap'
              }}>
                Interpretador de livro
              </div>
            </div>
          </header>
          
          <main className="main-view" style={{ position: 'relative' }}>
            {/* Download all button: below header divider, right wall */}
            <button
              onClick={handleDownloadAll}
              title={folderHandle ? 'Baixar todos os livros na pasta vinculada' : 'Vincule uma pasta para ativar'}
              style={{
                position: 'absolute',
                top: '14px',
                right: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: folderHandle ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${folderHandle ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px',
                color: folderHandle ? 'white' : '#555',
                fontSize: '0.65rem',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                cursor: folderHandle ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                zIndex: 10
              }}
              onMouseEnter={(e) => { if (folderHandle) e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; }}
              onMouseLeave={(e) => { if (folderHandle) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
            >
              <Download size={12} />
              Baixar Todos
            </button>
            <div className={`tab-transition-container ${tabAnimClass}`}>
              {renderedTab === 'home' && (
                <div className="home-container" style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%', 
                  padding: '0 10%',
                  animation: 'fadeIn 0.8s ease-out'
                }}>
                  <div className="glass-card home-card" style={{ 
                    padding: '80px 60px', 
                    textAlign: 'center', 
                    maxWidth: '900px',
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 0 40px rgba(0,0,0,0.4)'
                  }}>
                    <h2 style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '30px', letterSpacing: '-3px', color: 'white' }}>
                      PLATAFORMA <span style={{ color: '#888' }}>DIGITAL</span>
                    </h2>
                    
                    <div style={{ 
                      fontSize: '1.3rem', 
                      lineHeight: '1.8', 
                      color: 'var(--text-secondary)', 
                      marginBottom: '40px',
                      fontWeight: '300'
                    }}>
                      Ambiente especializado em <span style={{ color: 'white', fontWeight: '600' }}>interpretação</span>, 
                      <span style={{ color: '#888', fontWeight: '600' }}> conversão</span> e 
                      <span style={{ color: 'white', fontWeight: '600' }}> armazenamento</span> de livros digitais.
                    </div>

                    <div style={{ 
                      height: '1px', 
                      background: 'linear-gradient(90deg, transparent, var(--glass-border), transparent)', 
                      margin: '40px auto', 
                      width: '60%' 
                    }}></div>

                    <p className="home-description" style={{ 
                      fontSize: '1.1rem', 
                      lineHeight: '2', 
                      color: 'rgba(255,255,255,0.7)',
                      maxWidth: '700px',
                      margin: '0 auto'
                    }}>
                      Desenvolvida com o propósito de produzir um ecossistema de imersão literária, 
                      reunindo obras diversas e ferramentas de análise neural para um grupo seleto de pessoas.
                    </p>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '50px' }}>
                      <button 
                        onClick={() => handleTabChange('library')}
                        className="btn-primary" 
                        style={{ padding: '15px 40px', fontSize: '1rem', width: 'auto' }}
                      >
                        Acessar a biblioteca digital
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {renderedTab === 'upload' && (
                <FileUpload onFileProcessed={handleFileProcessed} />
              )}
              
              {renderedTab === 'library' && (
                <Library 
                  files={files} 
                  onSelect={handleSelectFile} 
                  onDelete={handleDeleteFile} 
                />
              )}
              
              {renderedTab === 'reader' && (
                <Reader file={selectedFile} />
              )}
              
              {renderedTab === 'interpretation' && (
                <Interpretation 
                  file={selectedFile} 
                  allFiles={files} 
                  onSelectFile={setSelectedFile}
                />
              )}

              {renderedTab === 'history' && (
                <HistoryView />
              )}
            </div>
          </main>
        </div>

        {/* Decorative elements */}
        <div style={{ 
          position: 'absolute', 
          bottom: '20px', 
          right: '25px', 
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{ 
            fontSize: '0.6rem', 
            color: 'var(--accent-cyan)', 
            opacity: 0.5,
            letterSpacing: '2px'
          }}>
            Phantom Troupe
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
