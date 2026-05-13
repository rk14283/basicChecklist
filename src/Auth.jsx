import React, { useState } from 'react';
import { supabase } from './utils/supabaseclient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const getURL = () => {
    // 1. Manually point to production to avoid Vercel's preview login screen
    // 2. Fallback to localhost for development
    let url = 'https://basic-checklist.vercel.app'; 
    
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      url = 'http://localhost:3000';
    }

    return url;
  };

  const handleAuth = async (type) => {
    setLoading(true);
    setMessage(''); // Clear old messages

    const { error } =
      type === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              // This sends the user to your clean production URL
              emailRedirectTo: `${getURL()}/confirmationpage`,
            },
          });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (type === 'signup') {
      setMessage("📩 Confirmation email sent! Check your inbox.");
    } else {
      setMessage("✅ Logged in successfully!");
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <h1>Focus OS</h1>

      {/* POPUP MESSAGE */}
      {message && <div className="popup" style={{ padding: '10px', marginBottom: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>{message}</div>}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="button-group" style={{ marginTop: '10px' }}>
        <button disabled={loading} onClick={() => handleAuth('login')}>
          {loading && type === 'login' ? 'Loading...' : 'Login'}
        </button>

        <button disabled={loading} onClick={() => handleAuth('signup')}>
          {loading && type === 'signup' ? 'Loading...' : 'Sign Up'}
        </button>
      </div>
    </div>
  );
}