import React, { useState } from 'react';
import { supabase } from './utils/supabaseclient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async (type) => {
    setLoading(true);
    const { error } = type === 'login' 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <h1>Focus OS</h1>
      <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      
      <button disabled={loading} onClick={() => handleAuth('login')}>Login</button>
      <button disabled={loading} onClick={() => handleAuth('signup')}>Sign Up</button>
    </div>
  );
}