import express from 'express';
import Event, { EVENT_STATUS } from '../models/Event.js';
import SwapRequest, { SWAP_STATUS } from '../models/SwapRequest.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

// GET /api/swappable-slots
router.get('/swappable-slots', async (req, res) => {
  const slots = await Event.find({ userId: { $ne: req.user.id }, status: EVENT_STATUS.SWAPPABLE }).sort({ startTime: 1 });
  res.json(slots);
});

// POST /api/swap-request
router.post('/swap-request', async (req, res) => {
  try {
    const { mySlotId, theirSlotId } = req.body;
    if (!mySlotId || !theirSlotId) return res.status(400).json({ message: 'mySlotId and theirSlotId required' });

    const mySlot = await Event.findOne({ _id: mySlotId, userId: req.user.id });
    const theirSlot = await Event.findOne({ _id: theirSlotId });

    if (!mySlot || !theirSlot) return res.status(404).json({ message: 'Slot not found' });
    if (String(theirSlot.userId) === String(req.user.id)) return res.status(400).json({ message: 'Cannot request your own slot' });

    if (mySlot.status !== EVENT_STATUS.SWAPPABLE || theirSlot.status !== EVENT_STATUS.SWAPPABLE) {
      return res.status(400).json({ message: 'Both slots must be SWAPPABLE' });
    }

    // Lock both slots if still SWAPPABLE
    const res1 = await Event.updateOne(
      { _id: mySlot._id, status: EVENT_STATUS.SWAPPABLE },
      { $set: { status: EVENT_STATUS.SWAP_PENDING } }
    );
    const res2 = await Event.updateOne(
      { _id: theirSlot._id, status: EVENT_STATUS.SWAPPABLE },
      { $set: { status: EVENT_STATUS.SWAP_PENDING } }
    );

    if (res1.modifiedCount !== 1 || res2.modifiedCount !== 1) {
      // rollback partial locks
      if (res1.modifiedCount === 1) await Event.updateOne({ _id: mySlot._id }, { $set: { status: EVENT_STATUS.SWAPPABLE } });
      if (res2.modifiedCount === 1) await Event.updateOne({ _id: theirSlot._id }, { $set: { status: EVENT_STATUS.SWAPPABLE } });
      return res.status(409).json({ message: 'Slots no longer swappable' });
    }

    const swap = await SwapRequest.create({
      requesterId: req.user.id,
      responderId: theirSlot.userId,
      mySlot: mySlot._id,
      theirSlot: theirSlot._id,
      status: SWAP_STATUS.PENDING
    });

    res.status(201).json(swap);
  } catch (e) {
    res.status(400).json({ message: 'Failed to create swap request' });
  }
});

// POST /api/swap-response/:requestId
router.post('/swap-response/:requestId', async (req, res) => {
  const { requestId } = req.params;
  const { accept } = req.body;

  const swap = await SwapRequest.findById(requestId);
  if (!swap) return res.status(404).json({ message: 'Request not found' });
  if (String(swap.responderId) !== String(req.user.id)) return res.status(403).json({ message: 'Not authorized to respond to this request' });
  if (swap.status !== SWAP_STATUS.PENDING) return res.status(400).json({ message: 'Already handled' });

  const mySlot = await Event.findById(swap.mySlot);
  const theirSlot = await Event.findById(swap.theirSlot);
  if (!mySlot || !theirSlot) return res.status(404).json({ message: 'Slot not found' });

  if (!accept) {
    await SwapRequest.updateOne({ _id: requestId }, { $set: { status: SWAP_STATUS.REJECTED } });
    await Event.updateOne({ _id: mySlot._id }, { $set: { status: EVENT_STATUS.SWAPPABLE } });
    await Event.updateOne({ _id: theirSlot._id }, { $set: { status: EVENT_STATUS.SWAPPABLE } });
    return res.json({ ok: true, status: SWAP_STATUS.REJECTED });
  }

  // Attempt owner swap with conditional state checks
  const aOwner = mySlot.userId;
  const bOwner = theirSlot.userId;

  const u1 = await Event.updateOne(
    { _id: mySlot._id, status: EVENT_STATUS.SWAP_PENDING },
    { $set: { userId: bOwner, status: EVENT_STATUS.BUSY } }
  );
  const u2 = await Event.updateOne(
    { _id: theirSlot._id, status: EVENT_STATUS.SWAP_PENDING },
    { $set: { userId: aOwner, status: EVENT_STATUS.BUSY } }
  );

  if (u1.modifiedCount !== 1 || u2.modifiedCount !== 1) {
    await SwapRequest.updateOne({ _id: requestId }, { $set: { status: SWAP_STATUS.REJECTED } });
    await Event.updateOne({ _id: mySlot._id }, { $set: { status: EVENT_STATUS.SWAPPABLE } });
    await Event.updateOne({ _id: theirSlot._id }, { $set: { status: EVENT_STATUS.SWAPPABLE } });
    return res.status(409).json({ message: 'Swap failed due to state change' });
  }

  await SwapRequest.updateOne({ _id: requestId }, { $set: { status: SWAP_STATUS.ACCEPTED } });
  return res.json({ ok: true, status: SWAP_STATUS.ACCEPTED });
});

// Extra: requests views
router.get('/requests', async (req, res) => {
  const incoming = await SwapRequest.find({ responderId: req.user.id }).sort({ createdAt: -1 }).populate('mySlot theirSlot');
  const outgoing = await SwapRequest.find({ requesterId: req.user.id }).sort({ createdAt: -1 }).populate('mySlot theirSlot');
  res.json({ incoming, outgoing });
});

export default router;
