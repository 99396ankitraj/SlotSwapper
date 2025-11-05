import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setToken, setUser } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api('/auth/signup', { method: 'POST', body: { name, email, password } });
      setToken(res.token); setUser(res.user);
      nav('/', { replace: true });
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="card">
      <h2 className="title">Sign up</h2>
      <form onSubmit={submit} className="form">
        <div className="field">
          <input className="input" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
        </div>
        <div className="field">
          <input className="input" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>
        <div className="field">
          <input className="input" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        </div>
        {error && <div className="error">{error}</div>}
        <button className="btn" type="submit">Create account</button>
      </form>
      <p className="muted">Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}
