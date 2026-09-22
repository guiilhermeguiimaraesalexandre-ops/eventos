import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Sidebar() {
  const { pathname } = useLocation();
  const { signOut, user } = useAuth();

  const items = [
    { to: '/admin', label: '📊 Dashboard', match: (p: string) => p === '/admin' },
    { to: '/admin/novo', label: '✨ Criar Evento', match: (p: string) => p === '/admin/novo' || p.startsWith('/admin/editar') }
  ];

  return (
    <div className="sidebar">
      <div className="sb-logo">⚖️ OAB Rio Preto</div>
      {items.map(it => (
        <Link key={it.to} to={it.to} className={'nav-item' + (it.match(pathname) ? ' active' : '')}>
          {it.label}
        </Link>
      ))}
      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', padding: '0 8px 8px' }}>{user?.email}</div>
        <button className="btn btn-d btn-sm btn-full" onClick={() => signOut()}>Sair</button>
      </div>
    </div>
  );
}
