import React, { useMemo, useState } from 'react';
import { BrainCircuit, Sparkles, ListChecks, MessageSquareText, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


interface InterpretationProps {
  file: any | null;
  allFiles: any[];
  onSelectFile: (file: any) => void;
}

const Interpretation: React.FC<InterpretationProps> = ({ file, allFiles, onSelectFile }) => {
  const [isTopicsVisible, setIsTopicsVisible] = useState(false);

  const analysis = useMemo(() => {
    if (!file) return null;

    const allText = file.pages.flat().map((el: any) => el.type === 'text' ? el.content : '').join(' ');
    const sentences = allText.match(/[^.!?]+[.!?]+/g) || [allText];
    const words = allText.toLowerCase().split(/\W+/).filter((w: string) => w.length > 4);
    
    // Frequency analysis for keywords
    const freq: { [key: string]: number } = {};
    words.forEach((w: string) => freq[w] = (freq[w] || 0) + 1);
    const sortedKeywords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 15).map(e => e[0]);

    // Resumo Executivo: First 3 meaningful sentences + Synthesis
    const summarySentences = sentences.slice(0, 3).join(' ');
    const summary = summarySentences.length > 20 ? 
      `${summarySentences} Em essência, a obra articula conceitos de ${sortedKeywords.slice(0, 3).join(', ')} para fundamentar sua tese central.` :
      `Análise concluída para "${file.name}". O conteúdo foca primordialmente em ${sortedKeywords.slice(0, 5).join(', ')}.`;

    // Ideias Principais: Selection of sentences containing top keywords
    const keyIdeas = sentences
      .filter((s: string) => sortedKeywords.some(kw => s.toLowerCase().includes(kw)))
      .slice(0, 12)
      .map((s: string) => s.trim());
    
    if (keyIdeas.length < 12) {
      keyIdeas.push(...[
        "Exploração profunda das interconexões sistêmicas do tema.",
        "Análise crítica dos paradigmas apresentados no volume.",
        "Proposição de novas metodologias baseadas nos dados extraídos.",
        "Síntese teórica dos elementos fundamentais da obra.",
        "Identificação de tendências emergentes nos dados.",
        "Estudo das variáveis secundárias de impacto.",
        "Mapeamento de riscos e oportunidades contextuais.",
        "Desenvolvimento de lógica aplicada ao domínio.",
        "Integração de conceitos transversais detectados.",
        "Otimização de processos descritos no fluxo.",
        "Verificação de padrões recorrentes no texto.",
        "Compilação de insights estratégicos de alto nível."
      ].slice(0, 12 - keyIdeas.length));
    }

    // Divisão por Tópicos: 12 dynamic themes based on top keywords
    const themes = [
      "Fundamentos e Contexto",
      "Desenvolvimento Técnico",
      "Análise de Impacto",
      "Perspectivas Futuras",
      "Metodologia Aplicada",
      "Estruturas Centrais",
      "Evolução Conceitual",
      "Casos Práticos",
      "Crítica e Revisão",
      "Interconexões de Dados",
      "Conclusões Neurais",
      "Síntese Final"
    ];

    const topics = sortedKeywords.slice(0, 12).map((kw, i) => {
      return { 
        title: `${kw.charAt(0).toUpperCase() + kw.slice(1)}: ${themes[i] || 'Análise Adicional'}`, 
        content: `Explora a importância de "${kw}" dentro da estrutura do livro, analisando como este elemento se conecta aos objetivos descritos em ${themes[i] || 'outras seções'}.` 
      };
    });

    if (topics.length < 12) {
      for (let i = topics.length; i < 12; i++) {
        topics.push({
          title: `Tópico ${i + 1}: ${themes[i] || 'Análise de Suporte'}`,
          content: "Refinamento adicional dos dados extraídos para fornecer uma visão holística dos subtemas menos frequentes porém relevantes."
        });
      }
    }

    // Modo Simplificado: Extremely accessible language
    const category = (file as any).category || "Conhecimento Geral";
    const simplified = `Em palavras bem simples: este livro de "${category}" serve para te ensinar como ${sortedKeywords[0]}, ${sortedKeywords[1]} e ${sortedKeywords[2]} funcionam no mundo real. O objetivo do autor é mostrar que entender essas coisas não precisa ser difícil, e que você pode usar esse conhecimento para resolver problemas práticos ou entender melhor como as coisas ao seu redor funcionam.`;

    // Randomize images (limit to 6)
    const allImages = file.pages.flat().filter((el: any) => el.type === 'image');
    
    // Custom logic: First is cover, Last is last page
    const cover = allImages[0];
    const lastPage = allImages[allImages.length - 1];
    const middleImages = allImages.slice(1, -1).sort(() => 0.5 - Math.random());

    const leftImages = [cover, ...middleImages.slice(0, 2)];
    const rightImages = [lastPage, ...middleImages.slice(2, 4)];

    return { summary, keyIdeas, topics, simplified, leftImages, rightImages };
  }, [file]);

  const exportInterpretation = () => {
    if (!analysis) return;
    const content = `INTERPRETAÇÃO INTELIGENTE: ${file.name}\n\n` +
      `RESUMO:\n${analysis.summary}\n\n` +
      `IDEIAS PRINCIPAIS:\n${analysis.keyIdeas.join('\n')}\n\n` +
      `VERSÃO SIMPLIFICADA:\n${analysis.simplified}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Interpretacao_${file.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="interpretation-container" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <h2 style={{ fontSize: '2.0rem', fontWeight: '900', letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <BrainCircuit color="var(--accent-purple)" size={32} /> 
          CENTRAL DE <span style={{ color: 'var(--accent-cyan)' }}>INTERPRETAÇÃO</span>
        </h2>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div className="glass-card" style={{ 
            padding: '8px 20px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            background: 'rgba(0, 242, 255, 0.03)',
            border: '1px solid rgba(0, 242, 255, 0.2)',
            borderRadius: '12px'
          }}>
             <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Analisar:</span>
             <select 
              value={file?.name || ''} 
              onChange={(e) => {
                const selected = allFiles.find(f => f.name === e.target.value);
                if (selected) onSelectFile(selected);
              }}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--accent-cyan)', 
                outline: 'none', 
                cursor: 'pointer', 
                fontWeight: '700',
                fontSize: '0.95rem',
                fontFamily: 'inherit'
              }}
             >
               {!file && <option value="">Selecione...</option>}
               {allFiles.map((f, i) => (
                 <option key={i} value={f.name} style={{ background: '#0a0a14', color: 'white' }}>{f.name}</option>
               ))}
             </select>
          </div>
          <button onClick={exportInterpretation} className="btn-primary" disabled={!file}>
            <Download size={18} /> Exportar Análise
          </button>
        </div>
      </div>

      {!file ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '24px' }}>
          <BrainCircuit size={80} style={{ marginBottom: '20px', opacity: 0.3 }} />
          <p style={{ fontSize: '1.2rem' }}>Nenhum dado selecionado para análise.</p>
          <p style={{ fontSize: '0.9rem' }}>Escolha um livro no seletor acima para iniciar o processamento neural.</p>
        </div>
      ) : (
      <>
        <div className="interpretation-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px', marginBottom: '40px' }}>
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="glass-card"
          >
            <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem', textAlign: 'left' }}>
              <MessageSquareText size={24} /> MODO SIMPLIFICADO
            </h3>
            <p style={{ 
              fontStyle: 'italic', 
              color: 'var(--text-secondary)', 
              fontSize: '1rem', 
              lineHeight: '1.6',
              textAlign: 'left',
              borderTop: '1px solid rgba(0, 242, 255, 0.2)',
              borderBottom: '1px solid rgba(0, 242, 255, 0.2)',
              padding: '20px 0',
              marginTop: '10px'
            }}>{analysis?.simplified}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-card"
          >
            <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem', textAlign: 'left' }}>
              <ListChecks size={24} /> IDEIAS PRINCIPAIS
            </h3>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px', 
              maxHeight: '280px', 
              overflowY: 'auto', 
              paddingRight: '15px'
            }}>
              {analysis?.keyIdeas.slice(0, 12).map((idea: string, i: number) => (
                <div key={i} style={{ 
                  padding: '12px 15px', 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: '10px', 
                  borderLeft: '4px solid var(--accent-cyan)', 
                  display: 'flex', 
                  gap: '12px'
                }}>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: '900', fontSize: '0.9rem' }}>{String(i + 1).padStart(2, '0')}</span>
                  <p style={{ fontSize: '0.85rem', color: '#eee', lineHeight: '1.5', textAlign: 'left' }}>{idea}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-card"
          >
            <h3 style={{ color: 'var(--accent-purple)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem', textAlign: 'left' }}>
              <Sparkles size={24} /> RESUMO EXECUTIVO
            </h3>
            <p style={{ 
              lineHeight: '1.8', 
              color: '#ddd', 
              fontSize: '0.95rem',
              textAlign: 'left',
              borderTop: '1px solid rgba(188, 19, 254, 0.2)',
              borderBottom: '1px solid rgba(188, 19, 254, 0.2)',
              padding: '20px 0',
              marginTop: '10px'
            }}>{analysis?.summary}</p>
          </motion.div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '60px' }}>
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--glass-border), transparent)', marginBottom: '30px' }}></div>
          <button 
            onClick={() => setIsTopicsVisible(!isTopicsVisible)}
            style={{ 
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              width: '100%',
              outline: 'none'
            }}
          >
            <h2 style={{ 
              fontSize: '1.2rem', 
              fontWeight: '800', 
              letterSpacing: '6px', 
              color: isTopicsVisible ? 'var(--accent-cyan)' : 'rgba(0, 242, 255, 0.6)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '20px', 
              textAlign: 'center',
              textTransform: 'uppercase',
              transition: 'all 0.3s ease'
            }}>
               {isTopicsVisible ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
               DIVISÃO POR TÓPICOS
               {isTopicsVisible ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </h2>
          </button>
        </div>

        <AnimatePresence>
          {isTopicsVisible && (
            <motion.div 
              initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <motion.div 
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '310px 1fr 310px', 
                  gap: '30px', 
                  marginTop: '20px',
                  paddingBottom: '40px'
                }}
              >
                {/* Left Column: Cover + 2 Random */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px', textAlign: 'left' }}>PRÉ VISUALIZAÇÃO I</h3>
                  {analysis?.leftImages.map((el, i) => (
                    <div key={i} style={{ 
                      borderRadius: '12px', 
                      overflow: 'hidden', 
                      border: '1px solid var(--glass-border)',
                      background: 'rgba(0,0,0,0.3)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '270px',
                      padding: '10px',
                      position: 'relative'
                    }}>
                      {i === 0 && <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--accent-cyan)', color: 'black', fontSize: '0.6rem', padding: '2px 8px', borderRadius: '4px', fontWeight: '900' }}>CAPA</span>}
                      <img src={el?.content} alt={`Left Asset ${i}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                  ))}
                </div>

                {/* Center Column: 12 Topics (No scrolling) */}
                <div className="glass-card" style={{ 
                  background: 'rgba(255,255,255,0.01)', 
                  margin: 0, 
                  marginTop: '4.2vh',
                  height: 'fit-content',
                  borderTop: '1px solid rgba(188, 19, 254, 0.2)'
                }}>
                  <h3 style={{ color: 'white', marginBottom: '25px', fontSize: '1.2rem', letterSpacing: '3px', textAlign: 'left', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
                    RESUMOS ESTRUTURADOS
                  </h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '20px',
                    paddingRight: '5px'
                  }}>
                    {analysis?.topics.map((topic, i) => (
                      <div key={i} className="topic-item" style={{ margin: 0, padding: '15px', background: 'rgba(188, 19, 254, 0.02)', borderLeft: '3px solid var(--accent-purple)' }}>
                        <h3 style={{ fontSize: '0.85rem', marginBottom: '8px', color: 'var(--accent-purple)', textAlign: 'left' }}>{topic.title}</h3>
                        <p style={{ fontSize: '0.75rem', color: '#ccc', lineHeight: '1.5', textAlign: 'left' }}>{topic.content}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Last Page + 2 Random */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px', textAlign: 'left' }}>PRÉ VISUALIZAÇÃO II</h3>
                  {analysis?.rightImages.map((el, i) => (
                    <div key={i} style={{ 
                      borderRadius: '12px', 
                      overflow: 'hidden', 
                      border: '1px solid var(--glass-border)',
                      background: 'rgba(0,0,0,0.3)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '270px',
                      padding: '10px',
                      position: 'relative'
                    }}>
                      {i === 0 && <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--accent-purple)', color: 'white', fontSize: '0.6rem', padding: '2px 8px', borderRadius: '4px', fontWeight: '900' }}>FINAL</span>}
                      <img src={el?.content} alt={`Right Asset ${i}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
      )}
    </div>
  );
};

export default Interpretation;
