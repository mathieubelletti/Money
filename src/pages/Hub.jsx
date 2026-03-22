import { supabase } from '../supabase';
import { useData } from '../context/DataContext';

const Hub = ({ onEnterBudget, onEnterSharedExpenses, onEnterTaxes, onEnterFlowTask }) => {
  const { session, isDarkMode, toggleTheme } = useData();
  const user = session?.user;
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilisateur';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

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
      id: 'taxes',
      name: "Simulateur d'impôt",
      desc: 'Estimez vos impôts 2026',
      icon: 'calculate',
      color: 'var(--color-primary)',
      bg: 'var(--color-primary-glass)',
      onClick: onEnterTaxes
    },
    {
      id: 'flowtask',
      name: 'FlowTask',
      desc: 'Maîtrisez votre journée (Eisenhower)',
      icon: 'task_alt',
      color: 'var(--color-primary)',
      bg: 'var(--color-primary-glass)',
      onClick: onEnterFlowTask
    }
  ];

  return (
    <div className="hub-container">
      <header className="hub-header">
        <div className="hub-user">
          <div className="hub-avatar" style={{ overflow: 'hidden' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 13 }}>
                {initials}
              </div>
            )}
          </div>
          <div className="hub-greeting">
            <span className="hub-app-title">Money Hub</span>
            <span className="hub-user-name">Bonjour, {userName}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={toggleTheme}
            style={{ 
              width: 40, height: 40, borderRadius: '50%', background: 'transparent', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)',
              border: 'none', cursor: 'pointer'
            }}
            title={isDarkMode ? "Passer au thème clair" : "Passer au thème sombre"}
          >
            <span className="material-icons-round">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <button className="hub-notif" style={{ background: 'var(--color-primary-glass)', color: 'var(--color-primary)' }}>
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
