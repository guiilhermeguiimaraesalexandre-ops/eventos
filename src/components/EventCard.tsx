import { Link } from 'react-router-dom';
import type { EventRow } from '../types';
import { fmtData, fmtMoeda } from '../utils/format';
import { APP_URL } from '../lib/supabaseClient';

interface Props {
  ev: EventRow;
  inscritos: number;
  onToggleStatus: (ev: EventRow) => void;
  onDelete: (ev: EventRow) => void;
}

export default function EventCard({ ev, inscritos, onToggleStatus, onDelete }: Props) {
  const linkForm = `${APP_URL}/f/${ev.id}`;

  function copiar(url: string) {
    navigator.clipboard.writeText(url);
  }

  return (
    <div className="event-card">
      <img className="event-thumb" src={ev.imagens?.[0] || ''} onError={e => (e.currentTarget.style.display = 'none')} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--fh)', fontWeight: 700, fontSize: 14 }}>{ev.nome}</div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', margin: '4px 0 8px' }}>
          📅 {fmtData(ev.data)} {ev.hora && `· ⏰ ${ev.hora}`} {ev.local && `· 📍 ${ev.local}`}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {ev.tipo === 'pago'
            ? <span className="badge b-paid">💰 R$ {fmtMoeda(ev.valor)}</span>
            : <span className="badge b-free">🆓 Grátis</span>}
          {ev.status === 'ATIVO' && <span className="badge b-on">● Ativo</span>}
          {ev.status === 'INATIVO' && <span className="badge b-off">● Inativo</span>}
          {ev.status === 'FINALIZADO' && <span className="badge b-fin">🏁 Finalizado</span>}
          <span className="badge" style={{ background: 'var(--surface2)' }}>
            👥 {inscritos}{ev.vagas > 0 ? `/${ev.vagas}` : ''}
          </span>
        </div>
        <div className="event-actions">
          <button className="btn btn-g btn-sm" onClick={() => onToggleStatus(ev)}>
            {ev.status === 'ATIVO' ? '⛔ Desativar' : '✅ Ativar'}
          </button>
          <Link className="btn btn-g btn-sm" to={`/admin/editar/${ev.id}`}>✏️ Editar</Link>
          <Link className="btn btn-g btn-sm" to={`/admin/inscritos/${ev.id}`}>👥 Inscritos</Link>
          <button className="btn btn-g btn-sm" onClick={() => copiar(linkForm)}>🔗 Copiar link</button>
          <a className="btn btn-g btn-sm" href={`${APP_URL}/presenca/${ev.id}`} target="_blank" rel="noreferrer">📋 Presença</a>
          <a className="btn btn-g btn-sm" href={`${APP_URL}/checkin/${ev.id}`} target="_blank" rel="noreferrer">✅ Check-in</a>
          <a className="btn btn-g btn-sm" href={`${APP_URL}/sorteio/${ev.id}`} target="_blank" rel="noreferrer">🎲 Sorteio</a>
          <button className="btn btn-d btn-sm" onClick={() => onDelete(ev)}>🗑️</button>
        </div>
      </div>
    </div>
  );
}
