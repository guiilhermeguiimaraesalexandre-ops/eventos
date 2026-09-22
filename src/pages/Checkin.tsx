import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { EventRow } from '../types';
import { maskCpf, validarCpf } from '../utils/format';

export default function Checkin() {
  const { eventId } = useParams();
  const [ev, setEv] = useState<EventRow | null>(null);
  const [cpf, setCpf] = useState('');
  const [status, setStatus] = useState<'idle' | 'ok' | 'ja' | 'erro'>('idle');
  const [nomeConfirmado, setNomeConfirmado] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    supabase.from('events').select('*').eq('id', eventId).single().then(({ data }) => setEv(data as EventRow));
  }, [eventId]);

  async function confirmar() {
    if (!validarCpf(cpf)) { setStatus('erro'); return; }
    setEnviando(true);
    const cpfLimpo = cpf.replace(/\D/g, '');

    const { data: reg } = await supabase
      .from('registrations')
      .select('id, nome, presenca')
      .eq('event_id', eventId)
      .eq('cpf', cpfLimpo)
      .maybeSingle();

    if (!reg) { setStatus('erro'); setEnviando(false); return; }

    if (reg.presenca) {
      setNomeConfirmado(reg.nome);
      setStatus('ja');
      setEnviando(false);
      return;
    }

    const { error } = await supabase.from('registrations')
      .update({ presenca: true, presenca_em: new Date().toISOString() })
      .eq('id', reg.id);

    setEnviando(false);
    if (error) { setStatus('erro'); return; }
    setNomeConfirmado(reg.nome);
    setStatus('ok');
  }

  if (!ev) return <div className="pub-page"><div className="spin-lg" /></div>;

  return (
    <div className="pub-page">
      <div className="pub-wrap">
        <div className="pub-card pub-body" style={{ textAlign: 'center' }}>
          {status === 'idle' && (
            <>
              <div style={{ fontSize: 40 }}>📋</div>
              <h2 style={{ fontFamily: 'var(--fh)' }}>{ev.nome}</h2>
              <p style={{ color: 'var(--muted)', fontSize: 12.5, margin: '8px 0 18px' }}>Digite seu CPF para confirmar presença</p>
              <input
                value={cpf} onChange={e => setCpf(maskCpf(e.target.value))} maxLength={14}
                placeholder="000.000.000-00"
                style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, letterSpacing: 2 }}
              />
              <button className="btn btn-p btn-full" style={{ marginTop: 12 }} disabled={enviando} onClick={confirmar}>
                {enviando ? 'Verificando...' : '✅ Confirmar presença'}
              </button>
            </>
          )}

          {(status === 'ok' || status === 'ja') && (
            <>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, margin: '0 auto 14px' }}>✅</div>
              <h2 style={{ color: 'var(--green)' }}>{status === 'ja' ? 'Presença já confirmada' : 'Presença confirmada!'}</h2>
              <p style={{ fontWeight: 700, marginTop: 8 }}>{nomeConfirmado}</p>
            </>
          )}

          {status === 'erro' && (
            <>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--pink-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, margin: '0 auto 14px' }}>❌</div>
              <h2 style={{ color: 'var(--pink)' }}>CPF não encontrado</h2>
              <p style={{ color: 'var(--muted)', margin: '8px 0 16px' }}>Verifique o número e tente novamente.</p>
              <button className="btn btn-d btn-full" onClick={() => setStatus('idle')}>Tentar novamente</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
