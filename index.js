import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

import queryHandler from './api/query.js';
app.use('/test', (req, res) => {
  res.send('API is working');
});
// Register the POST handler directly for /api/query
app.post('/api/query', queryHandler);


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});