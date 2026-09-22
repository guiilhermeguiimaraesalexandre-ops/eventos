import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { uploadFile } from '../components/ImageUploader';
import type { EventRow } from '../types';
import { fmtData, maskCpf, maskTel, validarCpf, gerarProtocolo } from '../utils/format';

export default function PublicForm() {
  const { eventId } = useParams();
  const [ev, setEv] = useState<EventRow | null>(null);
  const [inscritos, setInscritos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [err, setErr] = useState('');

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [acess, setAcess] = useState('');
  const [acessDesc, setAcessDesc] = useState('');
  const [lgpd, setLgpd] = useState(false);
  const [loteIdx, setLoteIdx] = useState(0);
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [uploads, setUploads] = useState<Record<string, File | null>>({});

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('events').select('*').eq('id', eventId).single();
      setEv(data as EventRow);
      const { count } = await supabase
        .from('registrations').select('*', { count: 'exact', head: true }).eq('event_id', eventId);
      setInscritos(count || 0);
      setLoading(false);
    }
    load();
  }, [eventId]);

  if (loading) return <div className="pub-page"><div className="spin-lg" /></div>;
  if (!ev) return <div className="pub-page"><div className="pub-card pub-body">Evento não encontrado.</div></div>;

  const manuais = (ev.nomes_manuais || '').split('\n').filter(Boolean).length;
  const totalInscritos = inscritos + manuais;
  const esgotado = ev.vagas > 0 && totalInscritos >= ev.vagas;
  const encerrado = ev.status !== 'ATIVO' || esgotado;

  if (encerrado) {
    return (
      <div className="pub-page">
        <div className="pub-wrap"><div className="pub-card pub-body" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>🔒</div>
          <h2>Inscrições encerradas</h2>
          <p style={{ color: 'var(--muted)', marginTop: 8 }}>
            {ev.msg_esgotado || (esgotado ? 'Todas as vagas foram preenchidas.' : 'Este evento foi encerrado.')}
          </p>
        </div></div>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="pub-page">
        <div className="pub-wrap"><div className="pub-card pub-body" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>✅</div>
          <h2>Inscrição confirmada!</h2>
          <p style={{ color: 'var(--muted)', margin: '8px 0 14px' }}>{ev.nome}</p>
          <div style={{ background: 'var(--accent-light)', borderRadius: 12, padding: 12, fontWeight: 800, color: 'var(--accent)' }}>
            Protocolo: {sucesso}
          </div>
        </div></div>
      </div>
    );
  }

  async function submit() {
    setErr('');
    if (!nome.trim()) { setErr('Nome é obrigatório'); return; }
    if (!telefone.trim()) { setErr('Telefone é obrigatório'); return; }
    if (!email.includes('@')) { setErr('Email inválido'); return; }
    if (!acess) { setErr('Responda a pergunta de acessibilidade'); return; }
    if (!lgpd) { setErr('É necessário aceitar os termos da LGPD'); return; }

    for (const c of ev!.campos) {
      if (!c.required || c.type === 'informativo' || c.type === 'pix') continue;
      if (c.type === 'upload' && !uploads[c.label]) { setErr('Arquivo obrigatório: ' + c.label); return; }
      if (c.type !== 'upload' && !extras[c.label]) { setErr('Obrigatório: ' + c.label); return; }
      if (c.type === 'cpf' && !validarCpf(extras[c.label] || '')) { setErr('CPF inválido: ' + c.label); return; }
    }

    setEnviando(true);
    try {
      const dadosFinal: Record<string, string> = { ...extras };
      for (const [label, file] of Object.entries(uploads)) {
        if (file) dadosFinal[label + '_link'] = await uploadFile(file, 'comprovantes');
      }

      const lote = ev!.lotes?.[loteIdx];
      const protocolo = gerarProtocolo();
      const cpfCampo = ev!.campos.find(c => c.type === 'cpf');

      const { error } = await supabase.from('registrations').insert({
        event_id: eventId,
        nome, telefone, email,
        cpf: cpfCampo ? (extras[cpfCampo.label] || '').replace(/\D/g, '') : null,
        dados: dadosFinal,
        possui_deficiencia: acess,
        descricao_deficiencia: acess === 'Sim' ? acessDesc : '',
        lgpd_aceito: true,
        lote: lote?.nome || null,
        valor_lote: lote?.preco || null,
        protocolo
      });

      if (error) throw error;
      setSucesso(protocolo);
    } catch (e: any) {
      setErr('Erro ao enviar: ' + (e.message || e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pub-page" style={{ background: ev.bg_theme === 'dark' ? '#0f172a' : ev.bg_custom || '#f4f6fa' }}>
      <div className="pub-wrap">
        <div className="pub-card">
          {ev.imagens?.[0] && <img src={ev.imagens[0]} style={{ width: '100%', maxHeight: 260, objectFit: 'cover' }} />}
          <div className="pub-body">
            <div className="badge" style={{ background: ev.cor + '22', color: ev.cor, marginBottom: 10 }}>
              {ev.tipo === 'pago' ? '💰 Pago' : '🆓 Gratuito'}
            </div>
            <div className="pub-name">{ev.nome}</div>
            {ev.descricao && <div className="pub-desc">{ev.descricao}</div>}
            <div className="pub-meta">
              {ev.data && <span className="pub-meta-item">📅 {fmtData(ev.data)}</span>}
              {ev.hora && <span className="pub-meta-item">⏰ {ev.hora}</span>}
              {ev.local && <span className="pub-meta-item">📍 {ev.local}</span>}
              <span className="pub-meta-item">{ev.modalidade}</span>
            </div>

            {ev.vagas > 0 && ev.vagas_vis === 'visivel' && (
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
                {ev.vagas - totalInscritos} vagas disponíveis de {ev.vagas}
              </p>
            )}

            {err && <div className="err-msg">{err}</div>}

            {(ev.lotes || []).length > 0 && (
              <div className="fg">
                <label>Categoria</label>
                {ev.lotes.map((l, i) => (
                  <label key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', textTransform: 'none', fontWeight: 500, padding: '8px 0' }}>
                    <input type="radio" checked={loteIdx === i} onChange={() => setLoteIdx(i)} style={{ width: 'auto' }} />
                    {l.nome} — R$ {l.preco.toFixed(2)}
                  </label>
                ))}
              </div>
            )}

            <div className="fg"><label>Nome completo *</label><input value={nome} onChange={e => setNome(e.target.value)} /></div>
            <div className="fg"><label>Telefone / WhatsApp *</label><input value={telefone} onChange={e => setTelefone(maskTel(e.target.value))} /></div>
            <div className="fg"><label>Email *</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>

            {ev.campos.map((c, i) => {
              if (c.type === 'informativo') {
                return <div key={i} className="fg" style={{ background: ev.cor + '15', borderRadius: 10, padding: 10, fontSize: 12.5 }}>📢 {c.infoText}</div>;
              }
              if (c.type === 'pix') {
                return (
                  <div key={i} className="fg" style={{ background: 'var(--green-light)', borderRadius: 10, padding: 12 }}>
                    <strong>💚 Pagamento via PIX</strong>
                    {c.pixNome && <div style={{ fontSize: 12 }}>Beneficiário: {c.pixNome}</div>}
                    <div style={{ fontFamily: 'monospace', marginTop: 6 }}>{c.pixKey}</div>
                  </div>
                );
              }
              if (c.type === 'upload') {
                return (
                  <div key={i} className="fg">
                    <label>📎 {c.label}{c.required && ' *'}</label>
                    <input type="file" onChange={e => setUploads({ ...uploads, [c.label]: e.target.files?.[0] || null })} />
                  </div>
                );
              }
              if (c.type === 'select') {
                return (
                  <div key={i} className="fg">
                    <label>{c.label}{c.required && ' *'}</label>
                    <select value={extras[c.label] || ''} onChange={e => setExtras({ ...extras, [c.label]: e.target.value })}>
                      <option value="">Selecione...</option>
                      {(c.options || []).map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                );
              }
              if (c.type === 'radio') {
                return (
                  <div key={i} className="fg">
                    <label>{c.label}{c.required && ' *'}</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {(c.options || []).map(o => (
                        <label key={o} style={{ textTransform: 'none', fontWeight: 500, display: 'flex', gap: 5, alignItems: 'center', border: '1.5px solid var(--border)', borderRadius: 20, padding: '6px 12px' }}>
                          <input type="radio" name={c.label} style={{ width: 'auto' }} checked={extras[c.label] === o} onChange={() => setExtras({ ...extras, [c.label]: o })} /> {o}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              }
              if (c.type === 'checkbox') {
                return (
                  <label key={i} className="fg" style={{ display: 'flex', gap: 8, textTransform: 'none', fontWeight: 500 }}>
                    <input type="checkbox" style={{ width: 'auto' }} checked={extras[c.label] === 'Sim'} onChange={e => setExtras({ ...extras, [c.label]: e.target.checked ? 'Sim' : 'Não' })} />
                    {c.label}
                  </label>
                );
              }
              const inputType = c.type === 'email' ? 'email' : c.type === 'number' ? 'number' : c.type === 'date' ? 'date' : 'text';
              return (
                <div key={i} className="fg">
                  <label>{c.type === 'oab' ? '⚖️ ' : ''}{c.label}{c.required && ' *'}</label>
                  <input
                    type={inputType}
                    value={extras[c.label] || ''}
                    onChange={e => {
                      let v = e.target.value;
                      if (c.type === 'cpf') v = maskCpf(v);
                      setExtras({ ...extras, [c.label]: v });
                    }}
                  />
                </div>
              );
            })}

            <div className="fg">
              <label>Possui deficiência ou necessidade especial? *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <label style={{ textTransform: 'none', fontWeight: 500, display: 'flex', gap: 5, border: '1.5px solid var(--border)', borderRadius: 20, padding: '6px 12px' }}>
                  <input type="radio" name="acess" style={{ width: 'auto' }} checked={acess === 'Não'} onChange={() => setAcess('Não')} /> Não
                </label>
                <label style={{ textTransform: 'none', fontWeight: 500, display: 'flex', gap: 5, border: '1.5px solid var(--border)', borderRadius: 20, padding: '6px 12px' }}>
                  <input type="radio" name="acess" style={{ width: 'auto' }} checked={acess === 'Sim'} onChange={() => setAcess('Sim')} /> Sim
                </label>
              </div>
              {acess === 'Sim' && <input style={{ marginTop: 8 }} placeholder="Descreva sua necessidade" value={acessDesc} onChange={e => setAcessDesc(e.target.value)} />}
            </div>

            <label className="fg" style={{ display: 'flex', gap: 8, textTransform: 'none', fontWeight: 500, background: 'var(--green-light)', borderRadius: 10, padding: 12 }}>
              <input type="checkbox" style={{ width: 'auto', marginTop: 2 }} checked={lgpd} onChange={e => setLgpd(e.target.checked)} />
              <span style={{ fontSize: 12 }}>Declaro que li e estou ciente do tratamento dos meus dados conforme a LGPD (Lei 13.709/2018), usados exclusivamente para controle de presença e emissão de certificado deste evento. *</span>
            </label>

            <button className="btn btn-p btn-full" style={{ background: ev.cor }} disabled={enviando} onClick={submit}>
              {enviando ? 'Enviando...' : (ev.btn_txt || 'Confirmar inscrição')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
