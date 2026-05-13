import React, { useState } from 'react';
import { supabase } from './utils/supabaseclient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleAuth = async (type) => {
    setLoading(true);

    const { error } =
      type === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
           email,
           password,
           options: {
            emailRedirectTo:
            'https://basic-checklist-3g3ouo0rp-rohankale67s-projects.vercel.app/confirmationpage',
  },
});

    if (error) {
      setMessage(error.message); // optional: show error in popup too
      setLoading(false);
      return;
    }

    if (type === 'signup') {
      setMessage("📩 Confirmation email sent! Check your inbox.");
    }

    if (type === 'login') {
      setMessage("✅ Logged in successfully!");
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <h1>Focus OS</h1>

      {/* POPUP MESSAGE */}
      {message && <div className="popup">{message}</div>}

      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button disabled={loading} onClick={() => handleAuth('login')}>
        Login
      </button>

      <button disabled={loading} onClick={() => handleAuth('signup')}>
        Sign Up
      </button>
    </div>
  );
}