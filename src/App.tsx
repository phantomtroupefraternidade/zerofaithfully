import React, { useState, useEffect } from 'react';
import SpaceBackground from './components/SpaceBackground';
import Sidebar from './components/Sidebar';
import FileUpload from './components/FileUpload';
import Library from './components/Library';
import Reader from './components/Reader';
import Interpretation from './components/Interpretation';
import confetti from 'canvas-confetti';

import type { PageElement, FileData } from './components/FileUpload';
import { getLibraryFolder, setLibraryFolder, saveFileToFolder } from './utils/storage';
import { supabase } from './lib/supabaseClient';
import { Settings, FolderOpen } from 'lucide-react';

// The interface is now imported from FileUpload

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('library');
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [folderHandle, setFolderHandle] = useState<any>(null);

  // IndexedDB Setup
  useEffect(() => {
    const initDB = async () => {
      const request = indexedDB.open('ZeroFaithfullyDB', 1);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('library')) {
          db.createObjectStore('library', { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const transaction = db.transaction(['library'], 'readonly');
        const store = transaction.objectStore('library');
        const getAll = store.getAll();
        getAll.onsuccess = () => {
          setFiles(getAll.result);
        };
      };

      const handle = await getLibraryFolder();
      if (handle) setFolderHandle(handle);
    };

    initDB();
  }, []);

  const handlePickFolder = async () => {
    const handle = await setLibraryFolder();
    if (handle) {
      setFolderHandle(handle);
      confetti({
        particleCount: 50,
        spread: 30,
        colors: ['#00f2ff']
      });
    }
  };

  const saveToDB = (newFiles: FileData[]) => {
    const request = indexedDB.open('ZeroFaithfullyDB', 1);
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      const transaction = db.transaction(['library'], 'readwrite');
      const store = transaction.objectStore('library');
      store.clear();
      newFiles.forEach(f => store.add(f));
    };
  };

  const handleFileProcessed = async (fileData: FileData) => {
    const fileId = Date.now();
    const updatedFiles = [...files, { ...fileData, id: fileId }];
    setFiles(updatedFiles);
    saveToDB(updatedFiles);
    setSelectedFile(fileData);
    setActiveTab('reader');

    // 1. Save to local folder if selected
    if (folderHandle && fileData.originalFile) {
      await saveFileToFolder(folderHandle, fileData.name, fileData.originalFile);
    }

    // 2. Sync with Supabase
    try {
      const { data, error } = await supabase
        .from('books')
        .insert([
          { 
            id: fileId,
            name: fileData.name, 
            type: fileData.type, 
            metadata: { pages_count: fileData.pages.length } 
          }
        ]);
      
      if (fileData.originalFile) {
        await supabase.storage
          .from('books')
          .upload(`${fileId}/${fileData.name}`, fileData.originalFile);
      }
      
      if (error) console.error("Supabase sync error:", error);
    } catch (e) {
      console.warn("Supabase not configured or unreachable.");
    }
    
    // Success animation
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00f2ff', '#7000ff', '#0066ff']
    });
  };

  const handleSelectFile = (file: FileData) => {
    setSelectedFile(file);
    setActiveTab('reader');
  };

  const handleDeleteFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    saveToDB(updatedFiles);
    if (selectedFile === files[index]) {
      setSelectedFile(null);
    }
  };

  return (
    <>
      <SpaceBackground />
      
      <div className="desktop-app">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="content-area">
          <header className="window-header">
            <div className="title-group">
              <h1>ZERO FAITHFULLY // DATA INTERPRETER</h1>
            </div>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <button 
                onClick={handlePickFolder}
                className={`btn-storage ${folderHandle ? 'active' : ''}`}
                title={folderHandle ? 'Pasta Local Vinculada' : 'Vincular Pasta Local'}
              >
                <FolderOpen size={18} />
                <span style={{ fontSize: '0.7rem' }}>
                  {folderHandle ? 'Sincronizado' : 'Vincular Pasta'}
                </span>
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }} />
              </div>
            </div>
          </header>
          
          <main className="main-view">
            {activeTab === 'upload' && (
              <FileUpload onFileProcessed={handleFileProcessed} />
            )}
            
            {activeTab === 'library' && (
              <Library 
                files={files} 
                onSelect={handleSelectFile} 
                onDelete={handleDeleteFile} 
              />
            )}
            
            {activeTab === 'reader' && (
              <Reader file={selectedFile} />
            )}
            
            {activeTab === 'interpretation' && (
              <Interpretation file={selectedFile} />
            )}
          </main>
        </div>

        {/* Decorative elements */}
        <div style={{ 
          position: 'absolute', 
          bottom: '20px', 
          right: '20px', 
          fontSize: '0.6rem', 
          color: 'var(--accent-cyan)', 
          opacity: 0.5,
          letterSpacing: '2px'
        }}>
          SYSTEM v1.0.42 // NEURAL ENGINE ACTIVE
        </div>
      </div>
    </>
  );
};

export default App;
