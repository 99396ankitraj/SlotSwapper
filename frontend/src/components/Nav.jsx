import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Nav() {
  const { token, user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <nav className="navbar">
      <strong className="brand">SlotSwapper</strong>
      {token ? (
        <>
          <Link className="navlink" to="/">Dashboard</Link>
          <Link className="navlink" to="/marketplace">Marketplace</Link>
          <Link className="navlink" to="/requests">Requests</Link>
          <span className="navspacer" />
          <span className="muted">Hi, {user?.name}</span>
          <button className="btn secondary" onClick={() => { logout(); nav('/login'); }}>Logout</button>
        </>
      ) : (
        <>
          <Link className="navlink" to="/login">Login</Link>
          <Link className="navlink" to="/signup">Signup</Link>
        </>
      )}
    </nav>
  );
}
