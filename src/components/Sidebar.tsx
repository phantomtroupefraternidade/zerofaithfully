import React from 'react';
import { Upload, Library, BookOpen, BrainCircuit } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'upload', icon: Upload, label: 'Upload' },
    { id: 'library', icon: Library, label: 'Biblioteca' },
    { id: 'reader', icon: BookOpen, label: 'Leitor' },
    { id: 'interpretation', icon: BrainCircuit, label: 'Interpretação' },
  ];

  return (
    <nav className="sidebar">
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
    </nav>
  );
};

export default Sidebar;
