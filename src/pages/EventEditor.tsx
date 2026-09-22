import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import DynamicFieldsEditor from '../components/DynamicFieldsEditor';
import ImageUploader from '../components/ImageUploader';
import { supabase } from '../lib/supabaseClient';
import type { CampoDinamico, EventRow, Lote } from '../types';

const VAZIO: Partial<EventRow> = {
  nome: '', descricao: '', data: '', hora: '', local: '',
  tipo: 'gratuito', valor: 0, modalidade: 'Presencial', status: 'ATIVO',
  imagens: [], campos: [], lotes: [], cor: '#4f46e5', btn_txt: '', msg_esgotado: '',
  email_protocolo: '', vagas: 0, vagas_vis: 'visivel', nomes_manuais: ''
};

export default function EventEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const editando = !!id;
  const [ev, setEv] = useState<Partial<EventRow>>(VAZIO);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(editando);

  useEffect(() => {
    if (!id) return;
    supabase.from('events').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setEv(data);
      setLoading(false);
    });
  }, [id]);

  function set<K extends keyof EventRow>(key: K, value: EventRow[K]) {
    setEv(prev => ({ ...prev, [key]: value }));
  }

  async function salvar() {
    if (!ev.nome?.trim()) { alert('Informe o nome do evento'); return; }
    if (!ev.data) { alert('Informe a data'); return; }
    setSaving(true);

    const payload = { ...ev };
    delete (payload as any).id;
    delete (payload as any).created_at;
    delete (payload as any).updated_at;

    if (editando) {
      const { error } = await supabase.from('events').update(payload).eq('id', id);
      setSaving(false);
      if (error) { alert('Erro: ' + error.message); return; }
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('events')
        .insert({ ...payload, created_by: userData.user?.id })
        .select('id').single();
      setSaving(false);
      if (error) { alert('Erro: ' + error.message); return; }
      nav(`/admin/editar/${data.id}`);
      return;
    }
    nav('/admin');
  }

  function addLote() {
    const nome = prompt('Nome do lote:');
    if (!nome) return;
    const qtd = parseInt(prompt('Quantidade de vagas:', '10') || '10');
    const preco = parseFloat(prompt('Preço (R$):', '0') || '0');
    set('lotes', [...(ev.lotes || []), { nome, quantidade: qtd, preco } as Lote]);
  }

  if (loading) return <div className="empty">Carregando...</div>;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <div className="pt">{editando ? 'Editar Evento ✏️' : 'Criar Evento ✨'}</div>
        <div className="ps" style={{ marginBottom: 16 }}>Monte o formulário de inscrição</div>

        <div className="card">
          <div className="fg">
            <label>Nome do Evento *</label>
            <input value={ev.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Curso de Ética OAB 2026" />
          </div>
          <div className="fg">
            <label>Descrição</label>
            <textarea value={ev.descricao} onChange={e => set('descricao', e.target.value)} rows={3} />
          </div>
          <div className="row2">
            <div className="fg"><label>Data *</label><input type="date" value={ev.data || ''} onChange={e => set('data', e.target.value)} /></div>
            <div className="fg"><label>Hora</label><input type="time" value={ev.hora} onChange={e => set('hora', e.target.value)} /></div>
          </div>
          <div className="fg"><label>Local / Endereço</label><input value={ev.local} onChange={e => set('local', e.target.value)} /></div>
          <div className="fg">
            <label>Modalidade</label>
            <select value={ev.modalidade} onChange={e => set('modalidade', e.target.value as any)}>
              <option value="Presencial">🏛️ Presencial</option>
              <option value="Online">💻 Online</option>
              <option value="Híbrido">🔀 Híbrido</option>
            </select>
          </div>
          <div className="fg">
            <label>Email para protocolo/notificação (opcional)</label>
            <input type="email" value={ev.email_protocolo} onChange={e => set('email_protocolo', e.target.value)} />
          </div>
        </div>

        <div className="card">
          <div style={{ fontWeight: 800, marginBottom: 10 }}>🎫 Vagas e Pagamento</div>
          <div className="row2">
            <div className="fg"><label>Limite de vagas (0 = ilimitado)</label><input type="number" value={ev.vagas} onChange={e => set('vagas', parseInt(e.target.value) || 0)} /></div>
            <div className="fg">
              <label>Exibir contador</label>
              <select value={ev.vagas_vis} onChange={e => set('vagas_vis', e.target.value as any)}>
                <option value="visivel">Visível ao público</option>
                <option value="invisivel">Oculto</option>
              </select>
            </div>
          </div>
          <div className="fg">
            <label>Tipo de evento</label>
            <select value={ev.tipo} onChange={e => set('tipo', e.target.value as any)}>
              <option value="gratuito">🆓 Gratuito</option>
              <option value="pago">💰 Pago</option>
            </select>
          </div>
          {ev.tipo === 'pago' && (
            <div className="fg"><label>Valor (R$)</label><input type="number" step="0.01" value={ev.valor} onChange={e => set('valor', parseFloat(e.target.value) || 0)} /></div>
          )}
          <div className="fg">
            <label>Nomes adicionados manualmente (1 por linha, contam no total)</label>
            <textarea value={ev.nomes_manuais} onChange={e => set('nomes_manuais', e.target.value)} rows={3} />
          </div>
        </div>

        <div className="card">
          <div style={{ fontWeight: 800, marginBottom: 10 }}>🎨 Personalização</div>
          <div className="row2">
            <div className="fg"><label>Cor principal</label><input type="color" value={ev.cor} onChange={e => set('cor', e.target.value)} /></div>
            <div className="fg"><label>Texto do botão</label><input value={ev.btn_txt} onChange={e => set('btn_txt', e.target.value)} placeholder="Quero me inscrever!" /></div>
          </div>
          <div className="fg"><label>Mensagem ao esgotar vagas</label><input value={ev.msg_esgotado} onChange={e => set('msg_esgotado', e.target.value)} /></div>
        </div>

        <ImageUploader imagens={ev.imagens || []} onChange={urls => set('imagens', urls)} />

        <DynamicFieldsEditor campos={(ev.campos as CampoDinamico[]) || []} onChange={c => set('campos', c)} />

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 800 }}>🎟️ Lotes / Categorias</div>
            <button className="btn btn-g btn-sm" onClick={addLote}>+ Adicionar lote</button>
          </div>
          {(ev.lotes || []).length === 0 && <div style={{ fontSize: 12, color: 'var(--muted)' }}>Nenhum lote configurado.</div>}
          {(ev.lotes || []).map((l, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 12.5 }}>
              <span>{l.nome} — {l.quantidade} vagas — R$ {l.preco.toFixed(2)}</span>
              <button className="btn btn-d btn-sm" onClick={() => set('lotes', (ev.lotes || []).filter((_, idx) => idx !== i))}>×</button>
            </div>
          ))}
        </div>

        <button className="btn btn-p btn-full" disabled={saving} onClick={salvar}>
          {saving ? 'Salvando...' : editando ? '💾 Salvar alterações' : '🚀 Publicar evento'}
        </button>
      </div>
    </div>
  );
}
