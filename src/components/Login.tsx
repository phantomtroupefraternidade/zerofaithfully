import React, { useState, useRef } from 'react';
import { Camera, ArrowLeft, Info } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import appIcon from '../assets/zerofaithfullyicone.png';

interface LoginProps {
  onLogin: (user: { name: string; photo_url: string | null }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setError('A imagem deve ter menos de 3MB.');
        return;
      }
      setPhotoFile(file);
      setPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) {
      setError('Preencha nome e senha.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('zf_profiles')
        .select('*')
        .eq('name', name)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (!isRegistering) {
        // --- CHECK-IN FLOW ---
        if (!existingUser) {
          setError('Identidade não encontrada. Realize seu primeiro check-in.');
          setLoading(false);
          return;
        }

        if (existingUser.password !== password) {
          setError('Credenciais inválidas. Acesso negado.');
          setLoading(false);
          return;
        }

        // Update last login
        await supabase
          .from('zf_profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', existingUser.id);

        await supabase.from('zf_access_logs').insert([{ profile_id: existingUser.id }]);
        onLogin({ name: existingUser.name, photo_url: existingUser.photo_url });

      } else {
        // --- REGISTRATION FLOW ---
        if (existingUser) {
          setError('Esta identidade já foi reivindicada por outro agente.');
          setLoading(false);
          return;
        }

        let photoUrl = preview;
        if (photoFile) {
          const fileExt = photoFile.name.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const filePath = `avatars/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, photoFile);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            photoUrl = publicUrl;
          } else {
            // Fallback to Base64
            const reader = new FileReader();
            photoUrl = await new Promise((resolve) => {
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(photoFile);
            });
          }
        }

        const { data: newUser, error: insertError } = await supabase
          .from('zf_profiles')
          .insert([{ 
            name, 
            password,
            photo_url: photoUrl || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${name}`,
            last_login: new Date().toISOString() 
          }])
          .select()
          .single();
        
        if (insertError) throw insertError;

        await supabase.from('zf_access_logs').insert([{ profile_id: newUser.id }]);
        onLogin({ name: newUser.name, photo_url: newUser.photo_url });
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      const msg = err.message || 'Erro desconhecido';
      setError(`Falha na conexão neural: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: '#0a0a0a',
      zIndex: 10000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <div className="glass-card" style={{ 
        width: '450px', 
        padding: '50px', 
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.01)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 0 100px rgba(0,0,0,0.8)'
      }}>
        
        {!isRegistering ? (
          <>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'rgba(255, 255, 255, 0.05)', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              margin: '0 auto 30px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden'
            }}>
              <img src={appIcon} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '10px', letterSpacing: '-1px' }}>
              VINCULAR <span style={{ color: '#888' }}>AGENTE</span>
            </h2>
            <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '40px', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Reconecte-se ao sistema
            </p>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px' }}>
              <button 
                onClick={() => { setIsRegistering(false); setError(''); }}
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: '#888', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = '#888';
                }}
              >
                <ArrowLeft size={20} />
              </button>
            </div>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{ 
                width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', 
                display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px',
                border: '2px dashed rgba(255, 255, 255, 0.2)', cursor: 'pointer', overflow: 'hidden'
              }}
            >
              {preview ? <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={24} color="#666" />}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '10px' }}>PRIMEIRO CHECK-IN</h2>
            
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              padding: '12px', 
              borderRadius: '8px', 
              display: 'flex', 
              gap: '10px', 
              alignItems: 'start',
              marginBottom: '25px',
              textAlign: 'left'
            }}>
              <Info size={16} color="white" style={{ flexShrink: 0, marginTop: '2px', opacity: 0.5 }} />
              <p style={{ fontSize: '0.85rem', color: '#ccc', lineHeight: '1.4', fontWeight: '600' }}>
                ATENÇÃO: A identidade (Nome e Foto) é IMUTÁVEL após a criação. Verifique os dados antes de finalizar o vínculo neural.
              </p>
            </div>
          </>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center' }}>
            <label style={{ fontSize: '0.85rem', color: '#888', fontWeight: '800', letterSpacing: '1px' }}>NOME DE AGENTE</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ 
                  width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', 
                  padding: '15px', borderRadius: '12px', color: 'white', outline: 'none', fontSize: '0.85rem',
                  textAlign: 'center'
                }}
                placeholder="Identidade de Acesso"
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center' }}>
            <label style={{ fontSize: '0.85rem', color: '#888', fontWeight: '800', letterSpacing: '1px' }}>SENHA DE ACESSO</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ 
                  width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', 
                  padding: '15px', borderRadius: '12px', color: 'white', outline: 'none', fontSize: '0.85rem',
                  textAlign: 'center'
                }}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <p style={{ color: '#ff5555', fontSize: '0.85rem', background: 'rgba(255, 85, 85, 0.1)', padding: '12px', borderRadius: '8px' }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              type="submit" disabled={loading} className="btn-primary"
              style={{ width: '100%', padding: '18px', justifyContent: 'center', fontSize: '0.85rem', color: 'black', fontWeight: '900' }}
            >
              {loading ? 'PROCESSANDO...' : (isRegistering ? 'FINALIZAR REGISTRO' : 'VINCULAR AO SISTEMA')}
            </button>

            {!isRegistering && (
              <button 
                type="button" 
                onClick={() => { setIsRegistering(true); setError(''); }}
                style={{ 
                  background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#888', padding: '15px', 
                  borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                Faça seu primeiro Check-in
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
