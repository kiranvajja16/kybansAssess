const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let slots = {};

function initSlots() {
  for (let d = 1; d <= 30; d++) {
    const date = `2026-04-${d.toString().padStart(2, '0')}`;
    slots[date] = Array(24).fill().map(() => ({ subSlots: 3, blocked: false }));
  }
}

initSlots();

app.get('/user/slots/:date', (req, res) => {
  const date = req.params.date;
  if (!slots[date]) return res.status(404).send('Date not found');
  const result = slots[date].map(s => s.subSlots > 0 && !s.blocked);
  res.json(result);
});

app.get('/admin/slots/:date', (req, res) => {
  const date = req.params.date;
  if (!slots[date]) return res.status(404).send('Date not found');
  res.json(slots[date]);
});

app.post('/book/:date/:slot', (req, res) => {
  const { date, slot } = req.params;
  const s = parseInt(slot);
  if (s < 0 || s > 23 || !slots[date]) return res.status(400).send('Invalid');
  const sl = slots[date][s];
  if (sl.blocked || sl.subSlots <= 0) return res.status(400).send('Not available');
  sl.subSlots--;
  res.send('Booked');
});

app.post('/admin/block/:date/:slot', (req, res) => {
  const { date, slot } = req.params;
  const s = parseInt(slot);
  if (s < 0 || s > 23 || !slots[date]) return res.status(400).send('Invalid');
  slots[date][s].blocked = !slots[date][s].blocked;
  res.send('Toggled');
});

app.listen(3000, () => console.log('Server running on 3000'));