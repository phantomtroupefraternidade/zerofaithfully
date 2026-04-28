import React, { useState, useEffect } from 'react';
import SpaceBackground from './components/SpaceBackground';
import Sidebar from './components/Sidebar';
import FileUpload from './components/FileUpload';
import Library from './components/Library';
import Reader from './components/Reader';
import Interpretation from './components/Interpretation';
import confetti from 'canvas-confetti';

import type { PageElement } from './components/FileUpload';

interface FileData {
  name: string;
  pages: PageElement[][];
  type: string;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('library');
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);

  // IndexedDB Setup
  useEffect(() => {
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
  }, []);

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

  const handleFileProcessed = (fileData: FileData) => {
    const updatedFiles = [...files, { ...fileData, id: Date.now() }];
    setFiles(updatedFiles);
    saveToDB(updatedFiles);
    setSelectedFile(fileData);
    setActiveTab('reader');
    
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
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }} />
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
