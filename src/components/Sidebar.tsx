import React, { useRef } from 'react';
import { Home, Upload, Library, BookOpen, BrainCircuit, History, Palette } from 'lucide-react';
import appIcon from '../assets/zerofaithfullyicone.png';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
  currentUser: { name: string; photo_url: string | null } | null;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, themeColor, setThemeColor, currentUser }) => {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const menuItems = [
    { id: 'home', icon: Home, label: 'Início' },
    { id: 'upload', icon: Upload, label: 'Upload' },
    { id: 'library', icon: Library, label: 'Biblioteca' },
    { id: 'reader', icon: BookOpen, label: 'Leitor' },
    { id: 'interpretation', icon: BrainCircuit, label: 'Interpretação' },
  ];

  return (
    <nav className="sidebar">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', flex: 1, alignItems: 'center' }}>
        <div style={{ 
          width: '45px', 
          height: '45px', 
          marginBottom: '10px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden'
        }}>
          <img src={appIcon} alt="Zero Faithfully Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            title={item.label}
          >
            <item.icon size={24} />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: 'auto' }}>
        <div 
          className="nav-item"
          onClick={() => colorInputRef.current?.click()}
          title="Personalizar Cor"
          style={{ position: 'relative' }}
        >
          <Palette size={24} color={themeColor} />
          <input 
            type="color" 
            ref={colorInputRef}
            value={themeColor}
            onChange={(e) => setThemeColor(e.target.value)}
            style={{ 
              position: 'absolute', 
              opacity: 0, 
              width: 0, 
              height: 0, 
              padding: 0, 
              border: 'none' 
            }}
          />
        </div>

        <div 
          className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
          title="Histórico de Acesso"
        >
          <History size={24} />
        </div>

        {currentUser && (
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            overflow: 'hidden', 
            border: '2px solid var(--accent-color)',
            marginTop: '10px',
            marginLeft: '5%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.05)'
          }} title={currentUser.name}>
            <img src={currentUser.photo_url || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" />
          </div>
        )}

      </div>
    </nav>
  );
};

export default Sidebar;
