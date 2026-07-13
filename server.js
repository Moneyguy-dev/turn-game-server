const express = require('express');
const app = express();
app.use(express.json());

app.post('/submitMove', (req, res) => {
  res.json({ status: 'ok', message: 'Move stored' });
});

app.get('/gameState', (req, res) => {
  res.json({ boardState: {}, currentTurnPlayer: 'A' });
});

app.listen(process.env.PORT || 3000);
