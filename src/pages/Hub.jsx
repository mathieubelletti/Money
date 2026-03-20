import { supabase } from '../supabase';
import { useData } from '../context/DataContext';

const Hub = ({ onEnterBudget, onEnterSharedExpenses }) => {
  const { session } = useData();
  const user = session?.user;
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilisateur';
  const avatarUrl = user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`;

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  const apps = [
    {
      id: 'budget',
      name: 'Budget',
      desc: 'Gérez vos finances personnelles',
      icon: 'insights',
      color: 'var(--color-primary)',
      bg: 'var(--color-primary-glass)',
      onClick: onEnterBudget
    },
    {
      id: 'commun',
      name: 'Commun',
      desc: 'Dépenses partagées à deux',
      icon: 'groups',
      color: 'var(--color-primary)',
      bg: 'var(--color-primary-glass)',
      onClick: onEnterSharedExpenses
    },
    {
      id: 'tasks',
      name: 'Tasks',
      desc: 'Gestion de projets complexes',
      icon: 'assignment',
      color: 'var(--color-primary)',
      bg: 'var(--color-primary-glass)',
    },
    {
      id: 'todolist',
      name: 'Todolist',
      desc: 'Simple check-list quotidienne',
      icon: 'done_all',
      color: 'var(--color-primary)',
      bg: 'var(--color-primary-glass)',
    }
  ];

  return (
    <div className="hub-container">
      <header className="hub-header">
        <div className="hub-user">
          <img 
            src={avatarUrl} 
            alt="User" 
            className="hub-avatar" 
          />
          <div className="hub-greeting">
            <span className="hub-app-title">Money Hub</span>
            <span className="hub-user-name">Bonjour, {userName}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="hub-notif">
            <span className="material-icons-round">notifications</span>
          </button>
          <button 
            onClick={handleLogout}
            style={{ 
              width: 40, height: 40, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444',
              border: 'none', cursor: 'pointer'
            }}
          >
            <span className="material-icons-round">logout</span>
          </button>
        </div>
      </header>

      <main className="hub-content">
        <div className="hub-title-section">
          <h1 className="hub-main-title">Vos applications</h1>
          <p className="hub-subtitle">Gérez votre quotidien avec la suite Money</p>
        </div>

        <div className="hub-apps-list">
          {apps.map(app => (
            <div 
              key={app.id} 
              className="hub-app-card"
              onClick={app.onClick}
            >
              <div 
                className="hub-app-icon-bg"
                style={{ backgroundColor: app.bg, color: app.color }}
              >
                <span className="material-icons-round">{app.icon}</span>
              </div>
              <div className="hub-app-info">
                <h3 className="hub-app-name">{app.name}</h3>
                <p className="hub-app-desc">{app.desc}</p>
              </div>
              <span className="material-icons-round hub-app-chevron">chevron_right</span>
            </div>
          ))}
        </div>

        <div className="hub-help-banner">
          <h3 className="hub-help-title">Besoin d'aide ?</h3>
          <p className="hub-help-text">
            Consultez notre guide d'utilisation ou contactez le support Money.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Hub;
