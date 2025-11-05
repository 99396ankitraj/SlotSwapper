import express from 'express';
import Event, { EVENT_STATUS } from '../models/Event.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  const events = await Event.find({ userId: req.user.id }).sort({ startTime: 1 });
  res.json(events);
});

router.post('/', async (req, res) => {
  try {
    const { title, startTime, endTime, status } = req.body;
    const ev = await Event.create({ title, startTime, endTime, status: status || EVENT_STATUS.BUSY, userId: req.user.id });
    res.status(201).json(ev);
  } catch (e) {
    res.status(400).json({ message: 'Invalid payload' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const update = req.body;
  const ev = await Event.findOneAndUpdate({ _id: id, userId: req.user.id }, update, { new: true });
  if (!ev) return res.status(404).json({ message: 'Not found' });
  res.json(ev);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const ev = await Event.findOneAndDelete({ _id: id, userId: req.user.id });
  if (!ev) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true });
});

export default router;
