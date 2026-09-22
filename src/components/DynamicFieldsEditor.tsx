import { useState } from 'react';
import type { CampoDinamico, CampoTipo } from '../types';

const TIPOS: { value: CampoTipo; label: string }[] = [
  { value: 'text', label: 'Texto curto' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'email', label: 'Email' },
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'select', label: 'Dropdown' },
  { value: 'radio', label: 'Múltipla escolha' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'informativo', label: '📢 Informativo' },
  { value: 'pix', label: '🟢 PIX' },
  { value: 'upload', label: '📎 Upload' },
  { value: 'oab', label: '⚖️ Número OAB' }
];

interface Props {
  campos: CampoDinamico[];
  onChange: (campos: CampoDinamico[]) => void;
}

export default function DynamicFieldsEditor({ campos, onChange }: Props) {
  const [novo, setNovo] = useState<CampoDinamico>({ label: '', type: 'text', required: false });

  function addCampo() {
    if (novo.type !== 'informativo' && novo.type !== 'pix' && !novo.label.trim()) return;
    onChange([...campos, novo]);
    setNovo({ label: '', type: 'text', required: false });
  }

  function removeCampo(i: number) {
    onChange(campos.filter((_, idx) => idx !== i));
  }

  const precisaOpcoes = novo.type === 'select' || novo.type === 'radio';

  return (
    <div className="card">
      <div style={{ fontWeight: 800, marginBottom: 10 }}>🔧 Campos do Formulário</div>
      <p style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 10 }}>
        Nome, Telefone, Email, LGPD e Acessibilidade já são fixos automaticamente.
      </p>

      {campos.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {campos.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ flex: 1, fontSize: 12.5 }}>{c.label || c.infoText?.slice(0, 30) || '(sem título)'}</span>
              <span className="badge" style={{ background: 'var(--surface2)' }}>{c.type}</span>
              {c.required && <span className="badge b-off">obrig.</span>}
              <button className="btn btn-d btn-sm" onClick={() => removeCampo(i)}>×</button>
            </div>
          ))}
        </div>
      )}

      <div className="row2">
        <div className="fg">
          <label>Nome do campo</label>
          <input value={novo.label} onChange={e => setNovo({ ...novo, label: e.target.value })} placeholder="Ex: CPF, Empresa..." />
        </div>
        <div className="fg">
          <label>Tipo</label>
          <select value={novo.type} onChange={e => setNovo({ ...novo, type: e.target.value as CampoTipo })}>
            {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {precisaOpcoes && (
        <div className="fg">
          <label>Opções (uma por linha)</label>
          <textarea
            value={(novo.options || []).join('\n')}
            onChange={e => setNovo({ ...novo, options: e.target.value.split('\n').filter(Boolean) })}
          />
        </div>
      )}

      {novo.type === 'informativo' && (
        <div className="fg">
          <label>Texto informativo</label>
          <textarea value={novo.infoText || ''} onChange={e => setNovo({ ...novo, infoText: e.target.value })} />
        </div>
      )}

      {novo.type === 'pix' && (
        <>
          <div className="fg"><label>Chave PIX</label><input value={novo.pixKey || ''} onChange={e => setNovo({ ...novo, pixKey: e.target.value })} /></div>
          <div className="fg"><label>Beneficiário</label><input value={novo.pixNome || ''} onChange={e => setNovo({ ...novo, pixNome: e.target.value })} /></div>
        </>
      )}

      {novo.type !== 'informativo' && novo.type !== 'pix' && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, textTransform: 'none', fontWeight: 500, marginBottom: 10 }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={!!novo.required} onChange={e => setNovo({ ...novo, required: e.target.checked })} />
          Obrigatório
        </label>
      )}

      <button className="btn btn-g btn-full" onClick={addCampo}>＋ Adicionar campo</button>
    </div>
  );
}
