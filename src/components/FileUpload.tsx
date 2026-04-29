import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileUp, Archive, CheckCircle2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';
import mammoth from 'mammoth';
import ePub from 'epubjs';
import JSZip from 'jszip';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface PageElement {
  type: 'text' | 'image';
  content: string;
}

export interface FileData {
  name: string;
  pages: PageElement[][];
  type: string;
  originalFile?: File;
  id?: number;
  category?: string;
}

export const DOCUMENT_CATEGORIES = [
  // --- HUMANISMO (12) ---
  "Psicologia & Comportamento",
  "Artes Visuais & Design",
  "Música & Teoria Musical",
  "Filosofia & Ética",
  "Fantasia & Conspirações",
  "Literatura & Poesia",
  "Sociologia & Sociedade",
  "Antropologia Cultural",
  "Linguística & Idiomas",
  "Teologia & Espiritualidade",
  "Pedagogia & Educação",
  "Direito & Cidadania",

  // --- CIÊNCIAS (12) ---
  "Física Teórica & Aplicada",
  "Química & Materiais",
  "Biologia & Genética",
  "Matemática & Estatística",
  "Astronomia & Astrofísica",
  "Geologia & Paleontologia",
  "Ecologia & Meio Ambiente",
  "Medicina & Saúde",
  "Engenharia & Tecnologia",
  "Neurociência & Cognição",
  "Informática & I.A.",
  "Robótica & Automação",

  // --- SOBREVIVÊNCIA (12) ---
  "Bushcraft & Vida Selvagem",
  "Navegação & Cartografia",
  "Abrigos & Acampamento",
  "Obtenção de Água & Fogo",
  "Caça, Pesca & Forrageio",
  "Primeiros Socorros Táticos",
  "Autodefesa & Estratégia",
  "Comunicação & Sinais",
  "Sobrevivência Urbana",
  "Ambientes Extremos",
  "Equipamentos & Ferramentas",
  "Preparação para Desastres"
];

