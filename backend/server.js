const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initDB } = require('./db/db');
const { requireAuth } = require('./middleware/auth');
const authRouter = require('./routes/auth');
const clientsRouter = require('./routes/clients');
const dashboardRouter = require('./routes/dashboard');
const entriesRouter = require('./routes/entries');
const unbilledRouter = require('./routes/unbilled');
const reportsRouter = require('./routes/reports');
const insightsRouter = require('./routes/insights');
const searchRouter = require('./routes/search');
const askRouter = require('./routes/ask');
const modelRouter = require('./routes/model');
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

app.use('/auth', authRouter);

app.use('/clients', requireAuth, clientsRouter);
app.use('/dashboard', requireAuth, dashboardRouter);
app.use('/entries', requireAuth, entriesRouter);
app.use('/unbilled', requireAuth, unbilledRouter);
app.use('/reports', requireAuth, reportsRouter);
app.use('/insights', requireAuth, insightsRouter);
app.use('/search', requireAuth, searchRouter);
app.use('/ask', requireAuth, askRouter);
app.use('/model', requireAuth, modelRouter);

const PORT = process.env.PORT || 5000;

initDB().then(() => {
  const { seedIfEmpty } = require('./db/seed');
  seedIfEmpty();

  const { ensureDemoAccountForOrphanedClients } = require('./db/ensureDemoAccount');
  ensureDemoAccountForOrphanedClients();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});