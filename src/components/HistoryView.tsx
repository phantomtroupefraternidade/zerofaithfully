import React, { useEffect, useState } from 'react';
import { Clock, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Profile {
  id: string;
  name: string;
  photo_url: string;
  last_login: string;
}

const HistoryView: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('zf_profiles')
          .select('*')
          .order('last_login', { ascending: false })
          .limit(20);

        if (error) throw error;
        setProfiles(data || []);
      } catch (err) {
        console.error('Error fetching access history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    // Refresh every 30 seconds to match the heartbeat interval
    const ticker = setInterval(fetchHistory, 30000);

    // Realtime subscription to see new logins live
    const subscription = supabase
      .channel('public:zf_profiles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'zf_profiles' }, fetchHistory)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'zf_profiles' }, fetchHistory)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
      clearInterval(ticker);
    };
  }, []);

  return (
    <div className="history-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-1px' }}>REGISTRO DE <span style={{ color: '#888' }}>ACESSO</span></h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '5px' }}>Histórico neural de agentes ativos na plataforma</p>
      </header>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <div style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '20px',
          overflowY: 'auto',
          paddingRight: '10px'
        }}>
          {profiles.map((profile) => {
            const timeAgo = formatDistanceToNow(new Date(profile.last_login), { addSuffix: true, locale: ptBR });
            const isOnline = (new Date().getTime() - new Date(profile.last_login).getTime()) < 120000; // Online if seen in last 2 mins

            return (
              <div key={profile.id} className="glass-card" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '20px', 
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                position: 'relative'
              }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '50%', 
                    overflow: 'hidden',
                    border: '2px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <img src={profile.photo_url} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  {isOnline && (
                    <div style={{ 
                      position: 'absolute', 
                      bottom: '2px', 
                      right: '2px', 
                      width: '12px', 
                      height: '12px', 
                      background: '#00ff88', 
                      borderRadius: '50%', 
                      border: '2px solid #000',
                      boxShadow: '0 0 8px #00ff88, 0 0 16px #00ff88',
                      animation: 'pulse-online 1.5s ease-in-out infinite'
                    }} />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '4px', color: 'white' }}>{profile.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', fontSize: '0.75rem' }}>
                    <Clock size={12} />
                    <span>{isOnline ? 'Ativo agora' : `Visto por último ${timeAgo}`}</span>
                  </div>
                </div>

                <div style={{ opacity: 0.3 }}>
                  <ShieldCheck size={20} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-online {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
};

export default HistoryView;
