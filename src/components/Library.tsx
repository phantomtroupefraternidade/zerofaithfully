import React from 'react';
import { FileText, Trash2, Eye } from 'lucide-react';

import type { PageElement } from './FileUpload';

interface LibraryProps {
  files: { name: string; pages: PageElement[][]; type: string }[];
  onSelect: (file: any) => void;
  onDelete: (index: number) => void;
}

const Library: React.FC<LibraryProps> = ({ files, onSelect, onDelete }) => {
  return (
    <div className="library-container">
      <h2 style={{ fontSize: '1.8rem', marginBottom: '30px' }}>Sua Biblioteca Estelar</h2>
      
      {files.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>A biblioteca está vazia. Comece enviando sua primeira sonda de dados.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {files.map((file, index) => (
            <div key={index} className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '15px', position: 'relative' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                background: 'rgba(0, 242, 255, 0.1)', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                boxShadow: '0 0 15px rgba(0, 242, 255, 0.2)'
              }}>
                <FileText size={30} color="var(--accent-cyan)" />
              </div>
              <div style={{ width: '100%' }}>
                <p style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  {file.type}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button 
                  onClick={() => onSelect(file)}
                  className="btn-neon" 
                  style={{ flex: 1, padding: '5px', borderRadius: '8px', fontSize: '0.7rem' }}
                >
                  <Eye size={14} /> Abrir
                </button>
                <button 
                  onClick={() => onDelete(index)}
                  style={{ background: 'rgba(255, 0, 0, 0.1)', color: '#ff4444', border: '1px solid rgba(255,0,0,0.2)', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;
