import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Requests() {
  const { token } = useAuth();
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { incoming, outgoing } = await api('/requests', { token });
      setIncoming(incoming); setOutgoing(outgoing);
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const respond = async (id, accept) => {
    try { await api(`/swap-response/${id}`, { method: 'POST', token, body: { accept } }); await load(); } catch (e) { setError(e.message); }
  };

  const Item = ({ req, actions }) => (
    <li className="item">
      <div><strong>{req.mySlot?.title}</strong> ⇄ <strong>{req.theirSlot?.title}</strong></div>
      <div className="status">Status: <span className="badge">{req.status}</span></div>
      {actions}
    </li>
  );

  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Requests</h2>
        {error && <div className="error">{error}</div>}

        <h3 className="title">Incoming</h3>
        <ul className="list">
          {incoming.map(r => (
            <Item key={r._id} req={r} actions={
              r.status === 'PENDING' ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn" onClick={()=>respond(r._id, true)}>Accept</button>
                  <button className="btn secondary" onClick={()=>respond(r._id, false)}>Reject</button>
                </div>
              ) : null
            } />
          ))}
        </ul>

        <h3 className="title">Outgoing</h3>
        <ul className="list">
          {outgoing.map(r => (
            <Item key={r._id} req={r} />
          ))}
        </ul>
      </div>
    </div>
  );
}
