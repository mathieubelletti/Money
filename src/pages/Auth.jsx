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
        setSuccess("Compte créé avec succès ! Vérifiez vos emails si nécessaire.");
        // If email confirmation is off, Supabase might auto-login, 
        // but it's safer to let the user know or handle the session change.
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

  return (
    <div className="auth-container">
      <div className="auth-header">
        <button className="auth-back-btn" onClick={() => setIsSignUp(false)} style={{ visibility: isSignUp ? 'visible' : 'hidden' }}>
          <span className="material-icons-round">arrow_back</span>
        </button>
      </div>

      <h1 className="auth-title">
        {isSignUp ? 'Créer un compte' : 'Content de vous revoir'}
      </h1>
      <p className="auth-subtitle">
        {isSignUp 
          ? 'Rejoignez Money pour prendre le contrôle de vos finances dès aujourd\'hui.' 
          : 'Connectez-vous à votre compte Money en toute sécurité pour gérer vos finances.'}
      </p>

      <form className="auth-form" onSubmit={handleAuth}>
        <div className="auth-input-group">
          <label className="auth-label">Email</label>
          <div className="auth-input-container">
            <input
              type="email"
              className="auth-input"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="auth-input-group">
          <label className="auth-label">Mot de passe</label>
          <div className="auth-input-container">
            <input
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              placeholder="........"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span 
              className="material-icons-round auth-eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </div>
        </div>

        {!isSignUp && <a href="#" className="auth-forgot">Mot de passe oublié ?</a>}

        {error && (
          <p style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginTop: 12 }}>
            {error}
          </p>
        )}

        {success && (
          <p style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginTop: 12 }}>
            {success}
          </p>
        )}

        <button type="submit" className="auth-btn-primary" disabled={loading} style={{ marginTop: isSignUp ? 24 : 0 }}>
          {loading 
            ? (isSignUp ? 'Création...' : 'Connexion...') 
            : (isSignUp ? 'S\'inscrire' : 'Se connecter')}
        </button>
      </form>

      <div className="auth-divider">
        <div className="auth-divider-line"></div>
        <span className="auth-divider-text">OU</span>
        <div className="auth-divider-line"></div>
      </div>

      <button 
        className="auth-btn-google" 
        onClick={handleGoogleLogin}
        disabled={loading}
        type="button"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
        {loading ? 'Redirection...' : 'Continuer avec Google'}
      </button>

      <div className="auth-footer">
        <p className="auth-footer-text">
          {isSignUp ? 'Déjà un compte ?' : 'Nouveau sur Money ?'}{' '}
          <button 
            className="auth-footer-link" 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setSuccess(null);
            }}
            style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}
          >
            {isSignUp ? 'Se connecter' : 'Créer un compte'}
          </button>
        </p>
      </div>

      <div className="auth-secure">
        <span className="material-icons-round" style={{ fontSize: 14 }}>lock</span>
        CONNEXION SÉCURISÉE SSL
      </div>
    </div>
  );
};

export default Auth;
