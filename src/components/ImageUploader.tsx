import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Props {
  imagens: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
}

export async function uploadFile(file: File, folder = 'eventos'): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('uploads').upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('uploads').getPublicUrl(path);
  return data.publicUrl;
}

export default function ImageUploader({ imagens, onChange, folder = 'eventos' }: Props) {
  const [enviando, setEnviando] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setEnviando(true);
    try {
      const restante = 8 - imagens.length;
      const list = Array.from(files).slice(0, Math.max(restante, 0));
      const urls = await Promise.all(list.map(f => uploadFile(f, folder)));
      onChange([...imagens, ...urls]);
    } catch (e: any) {
      alert('Erro no upload: ' + (e.message || e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="card">
      <div style={{ fontWeight: 800, marginBottom: 10 }}>🖼️ Imagens do evento</div>
      <div style={{
        border: '2px dashed var(--border2)', borderRadius: 10, padding: 18, textAlign: 'center',
        position: 'relative', cursor: 'pointer', background: 'var(--bg)'
      }}>
        <input
          type="file" accept="image/*" multiple
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
          onChange={e => handleFiles(e.target.files)}
        />
        {enviando ? 'Enviando...' : 'Clique ou arraste imagens (até 8)'}
      </div>

      {imagens.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8, marginTop: 10 }}>
          {imagens.map((url, i) => (
            <div key={url} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '2px solid ' + (i === 0 ? 'var(--accent)' : 'var(--border)') }}>
              <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                onClick={() => onChange(imagens.filter((_, idx) => idx !== i))}
                style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11 }}
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
