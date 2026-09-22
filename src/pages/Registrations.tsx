import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { supabase } from '../lib/supabaseClient';
import type { EventRow, RegistrationRow } from '../types';

export default function Registrations() {
  const { id } = useParams();
  const [ev, setEv] = useState<EventRow | null>(null);
  const [regs, setRegs] = useState<RegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [{ data: evData }, { data: regData }] = await Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase.from('registrations').select('*').eq('event_id', id).order('created_at', { ascending: true })
    ]);
    setEv(evData as EventRow);
    setRegs((regData as RegistrationRow[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  // colunas dinâmicas = união das chaves de "dados" de todas as inscrições
  const colunasExtras = Array.from(new Set(regs.flatMap(r => Object.keys(r.dados || {}))));

  function exportarCsv() {
    const headers = ['Nome', 'Telefone', 'Email', 'CPF', ...colunasExtras, 'Presença', 'Lote', 'Data inscrição'];
    const linhas = regs.map(r => [
      r.nome, r.telefone || '', r.email || '', r.cpf || '',
      ...colunasExtras.map(c => r.dados?.[c] || ''),
      r.presenca ? 'Sim' : 'Não', r.lote || '', new Date(r.created_at).toLocaleString('pt-BR')
    ]);
    const csv = [headers, ...linhas].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `inscritos_${ev?.nome || 'evento'}.csv`;
    a.click();
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div className="pt">👥 Inscritos {ev ? `— ${ev.nome}` : ''}</div>
            <div className="ps">{regs.length} inscrito(s)</div>
          </div>
          <button className="btn btn-p" onClick={exportarCsv}>⬇️ Exportar CSV</button>
        </div>

        {loading && <div className="empty">Carregando...</div>}
        {!loading && regs.length === 0 && <div className="empty">Nenhum inscrito ainda.</div>}

        {!loading && regs.length > 0 && (
          <div className="card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Nome', 'Telefone', 'Email', ...colunasExtras, 'Presença'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--border)', fontSize: 10.5, textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {regs.map(r => (
                  <tr key={r.id}>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>{r.nome}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>{r.telefone}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>{r.email}</td>
                    {colunasExtras.map(c => (
                      <td key={c} style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>{r.dados?.[c] || ''}</td>
                    ))}
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                      {r.presenca ? <span className="badge b-on">✅ Sim</span> : <span className="badge b-off">Não</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
