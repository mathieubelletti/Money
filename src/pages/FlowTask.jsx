import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';

const FlowTask = ({ onBack }) => {
  const { session, usingSupabase } = useData();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', sub: '', type: 'urgent' });

  // 1. Fetch tasks from Supabase on mount/auth-change
  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    const fetchTasks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('flow_tasks')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTasks(data);
      }
      setLoading(false);
    };

    fetchTasks();
  }, [session?.user?.id]);

  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const updatedTask = { ...task, done: !task.done };
    setTasks(tasks.map(t => t.id === id ? updatedTask : t));

    if (usingSupabase) {
      await supabase.from('flow_tasks').upsert([updatedTask]);
    }
  };

  const deleteTask = async (id) => {
    setTasks(tasks.filter(t => t.id !== id));
    if (usingSupabase) {
      await supabase.from('flow_tasks').delete().eq('id', id);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim() || !session?.user?.id) return;
    
    const task = {
      id: `task_${Date.now()}`,
      ...newTask,
      user_id: session.user.id,
      done: false,
      created_at: new Date().toISOString()
    };
    
    setTasks([task, ...tasks]);
    setNewTask({ title: '', sub: '', type: 'urgent' });
    setShowModal(false);

    if (usingSupabase) {
      await supabase.from('flow_tasks').insert([task]);
    }
  };

  const Quadrant = ({ title, icon, label, type, children }) => {
    const config = {
      urgent: { border: 'var(--color-danger)', bg: 'var(--color-danger-light)', text: 'var(--color-danger)', label: 'URGENT' },
      plan: { border: 'var(--color-primary)', bg: 'var(--color-primary-bg)', text: 'var(--color-primary)', label: 'STRATÉGIQUE' },
      delegate: { border: 'var(--color-info)', bg: 'var(--color-info-light)', text: 'var(--color-info)', label: 'COLLABORATIF' },
      eliminate: { border: 'var(--color-text-tertiary)', bg: 'var(--color-bg)', text: 'var(--color-text-secondary)', label: 'PRIORITÉ BASSE' }
    }[type];

    return (
      <div className="ft-quadrant" style={{ borderLeft: `6px solid ${config.border}` }}>
        <div className="ft-quadrant-header">
          <div className="ft-quadrant-title-group">
            <span className="material-icons-round" style={{ color: config.text }}>{icon}</span>
            <h3>{title}</h3>
          </div>
          <span className="ft-label" style={{ backgroundColor: config.bg, color: config.text }}>
            {config.label}
          </span>
        </div>
        <div className="ft-quadrant-content">
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="ft-container">
      <style>{`
        .ft-container {
          min-height: 100vh;
          background-color: var(--color-bg);
          font-family: var(--font-family);
          padding-bottom: 120px;
          color: var(--color-text-primary);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .ft-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          z-index: 100;
          border-bottom: 1px solid var(--color-border-light);
        }

        .ft-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #ffe4e6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fb7185;
        }

        .ft-logo {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .ft-bell {
          color: var(--color-primary);
          background: none;
          border: none;
          cursor: pointer;
          position: relative;
        }

        .ft-dot {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 8px;
          height: 8px;
          background: var(--color-danger);
          border-radius: 50%;
          border: 2px solid white;
        }

        .ft-main {
          padding: 94px 20px 20px;
          max-width: 500px;
          margin: 0 auto;
        }

        .ft-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        @media (min-width: 768px) {
          .ft-main {
            max-width: 800px;
            padding: 94px 40px 40px;
          }
        }

        .ft-page-title {
          font-size: 32px;
          font-weight: 900;
          margin-bottom: 4px;
        }

        .ft-page-subtitle {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-tertiary);
          font-style: italic;
          margin-bottom: 32px;
        }

        .ft-quadrant {
          background: var(--color-surface);
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .ft-quadrant-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .ft-quadrant-title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ft-quadrant-title-group h3 {
          font-size: 17px;
          font-weight: 900;
          margin: 0;
        }

        .ft-label {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.05em;
        }

        .ft-task-item {
          background: var(--color-bg);
          border-radius: 18px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
        }

        .ft-checkbox {
          width: 24px;
          height: 24px;
          border-radius: 8px;
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ft-checkbox.checked {
          color: white;
        }

        .ft-task-info h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 900;
        }

        .ft-task-info p {
          margin: 2px 0 0;
          font-size: 11px;
          font-weight: 700;
          color: var(--color-text-tertiary);
          font-style: italic;
        }

        .ft-collab-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ft-collab-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--color-text-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          border: 2px solid white;
        }

        .ft-collab-status {
          font-size: 11px;
          font-weight: 700;
          color: var(--color-text-tertiary);
          font-style: italic;
          text-align: right;
          max-width: 60px;
          line-height: 1.2;
        }

        .ft-eliminate-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid var(--color-border-light);
        }

        .ft-eliminate-item:last-child {
          border-bottom: none;
        }

        .ft-fab {
          position: fixed;
          bottom: 100px;
          right: 24px;
          width: 64px;
          height: 64px;
          background: var(--color-primary);
          color: white;
          border-radius: 50%;
          border: none;
          box-shadow: 0 8px 24px rgba(24, 82, 74, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 101;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .ft-fab:active {
          transform: scale(0.9);
        }

        .ft-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          z-index: 200;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          backdrop-filter: blur(4px);
        }

        .ft-modal-content {
          width: 100%;
          max-width: 500px;
          background: var(--color-surface);
          border-radius: 32px 32px 0 0;
          padding: 32px 24px;
          animation: slide-up 0.3s ease-out;
        }

        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .ft-modal-title {
          font-size: 24px;
          font-weight: 900;
          margin-bottom: 24px;
        }

        .ft-form-group {
          margin-bottom: 20px;
        }

        .ft-form-label {
          display: block;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-tertiary);
          margin-bottom: 8px;
        }

        .ft-input {
          width: 100%;
          padding: 16px;
          background: var(--color-bg);
          border: 1px solid var(--color-border-light);
          border-radius: 16px;
          font-family: inherit;
          font-size: 15px;
          font-weight: 700;
          outline: none;
        }

        .ft-input:focus {
          border-color: var(--color-primary);
        }

        .ft-type-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .ft-type-btn {
          padding: 12px;
          border-radius: 16px;
          border: 2px solid var(--color-border-light);
          background: var(--color-surface);
          cursor: pointer;
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .ft-type-btn.active.urgent { border-color: var(--color-danger); background: var(--color-danger-light); color: var(--color-danger); }
        .ft-type-btn.active.plan { border-color: var(--color-primary); background: var(--color-primary-bg); color: var(--color-primary); }
        .ft-type-btn.active.delegate { border-color: var(--color-info); background: var(--color-info-light); color: var(--color-info); }
        .ft-type-btn.active.eliminate { border-color: var(--color-text-tertiary); background: var(--color-surface-alt); color: var(--color-text-primary); }

        .ft-submit-btn {
          width: 100%;
          padding: 18px;
          background: var(--color-primary);
          color: white;
          border-radius: 18px;
          border: none;
          font-weight: 900;
          font-size: 16px;
          margin-top: 12px;
          cursor: pointer;
        }

        .ft-empty {
          text-align: center;
          padding: 40px 20px;
          color: var(--color-text-tertiary);
        }

        .ft-empty span {
          display: block;
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .ft-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 80px;
          background: var(--color-surface);
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 0 20px;
          border-top: 1px solid var(--color-border-light);
          z-index: 102;
        }

        .ft-nav-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: var(--color-text-tertiary);
          cursor: pointer;
        }

        .ft-nav-btn.active {
          color: var(--color-primary);
          background: var(--color-primary-bg);
          padding: 8px 16px;
          border-radius: 16px;
        }

        .ft-nav-btn span:last-child {
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.05em;
        }
      `}</style>

      {/* Header */}
      <PageHeader title="FlowTask" onBack={onBack} />

      {/* Main Content */}
      <main className="ft-main">
        <h2 className="ft-page-title">Ma Journée</h2>
        <p className="ft-page-subtitle">Focus stratégique pour les objectifs d'aujourd'hui</p>

        {loading ? (
          <div className="ft-empty" style={{ paddingTop: 100 }}>
             <span className="material-icons-round" style={{ animation: 'spin 1s linear infinite' }}>sync</span>
             <p>Chargement de vos tâches...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="ft-empty">
            <span className="material-icons-round">list_alt</span>
            <p>Aucune tâche pour le moment.<br/>Cliquez sur + pour commencer !</p>
          </div>
        ) : (
          <div className="ft-grid">
            {/* 1. URGENT */}
            <Quadrant title="À faire en priorité" icon="priority_high" label="URGENT" type="urgent">
              {tasks.filter(t => t.type === 'urgent').map(t => (
                <div key={t.id} className="ft-task-item">
                  <div 
                    className={`ft-checkbox ${t.done ? 'checked' : ''}`}
                    style={{ borderColor: 'var(--color-danger)', backgroundColor: t.done ? 'var(--color-danger)' : 'white' }}
                    onClick={() => toggleTask(t.id)}
                  >
                    {t.done && <span className="material-icons-round" style={{ fontSize: 16 }}>done</span>}
                  </div>
                  <div className="ft-task-info">
                    <h4 style={{ textDecoration: t.done ? 'line-through' : 'none', color: t.done ? 'var(--color-text-tertiary)' : 'inherit' }}>{t.title}</h4>
                    <p>{t.sub}</p>
                  </div>
                </div>
              ))}
            </Quadrant>

            {/* 2. PLANIFIER */}
            <Quadrant title="Planifier" icon="calendar_today" label="STRATÉGIQUE" type="plan">
              {tasks.filter(t => t.type === 'plan').map(t => (
                <div key={t.id} className="ft-task-item" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div 
                      className={`ft-checkbox ${t.done ? 'checked' : ''}`}
                      style={{ borderColor: 'var(--color-primary)', backgroundColor: t.done ? 'var(--color-primary)' : 'white' }}
                      onClick={() => toggleTask(t.id)}
                    >
                      {t.done && <span className="material-icons-round" style={{ fontSize: 16 }}>done</span>}
                    </div>
                    <div className="ft-task-info">
                      <h4 style={{ textDecoration: t.done ? 'line-through' : 'none', color: t.done ? 'var(--color-text-tertiary)' : 'inherit' }}>{t.title}</h4>
                      <p>{t.sub}</p>
                    </div>
                  </div>
                  <span className="material-icons-round" style={{ color: 'var(--color-text-tertiary)', cursor: 'pointer' }}>more_vert</span>
                </div>
              ))}
            </Quadrant>

            {/* 3. DÉLÉGUER */}
            <Quadrant title="Déléguer" icon="group_add" label="COLLABORATIF" type="delegate">
              {tasks.filter(t => t.type === 'delegate').map(t => (
                <div key={t.id} className="ft-task-item ft-collab-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="ft-collab-avatar">
                      <span className="material-icons-round" style={{ fontSize: 16 }}>person</span>
                    </div>
                    <div className="ft-task-info">
                      <h4>{t.title}</h4>
                      <p style={{ color: 'var(--color-info)', fontStyle: 'normal' }}>ASSIGNE À : {t.sub?.toUpperCase() || 'EQUIPE'}</p>
                    </div>
                  </div>
                  <p className="ft-collab-status">{t.statusText || 'En cours'}</p>
                </div>
              ))}
            </Quadrant>

            {/* 4. ÉLIMINER */}
            <Quadrant title="Éliminer" icon="delete_sweep" label="PRIORITÉ BASSE" type="eliminate">
              {tasks.filter(t => t.type === 'eliminate').map(t => (
                <div key={t.id} className="ft-eliminate-item">
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-tertiary)', textDecoration: 'line-through', fontStyle: 'italic' }}>{t.title}</span>
                  <span className="material-icons-round" style={{ fontSize: 18, color: 'var(--color-text-tertiary)', cursor: 'pointer' }} onClick={() => deleteTask(t.id)}>close</span>
                </div>
              ))}
            </Quadrant>
          </div>
        )}
      </main>

      {/* FAB */}
      <button className="ft-fab" onClick={() => setShowModal(true)}>
        <span className="material-icons-round" style={{ fontSize: 32 }}>add</span>
      </button>

      {/* Modal / Formulaire */}
      {showModal && (
        <div className="ft-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ft-modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="ft-modal-title">Nouvelle Tâche</h3>
            
            <form onSubmit={handleAddTask}>
              <div className="ft-form-group">
                <label className="ft-form-label">Titre de la tâche</label>
                <input 
                  type="text" 
                  className="ft-input" 
                  placeholder="Ex: Réviser le contrat"
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  autoFocus
                />
              </div>

              <div className="ft-form-group">
                <label className="ft-form-label">Détails (Optionnel)</label>
                <input 
                  type="text" 
                  className="ft-input" 
                  placeholder="Ex: Priorité haute, assigné à..."
                  value={newTask.sub}
                  onChange={e => setNewTask({...newTask, sub: e.target.value})}
                />
              </div>

              <div className="ft-form-group">
                <label className="ft-form-label">Classification Eisenhower</label>
                <div className="ft-type-selector">
                  <button 
                    type="button"
                    className={`ft-type-btn ${newTask.type === 'urgent' ? 'active urgent' : ''}`}
                    onClick={() => setNewTask({...newTask, type: 'urgent'})}
                  >
                    <span className="material-icons-round" style={{ fontSize: 16 }}>priority_high</span>
                    URGENT
                  </button>
                  <button 
                    type="button"
                    className={`ft-type-btn ${newTask.type === 'plan' ? 'active plan' : ''}`}
                    onClick={() => setNewTask({...newTask, type: 'plan'})}
                  >
                    <span className="material-icons-round" style={{ fontSize: 16 }}>calendar_today</span>
                    PLANIFIER
                  </button>
                  <button 
                    type="button"
                    className={`ft-type-btn ${newTask.type === 'delegate' ? 'active delegate' : ''}`}
                    onClick={() => setNewTask({...newTask, type: 'delegate'})}
                  >
                    <span className="material-icons-round" style={{ fontSize: 16 }}>group_add</span>
                    DÉLÉGUER
                  </button>
                  <button 
                    type="button"
                    className={`ft-type-btn ${newTask.type === 'eliminate' ? 'active eliminate' : ''}`}
                    onClick={() => setNewTask({...newTask, type: 'eliminate'})}
                  >
                    <span className="material-icons-round" style={{ fontSize: 16 }}>delete_sweep</span>
                    ÉLIMINER
                  </button>
                </div>
              </div>

              <button type="submit" className="ft-submit-btn">
                Ajouter la tâche
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="ft-nav">
        <button className="ft-nav-btn" onClick={onBack}>
          <span className="material-icons-round">home</span>
          <span>ACCUEIL</span>
        </button>
        <button className="ft-nav-btn active">
          <span className="material-icons-round">folder</span>
          <span>PROJETS</span>
        </button>
        <button className="ft-nav-btn">
          <span className="material-icons-round">group</span>
          <span>ÉQUIPE</span>
        </button>
        <button className="ft-nav-btn">
          <span className="material-icons-round">settings</span>
          <span>PARAMÈTRES</span>
        </button>
      </nav>
    </div>
  );
};

export default FlowTask;
