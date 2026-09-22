import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { EventRow } from '../types';

interface PublicReg { id: string; nome: string; presenca: boolean; created_at: string; }

export default function PresencePublic() {
  const { eventId } = useParams();
  const [ev, setEv] = useState<EventRow | null>(null);
  const [regs, setRegs] = useState<PublicReg[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [{ data: evData }, { data: regData }] = await Promise.all([
      supabase.from('events').select('*').eq('id', eventId).single(),
      supabase.from('v_public_registrations').select('*').eq('event_id', eventId).order('created_at', { ascending: true })
    ]);
    setEv(evData as EventRow);
    setRegs((regData as PublicReg[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // realtime: atualiza a lista assim que alguém se inscreve ou confirma presença
    const channel = supabase
      .channel('presenca-' + eventId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations', filter: `event_id=eq.${eventId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  if (loading) return <div className="pub-page"><div className="spin-lg" /></div>;
  if (!ev) return <div className="pub-page"><div className="pub-card pub-body">Evento não encontrado.</div></div>;

  const manuais = (ev.nomes_manuais || '').split('\n').filter(Boolean);
  const totalPresentes = regs.filter(r => r.presenca).length;

  return (
    <div className="pub-page">
      <div className="pub-wrap">
        <div className="pub-card pub-body">
          <h2 style={{ fontFamily: 'var(--fh)' }}>{ev.nome}</h2>
          <p style={{ color: 'var(--muted)', fontSize: 12, margin: '4px 0 16px' }}>Lista de presença — atualização em tempo real</p>

          <div className="sg" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="sc"><div className="sv">{regs.length + manuais.length}</div><div className="sl">Total</div></div>
            <div className="sc"><div className="sv">{totalPresentes}</div><div className="sl">Presentes</div></div>
            <div className="sc"><div className="sv">{manuais.length}</div><div className="sl">Manuais</div></div>
          </div>

          <div style={{ maxHeight: 460, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 12 }}>
            {regs.map((r, i) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderBottom: '1px solid var(--border)' }}>
                <span style={{ width: 26, height: 26, borderRadius: 7, background: ev.cor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                <strong style={{ flex: 1, fontSize: 13.5 }}>{r.nome}</strong>
                <span style={{ fontSize: 15 }}>{r.presenca ? '✅' : '⏳'}</span>
              </div>
            ))}
            {manuais.map((n, j) => (
              <div key={'m' + j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--surface2)' }}>
                <span style={{ fontSize: 10, color: 'var(--muted)', minWidth: 24 }}>{regs.length + j + 1}.</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{n.trim()}</span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>📝</span>
              </div>
            ))}
            {regs.length === 0 && manuais.length === 0 && <div className="empty">Nenhum inscrito ainda.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
