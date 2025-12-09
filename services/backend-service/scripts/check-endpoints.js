const axios = require('axios');

async function run() {
  const base = process.env.BASE_URL || 'http://localhost:3000';
  try {
    console.log('Checking /health');
    await axios.get(`${base}/health`, { timeout: 2000 });
    console.log('Checking /api/hello');
    await axios.get(`${base}/api/hello`, { timeout: 2000 });
    console.log('Checking /predict');
    const resp = await axios.post(`${base}/predict`, { test: true }, { timeout: 5000 });
    if (!resp.data) throw new Error('predict returned no data');
    console.log('predict OK', resp.data);
    console.log('All checks passed');
    process.exit(0);
  } catch (err) {
    console.error('Check failed', err.message || err);
    process.exit(2);
  }
}

run();
