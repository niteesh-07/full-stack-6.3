const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const User = require('./User');

const app = express();
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/bank', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// ----------------- ROUTES -----------------

// Create a new user
app.post('/users', async (req, res) => {
  try {
    const { name, balance } = req.body;
    const user = new User({ name, balance });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List all users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Transfer money between accounts
app.post('/transfer', async (req, res) => {
  try {
    const { fromUserId, toUserId, amount } = req.body;

    if (amount <= 0) return res.status(400).json({ error: 'Amount must be positive' });

    const fromUser = await User.findById(fromUserId);
    const toUser = await User.findById(toUserId);

    if (!fromUser) return res.status(404).json({ error: 'Sender not found' });
    if (!toUser) return res.status(404).json({ error: 'Receiver not found' });

    if (fromUser.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Sequential updates
    fromUser.balance -= amount;
    await fromUser.save();

    toUser.balance += amount;
    await toUser.save();

    res.json({
      message: 'Transfer successful',
      fromUser: { id: fromUser.id, balance: fromUser.balance },
      toUser: { id: toUser.id, balance: toUser.balance }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- START SERVER -----------------
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
