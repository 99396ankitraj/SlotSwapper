import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Marketplace() {
  const { token } = useAuth();
  const [available, setAvailable] = useState([]);
  const [mySwappable, setMySwappable] = useState([]);
  const [offerFor, setOfferFor] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [other, mine] = await Promise.all([
        api('/swappable-slots', { token }),
        api('/events', { token })
      ]);
      setAvailable(other);
      setMySwappable(mine.filter(e => e.status === 'SWAPPABLE'));
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const sendRequest = async (mySlotId, theirSlotId) => {
    try {
      await api('/swap-request', { method: 'POST', token, body: { mySlotId, theirSlotId } });
      setOfferFor(null);
      await load();
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Marketplace</h2>
        {error && <div className="error">{error}</div>}
        <ul className="list">
          {available.map(slot => (
            <li key={slot._id} className="item">
              <h4>{slot.title}</h4>
              <div className="muted">{new Date(slot.startTime).toLocaleString()} - {new Date(slot.endTime).toLocaleString()}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                <button className="btn" onClick={()=>setOfferFor(slot)}>Request Swap</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {offerFor && (
        <div className="modal-mask" onClick={()=>setOfferFor(null)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            <h3>Offer one of your swappable slots</h3>
            {mySwappable.length === 0 && <div className="muted">You have no swappable slots. Mark one from Dashboard.</div>}
            <ul className="list">
              {mySwappable.map(m => (
                <li key={m._id} className="item">
                  <h4>{m.title}</h4>
                  <div className="muted">{new Date(m.startTime).toLocaleString()} - {new Date(m.endTime).toLocaleString()}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    <button className="btn" onClick={()=>sendRequest(m._id, offerFor._id)}>Offer this</button>
                  </div>
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn secondary" onClick={()=>setOfferFor(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
