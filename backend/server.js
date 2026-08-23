const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initDB } = require('./db/db');
const clientsRouter = require('./routes/clients');
const dashboardRouter = require('./routes/dashboard');
const entriesRouter = require('./routes/entries');
const unbilledRouter = require('./routes/unbilled');
const reportsRouter = require('./routes/reports');
const fs = require('fs');
const uploadsDir = require('path').join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'TrackItRight backend is running' });
});

app.use('/clients', clientsRouter);
app.use('/dashboard', dashboardRouter);
app.use('/entries', entriesRouter);
app.use('/unbilled', unbilledRouter);
app.use('/reports', reportsRouter);

const PORT = process.env.PORT || 5000;

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});