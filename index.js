const express = require('express');
const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');
const dotenv = require('dotenv');

const app = express();
app.use(express.json());

dotenv.config();
const pipePath = process.env.PIPE_PATH || '/pipes/republish-pipe';
const port = process.env.PORT || 8000;
const secret = process.env.SECRET || '';

app.post(`/${secret}`, async (req, res) => {
  console.log("Webhook called");
  const callback_url = req.body.callback_url;
  res.status(202).send("Accepted").end();

  let success = true;
  try {
    const wstream = fs.createWriteStream(pipePath)
    await wstream.write('go\r\n');
    await wstream.close();
    console.log(`Republish request written to pipe ${pipePath}`);
  } catch (error) {
    console.error(`Error writing to pipe ${pipePath}`)
    console.error(error.message);
    success = false;
  }

  try {
    await axios.post(callback_url, { state: success ? 'success' : 'failure' });
    console.log(`Callback posted to ${callback_url}`);
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
