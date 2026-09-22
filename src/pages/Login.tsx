import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!email || !pass) { setErr('Preencha email e senha.'); return; }
    setLoading(true);
    const { error } = await signIn(email, pass);
    setLoading(false);
    if (error) { setErr(error.message); return; }
    nav('/admin');
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleLogin}>
        <div className="login-title">OAB Rio Preto — Painel de Eventos</div>
        {err && <div className="err-msg">{err}</div>}
        <div className="fg">
          <label>E-mail</label>
          <input type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@oabriopreto.org.br" />
        </div>
        <div className="fg">
          <label>Senha</label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" />
        </div>
        <button className="btn btn-p btn-full" disabled={loading}>
          {loading ? 'Entrando...' : 'Acessar Painel'}
        </button>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 14, textAlign: 'center' }}>
          Crie o usuário admin em Supabase → Authentication → Users
        </p>
      </form>
    </div>
  );
}