const FileUpload: React.FC<{ onFileProcessed: (fileData: FileData) => void }> = ({ onFileProcessed }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const extractImagesFromZip = async (zip: JSZip): Promise<PageElement[]> => {
    const images: PageElement[] = [];
    const files = Object.keys(zip.files).filter(name => /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(name));
    
    for (const name of files.sort()) {
      const base64 = await zip.files[name].async('base64');
      const ext = name.split('.').pop()?.toLowerCase();
      const mime = ext === 'jpg' ? 'jpeg' : ext;
      images.push({ type: 'image', content: `data:image/${mime};base64,${base64}` });
    }
    return images;
  };

  const processFile = async (file: File, category: string) => {
    let pages: PageElement[][] = [];
    const type = file.name.split('.').pop()?.toLowerCase() || '';

    try {
      if (type === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          if (textContent.items.length < 10) {
            // Likely a scanned page or image-heavy. Render as image.
            const viewport = page.getViewport({ scale: 2 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await (page as any).render({ canvasContext: context!, viewport }).promise;
            pages.push([{ type: 'image', content: canvas.toDataURL('image/jpeg', 0.8) }]);
          } else {
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            pages.push([{ type: 'text', content: pageText }]);
          }
        }
      } else if (type === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer }, {
          convertImage: mammoth.images.imgElement((image) => {
            return image.read("base64").then((imageBuffer) => {
              return { src: "data:" + image.contentType + ";base64," + imageBuffer };
            });
          })
        });
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(result.value, 'text/html');
        const pageElements: PageElement[] = [];
        
        doc.body.childNodes.forEach(node => {
          if (node instanceof HTMLImageElement || (node instanceof HTMLElement && node.querySelector('img'))) {
            const img = node instanceof HTMLImageElement ? node : node.querySelector('img');
            if (img?.src) pageElements.push({ type: 'image', content: img.src });
          } else if (node.textContent?.trim()) {
            pageElements.push({ type: 'text', content: node.textContent });
          }
        });
        pages = [pageElements];
      } else if (type === 'epub') {
        const book = ePub(await file.arrayBuffer());
        await book.ready;
        const spine = book.spine as any;
        const spineItems = spine.items || spine.spineItems || [];
        
        for (const item of spineItems) {
          const doc = await book.load(item.href);
          if (doc instanceof Document) {
            const pageElements: PageElement[] = [];
            const textContent = doc.body.innerText;
            if (textContent.trim()) pageElements.push({ type: 'text', content: textContent });

            // Extract images from chapter
            const imgs = Array.from(doc.querySelectorAll('img, image'));
            for (const img of imgs) {
              const src = img.getAttribute('src') || img.getAttribute('xlink:href');
              if (src) {
                try {
                  const absolutePath = (item as any).canonical(src);
                  const imageItem = (book.resources as any).get(absolutePath);
                  if (imageItem) {
                    const base64 = await (book as any).archive.getBase64(imageItem.href);
                    const mime = imageItem.type || 'image/jpeg';
                    pageElements.push({ type: 'image', content: `data:${mime};base64,${base64}` });
                  }
                } catch (e) { console.warn("Failed to extract image:", src); }
              }
            }
            pages.push(pageElements);
          }
        }
      } else if (['cbz', 'zip'].includes(type)) {
        const zip = await JSZip.loadAsync(file);
        const images = await extractImagesFromZip(zip);
        pages = images.map(img => [img]);
      } else {
        // Fallback for TXT/HTML/RTF
        const text = await file.text();
        const content = type === 'html' ? new DOMParser().parseFromString(text, 'text/html').body.innerText : text;
        const pageCount = Math.ceil(content.length / 3000);
        for(let i=0; i<pageCount; i++) {
          pages.push([{ type: 'text', content: content.slice(i*3000, (i+1)*3000) }]);
        }
      }

      onFileProcessed({
        name: file.name,
        pages,
        type,
        originalFile: file,
        category: category
      });
    } catch (error) {
      console.error('Error processing:', error);
      alert('Falha na extração de multimídia.');
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) setPendingFile(acceptedFiles[0]);
  }, []);

  const handleConfirmUpload = async () => {
    if (!pendingFile || !selectedCategory) return;
    setIsProcessing(true);
    await processFile(pendingFile, selectedCategory);
    setPendingFile(null);
    setSelectedCategory('');
    setIsProcessing(false);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/epub+zip': ['.epub'],
      'application/x-cbz': ['.cbz'],
      'application/zip': ['.zip']
    }
  });

  const supportedList = ["PDF", "EPUB", "DOCX", "TXT", "CBZ", "ZIP"];

  return (
    <div className="upload-container">
      <header style={{ 
        marginBottom: '40px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: '700', letterSpacing: '-1px' }}>
          Matriz de Ingestão <span style={{ color: 'var(--accent-cyan)' }}>Multimídia</span>
        </h2>
        <p style={{ 
          fontSize: '2.2rem', 
          fontWeight: '700', 
          letterSpacing: '-1px',
          color: 'white'
        }}>
          <span style={{ color: 'var(--accent-purple)' }}>Processamento</span> Integrado
        </p>
      </header>

      <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
        <label style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>Classificação de Sobrevivência:</label>
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ 
            padding: '10px 15px', 
            borderRadius: '8px', 
            background: 'rgba(5, 5, 10, 0.8)', 
            border: '1px solid var(--accent-cyan)', 
            color: 'white', 
            outline: 'none',
            minWidth: '300px',
            fontSize: '0.9rem',
            textAlign: 'center',
            textAlignLast: 'center',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            appearance: 'none'
          }}
        >
          <option value="" disabled>Selecione uma classificação</option>
          {DOCUMENT_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        <FileUp size={64} color="var(--accent-cyan)" />
        <p>{pendingFile ? `Arquivo selecionado: ${pendingFile.name}` : 'Arraste seu arquivo (Imagens serão extraídas automaticamente)'}</p>
      </div>

      <div style={{ marginTop: '30px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
        {supportedList.map(ext => (
          <span key={ext} className="glass-card" style={{ padding: '4px 10px', fontSize: '0.65rem', border: '1px solid rgba(0, 242, 255, 0.2)', color: 'var(--accent-cyan)' }}>{ext}</span>
        ))}
      </div>

      <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center' }}>
        <button 
          className="btn-primary" 
          onClick={handleConfirmUpload}
          disabled={!pendingFile || !selectedCategory || isProcessing}
          style={{ 
            padding: '15px 40px', 
            fontSize: '1.1rem',
            opacity: (!pendingFile || !selectedCategory || isProcessing) ? 0.5 : 1,
            cursor: (!pendingFile || !selectedCategory || isProcessing) ? 'not-allowed' : 'pointer'
          }}
        >
          {isProcessing ? 'Processando...' : 'Confirmar Upload'}
        </button>
      </div>

      <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
        <div className="glass-card" style={{ display: 'flex', gap: '15px' }}>
          <Archive color="var(--accent-purple)" />
          <div>
            <h4 style={{ fontSize: '0.85rem' }}>Extração de Imagens</h4>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Converte ativos DOCX/EPUB para visualização imediata.</p>
          </div>
        </div>
        <div className="glass-card" style={{ display: 'flex', gap: '15px' }}>
          <CheckCircle2 color="var(--accent-cyan)" />
          <div>
            <h4 style={{ fontSize: '0.85rem' }}>Fidelidade Visual</h4>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Preserva a posição relativa de textos e gráficos.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
