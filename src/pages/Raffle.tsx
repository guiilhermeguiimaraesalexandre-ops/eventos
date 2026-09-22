import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { EventRow } from '../types';

interface Elegivel { id: string; nome: string; }

export default function Raffle() {
  const { eventId } = useParams();
  const [ev, setEv] = useState<EventRow | null>(null);
  const [disponiveis, setDisponiveis] = useState<Elegivel[]>([]);
  const [historico, setHistorico] = useState<string[]>([]);
  const [sorteando, setSorteando] = useState(false);
  const [vencedor, setVencedor] = useState('');

  async function load() {
    const { data: evData } = await supabase.from('events').select('*').eq('id', eventId).single();
    setEv(evData as EventRow);
    const { data } = await supabase
      .from('registrations')
      .select('id, nome')
      .eq('event_id', eventId)
      .eq('presenca', true)
      .eq('sorteado', false);
    setDisponiveis((data as Elegivel[]) || []);
  }

  useEffect(() => { load(); }, [eventId]);

  async function sortear() {
    if (disponiveis.length === 0) return;
    setSorteando(true);

    let ticks = 0;
    const escolhido = disponiveis[Math.floor(Math.random() * disponiveis.length)];
    const interval = setInterval(() => {
      setVencedor(disponiveis[Math.floor(Math.random() * disponiveis.length)].nome);
      ticks++;
      if (ticks >= 18) {
        clearInterval(interval);
        setVencedor(escolhido.nome);
        finalizar(escolhido);
      }
    }, 80);
  }

  async function finalizar(escolhido: Elegivel) {
    await supabase.from('registrations')
      .update({ sorteado: true, sorteado_em: new Date().toISOString() })
      .eq('id', escolhido.id);
    setHistorico(prev => [escolhido.nome, ...prev]);
    setSorteando(false);
    load();
  }

  if (!ev) return <div className="pub-page"><div className="spin-lg" /></div>;

  return (
    <div className="pub-page">
      <div className="pub-wrap">
        <div className="pub-card pub-body" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>🎲</div>
          <h2 style={{ fontFamily: 'var(--fh)' }}>{ev.nome}</h2>
          <p style={{ color: 'var(--muted)', fontSize: 12.5, margin: '6px 0 20px' }}>
            👥 {disponiveis.length} participante(s) elegível(is) · 🏆 {historico.length} sorteado(s)
          </p>

          {vencedor && (
            <div style={{ background: `linear-gradient(135deg, ${ev.cor}, #7c3aed)`, borderRadius: 16, padding: 24, marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', fontWeight: 700, marginBottom: 6 }}>🏆 SORTEADO</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{vencedor}</div>
            </div>
          )}

          {disponiveis.length === 0 ? (
            <div style={{ background: 'var(--gold-light)', borderRadius: 12, padding: 14, fontWeight: 700, color: 'var(--gold)' }}>
              🎉 Todos os participantes elegíveis já foram sorteados!
            </div>
          ) : (
            <button className="btn btn-p btn-full" disabled={sorteando} style={{ background: ev.cor, padding: 16, fontSize: 15 }} onClick={sortear}>
              {sorteando ? '🎰 Sorteando...' : '🎲 Realizar sorteio!'}
            </button>
          )}

          {historico.length > 0 && (
            <div style={{ marginTop: 22, textAlign: 'left' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase' }}>Histórico</div>
              {historico.map((n, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 10px', background: i % 2 ? '#fff' : 'var(--surface2)', borderRadius: 8, marginBottom: 3, fontSize: 13 }}>
                  <span style={{ fontWeight: 700 }}>{i + 1}.</span> {n}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
