import React, { useState } from 'react';
import { supabase } from '../supabase';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showEmailAuth, setShowEmailAuth] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) setError(error.message);
      else {
        setSuccess("Compte créé avec succès ! Vérifiez vos emails.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  // Main Splash Screen
  if (!showEmailAuth && !isSignUp) {
    return (
      <div className="auth-v2-container">
        <div className="auth-v2-header">
          <h1 className="auth-v2-title">BIENVENUE<br />DANS MONEY</h1>
        </div>

        <div className="auth-v2-sparkle" style={{ position: 'absolute', top: '22%', right: '10%', opacity: 0.6 }}>
          <span className="material-icons-round" style={{ fontSize: 24, color: 'white' }}>auto_awesome</span>
        </div>
        <div className="auth-v2-sparkle" style={{ position: 'absolute', bottom: '20%', left: '15%', opacity: 0.5 }}>
          <span className="material-icons-round" style={{ fontSize: 20, color: 'white' }}>auto_awesome</span>
        </div>
        <div className="auth-v2-sparkle" style={{ position: 'absolute', bottom: '5%', right: '5%', opacity: 0.8 }}>
          <span className="material-icons-round" style={{ fontSize: 32, color: 'white' }}>star</span>
        </div>

        <div className="auth-v2-content">
          <p className="auth-v2-subtitle">
            Gérez votre argent, investissez dans votre avenir. Tout en un seul endroit.
          </p>

          <button className="auth-v2-btn-google" onClick={handleGoogleLogin} disabled={loading}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" />
            {loading ? 'Redirection...' : 'CONNECTER AVEC GOOGLE'}
          </button>

          <div className="auth-v2-links">
            <button className="auth-v2-link" onClick={() => setShowEmailAuth(true)}>
              Se connecter avec e-mail
            </button>
            <button className="auth-v2-link" onClick={() => setIsSignUp(true)}>
              Créer un compte
            </button>
          </div>
        </div>

        <div className="auth-v2-footer">
          <span>Confidentialité</span>
          <span>•</span>
          <span>Conditions d'Utilisation</span>
          <span>•</span>
          <span>Aide/Appareils</span>
        </div>
      </div>
    );
  }

  // Email Auth / Sign Up Screen (Styled to match V2 but with form)
  return (
    <div className="auth-v2-container">
      <button className="auth-back-btn" onClick={() => { setIsSignUp(false); setShowEmailAuth(false); setError(null); }} style={{ position: 'absolute', top: 32, left: 24, zIndex: 10, color: 'white' }}>
        <span className="material-icons-round">arrow_back</span>
      </button>

      <div className="auth-v2-content" style={{ marginTop: -40 }}>
        <img src="/logo_premium.png" alt="Logo" className="auth-v2-logo-img" style={{ width: 60, height: 60, marginBottom: 24 }} />
        
        <h2 style={{ color: 'white', marginBottom: 8, fontSize: 24, fontWeight: 800 }}>
          {isSignUp ? 'CRÉER UN COMPTE' : 'CONNEXION E-MAIL'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 13 }}>
          {isSignUp ? 'Rejoignez Money aujourd\'hui.' : 'Entrez vos identifiants pour continuer.'}
        </p>

        <form onSubmit={handleAuth} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700, marginBottom: 8, display: 'block' }}>EMAIL</label>
            <input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }}
            />
          </div>

          <div style={{ textAlign: 'left', position: 'relative' }}>
            <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700, marginBottom: 8, display: 'block' }}>MOT DE PASSE</label>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="........"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }}
            />
            <span 
              className="material-icons-round" 
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 16, bottom: 14, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 20 }}
            >
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{error}</p>}
          {success && <p style={{ color: '#10b981', fontSize: 12, marginTop: 8 }}>{success}</p>}

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: 16, borderRadius: 30, border: 'none', background: 'white', color: '#102e2a', fontWeight: 800, fontSize: 14, cursor: 'pointer', marginTop: 16, textTransform: 'uppercase' }}
          >
            {loading ? 'CHARGEMENT...' : (isSignUp ? 'S\'INSCRIRE' : 'SE CONNECTER')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
