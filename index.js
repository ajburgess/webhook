const express = require('express');
const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const dotenv = require('dotenv');

const app = express();
app.use(express.json());

dotenv.config();
const pipePath = process.env.PIPE_PATH || '/pipes/republish-pipe';
const port = process.env.PORT || 8000;
const secret = process.env.SECRET || '';

app.post(`/${secret}`, async (req, res) => {
  const callback_url = req.body.callback_url;
  await fs.appendFile(pipePath, 'go');
  res.status(202).send("Accepted").end();

  try {
    await axios.post(callback_url, {
      state: 'success',
      description: 'Initiated redployment of latest docker hub images'
    });
  } catch (error) {
    console.error(`Error calling callback ${callback_url}`);
    console.error(error.message);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
});

function errorHandler (err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }
  res.status(err.status || 500);
  res.json({ error: err.message });
}

app.use(errorHandler);

app.listen(port, () => {
  console.log(`webhook listening on port ${port}...`);
});
