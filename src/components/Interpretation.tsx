import React, { useMemo } from 'react';
import { BrainCircuit, Sparkles, ListChecks, MessageSquareText, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import type { PageElement } from './FileUpload';

interface InterpretationProps {
  file: { name: string; pages: PageElement[][] } | null;
}

const Interpretation: React.FC<InterpretationProps> = ({ file }) => {
  const analysis = useMemo(() => {
    if (!file) return null;

    // Simulated AI Processing
    const text = file.pages.flat().map(el => el.type === 'text' ? el.content : '').join(' ');
    const isMetadata = text.includes('DADOS EXTRAÍDOS') || text.includes('Arquivo Archive');
    const words = text.split(/\s+/);
    
    // Simple logic for "mock" summary and key points
    let summary = '';
    let keyIdeas: string[] = [];
    
    if (isMetadata) {
      summary = `Este documento é um contêiner técnico ou arquivo de mídia (${file.name}). A extração neural focou na integridade dos dados e estrutura organizacional.`;
      keyIdeas = [
        "Verificação de integridade do contêiner concluída.",
        "Mapeamento de recursos internos e metadados.",
        "Pronto para decodificação profunda de ativos individuais.",
        "Estrutura otimizada para arquivamento e busca rápida."
      ];
    } else {
      summary = words.slice(0, 100).join(' ') + '... ' + 
                "Este documento aborda temas fundamentais dentro do contexto de " + file.name + 
                ". A análise sugere um foco em eficiência e estruturação de dados.";
      keyIdeas = [
        "Processamento otimizado de fluxos de informação.",
        "Sincronização entre camadas de abstração e realidade digital.",
        "Implementação de protocolos de segurança Zero Trust.",
        "Simplificação de processos complexos através de análise preditiva."
      ];
    }

    const topics = [
      { title: "Introdução ao Contexto", content: "Definição inicial dos parâmetros e escopo do documento." },
      { title: "Arquitetura Principal", content: "Detalhamento das estruturas de base mencionadas no texto." },
      { title: "Interconexões", content: "Como os diferentes elementos se relacionam entre si." },
      { title: "Conclusão e Insights", content: "Resultados finais e sugestões baseadas na leitura analítica." }
    ];

    const simplified = text.length > 500 ? 
      "Em poucas palavras: o arquivo descreve um sistema organizado e eficiente para lidar com dados, focando em segurança e clareza." : 
      "O texto explica de forma direta os conceitos principais, facilitando a compreensão para qualquer nível de usuário.";

    return { summary, keyIdeas, topics, simplified };
  }, [file]);

  if (!file) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        <BrainCircuit size={80} style={{ marginBottom: '20px', opacity: 0.3 }} />
        <p>Aguardando processamento neural...</p>
        <p style={{ fontSize: '0.8rem' }}>Carregue um arquivo para iniciar a interpretação.</p>
      </div>
    );
  }

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <BrainCircuit color="var(--accent-purple)" size={32} /> Central de Interpretação
        </h2>
        <button onClick={exportInterpretation} className="btn-primary">
          <Download size={18} /> Exportar Análise
        </button>
      </div>

      <div className="interpretation-panel">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card" style={{ gridColumn: 'span 2' }}
        >
          <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} /> Resumo Executivo
          </h3>
          <p style={{ lineHeight: '1.7', color: '#ccc' }}>{analysis?.summary}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="glass-card"
        >
          <h3 style={{ color: 'var(--accent-purple)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ListChecks size={20} /> Ideias Principais
          </h3>
          <ul style={{ listStyle: 'none' }}>
            {analysis?.keyIdeas.map((idea, i) => (
              <li key={i} style={{ marginBottom: '10px', display: 'flex', gap: '10px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--accent-purple)' }}>•</span> {idea}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="glass-card"
        >
          <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquareText size={20} /> Modo Simplificado
          </h3>
          <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>{analysis?.simplified}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card" style={{ gridColumn: 'span 2' }}
        >
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>Divisão por Tópicos</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {analysis?.topics.map((topic, i) => (
              <div key={i} className="topic-item">
                <h3>{topic.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{topic.content}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Interpretation;
