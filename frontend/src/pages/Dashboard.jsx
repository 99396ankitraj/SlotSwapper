import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: '', startTime: '', endTime: '' });
  const [error, setError] = useState('');

  const load = async () => {
    try { const data = await api('/events', { token }); setEvents(data); } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api('/events', { method: 'POST', token, body: { ...form } });
      setForm({ title: '', startTime: '', endTime: '' });
      await load();
    } catch (e) { setError(e.message); }
  };

  const makeSwappable = async (id) => {
    try { await api(`/events/${id}`, { method: 'PUT', token, body: { status: 'SWAPPABLE' } }); await load(); } catch (e) { setError(e.message); }
  };

  const deleteEvent = async (id) => {
    try { await api(`/events/${id}`, { method: 'DELETE', token }); await load(); } catch (e) { setError(e.message); }
  };

  return (
    <div className="grid">
      <div className="card">
        <h2 className="title">Your Events</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={create} className="form">
          <div className="field">
            <input className="input" placeholder="Title" value={form.title} onChange={(e)=>setForm(f=>({ ...f, title: e.target.value}))} />
          </div>
          <div className="field">
            <label className="muted">Start Time</label>
            <input className="input" type="datetime-local" value={form.startTime} onChange={(e)=>setForm(f=>({ ...f, startTime: e.target.value}))} />
          </div>
          <div className="field">
            <label className="muted">End Time</label>
            <input className="input" type="datetime-local" value={form.endTime} onChange={(e)=>setForm(f=>({ ...f, endTime: e.target.value}))} />
          </div>
          <button className="btn" type="submit">Create</button>
        </form>
      </div>

      <div className="card">
        <h3 className="title">List</h3>
        <ul className="list">
          {events.map(ev => (
            <li key={ev._id} className="item">
              <h4>{ev.title}</h4>
              <div className="muted">{new Date(ev.startTime).toLocaleString()} - {new Date(ev.endTime).toLocaleString()}</div>
              <div className="status">Status: <span className="badge">{ev.status}</span></div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ev.status === 'BUSY' && <button className="btn ghost" onClick={()=>makeSwappable(ev._id)}>Make Swappable</button>}
                <button className="btn danger" onClick={()=>deleteEvent(ev._id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
