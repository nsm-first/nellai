const Razorpay = require('razorpay');
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
  key_id: 'rzp_live_5SW7TjdeeGzqoU',
  key_secret: 'MafoLpyJ9iJdqaKKKDf7HLkZ'
});

app.post('/create-order', async (req, res) => {
  const { amount, currency = 'INR', receipt } = req.body;
  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // amount in paise
      currency,
      receipt,
      payment_capture: 1
    });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5001, () => console.log('Server running on port 5001'));