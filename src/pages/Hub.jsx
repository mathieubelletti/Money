import { supabase } from '../supabase';

const Hub = ({ onEnterBudget }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  const apps = [
    {
      id: 'budget',
      name: 'Budget',
      desc: 'Gérez vos finances personnelles',
      icon: 'insights',
      color: '#22c55e',
      bg: 'rgba(34, 197, 94, 0.12)',
      onClick: onEnterBudget
    },
    {
      id: 'commun',
      name: 'Commun',
      desc: 'Dépenses partagées à deux',
      icon: 'groups',
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.12)',
    },
    {
      id: 'tasks',
      name: 'Tasks',
      desc: 'Gestion de projets complexes',
      icon: 'assignment',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
    },
    {
      id: 'todolist',
      name: 'Todolist',
      desc: 'Simple check-list quotidienne',
      icon: 'done_all',
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.12)',
    }
  ];

  return (
    <div className="hub-container">
      <header className="hub-header">
        <div className="hub-user">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Marc" 
            alt="User" 
            className="hub-avatar" 
          />
          <div className="hub-greeting">
            <span className="hub-app-title">Linxo Lab Hub</span>
            <span className="hub-user-name">Bonjour, Marc</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="hub-notif">
            <span className="material-icons-round">notifications</span>
          </button>
          <button 
            onClick={handleLogout}
            style={{ 
              width: 40, height: 40, borderRadius: '50%', background: 'var(--color-danger-light)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger)',
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
          <p className="hub-subtitle">Gérez votre quotidien avec la suite Linxo Lab</p>
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
            Consultez notre guide d'utilisation ou contactez le support Linxo Lab.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Hub;
