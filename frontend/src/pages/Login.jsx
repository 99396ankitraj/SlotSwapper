import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setToken, setUser } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api('/auth/login', { method: 'POST', body: { email, password } });
      setToken(res.token); setUser(res.user);
      const to = loc.state?.from?.pathname || '/';
      nav(to, { replace: true });
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="card">
      <h2 className="title">Login</h2>
      <form onSubmit={submit} className="form">
        <div className="field">
          <input className="input" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>
        <div className="field">
          <input className="input" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        </div>
        {error && <div className="error">{error}</div>}
        <button className="btn" type="submit">Login</button>
      </form>
      <p className="muted">New here? <Link to="/signup">Create an account</Link></p>
    </div>
  );
}
