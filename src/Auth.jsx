import React, { useState } from 'react';
import { supabase } from './utils/supabaseclient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const getURL = () => {
    let url = 'https://basic-checklist.vercel.app'; 
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      url = 'http://localhost:3000';
    }
    return url;
  };

  const handleAuth = async (authType) => {
    setLoading(true);
    setMessage('');

    const { error } =
      authType === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo:  getURL(),
            },
          });

    if (error) {
      // If you see "Email rate limit exceeded", this is the 429 error.
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (authType === 'signup') {
      setMessage("📩 Confirmation email sent! Check your inbox.");
    } else {
      setMessage("✅ Logged in successfully!");
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <h1>Focus OS</h1>

      {message && (
        <div className="popup" style={{ padding: '10px', marginBottom: '10px', backgroundColor: '#fdf2f2', border: '1px solid #f8b4b4', borderRadius: '5px', color: '#9b1c1c' }}>
          {message}
        </div>
      )}

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
          Login
        </button>

        <button disabled={loading} onClick={() => handleAuth('signup')}>
          Sign Up
        </button>
      </div>
    </div>
  );
}