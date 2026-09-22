import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import EventCard from '../components/EventCard';
import { supabase } from '../lib/supabaseClient';
import type { EventRow } from '../types';

export default function Dashboard() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  async function load() {
    setLoading(true);
    const { data: evs } = await supabase.from('events').select('*').order('data', { ascending: true });
    const { data: stats } = await supabase.from('v_event_stats').select('*');

    setEvents((evs as EventRow[]) || []);
    const map: Record<string, number> = {};
    (stats || []).forEach((s: any) => { map[s.event_id] = s.total_inscritos; });
    setCounts(map);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleStatus(ev: EventRow) {
    const novo = ev.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    await supabase.from('events').update({ status: novo }).eq('id', ev.id);
    load();
  }

  async function del(ev: EventRow) {
    if (!confirm(`Excluir "${ev.nome}" e todos os inscritos? Esta ação não pode ser desfeita.`)) return;
    await supabase.from('events').delete().eq('id', ev.id);
    load();
  }

  const filtered = events.filter(e =>
    !q || e.nome.toLowerCase().includes(q.toLowerCase()) || (e.local || '').toLowerCase().includes(q.toLowerCase())
  );

  const ativos = filtered.filter(e => e.status !== 'FINALIZADO');
  const totalInscritos = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div className="pt">Dashboard 📊</div>
            <div className="ps">Visão geral dos seus eventos</div>
          </div>
          <Link className="btn btn-p" to="/admin/novo">+ Novo Evento</Link>
        </div>

        <div className="sg">
          <div className="sc"><div className="sv">{events.length}</div><div className="sl">Total de eventos</div></div>
          <div className="sc"><div className="sv">{events.filter(e => e.status === 'ATIVO').length}</div><div className="sl">Ativos</div></div>
          <div className="sc"><div className="sv">{totalInscritos}</div><div className="sl">Total inscritos</div></div>
          <div className="sc"><div className="sv">{events.filter(e => e.tipo === 'pago').length}</div><div className="sl">Eventos pagos</div></div>
        </div>

        <div className="fg">
          <input placeholder="Buscar por nome ou local..." value={q} onChange={e => setQ(e.target.value)} />
        </div>

        {loading && <div className="empty">Carregando...</div>}
        {!loading && ativos.length === 0 && <div className="empty">Nenhum evento encontrado. Crie o primeiro! ✨</div>}
        {ativos.map(ev => (
          <EventCard key={ev.id} ev={ev} inscritos={counts[ev.id] || 0} onToggleStatus={toggleStatus} onDelete={del} />
        ))}
      </div>
    </div>
  );
}
