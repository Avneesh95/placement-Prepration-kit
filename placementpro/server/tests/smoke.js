// Live HTTP smoke test: binds to a local port, verifies API endpoints, cookie auth, database connectivity, and static frontend serving.
const http = require('http');
const mongoose = require('mongoose');
const { createApp } = require('../src/app');
const { connect } = require('../src/db');
const config = require('../src/config');
const { User, TestAttempt } = require('../src/models');

async function runSmokeTest() {
  console.log('--- Starting Live Deployment Smoke Test ---');
  await connect();
  console.log('1. Database connected successfully.');

  const app = createApp();
  const server = http.createServer(app);
  
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`2. Server listening on ${baseUrl}`);

  let cookie = '';

  // Test 1: Health check
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const healthData = await healthRes.json();
  if (healthRes.status !== 200 || !healthData.ok || healthData.db !== 'connected') {
    throw new Error(`Health check failed: ${JSON.stringify(healthData)}`);
  }
  console.log('3. Health check PASSED: ok=true, db=connected');

  // Test 2: Static frontend HTML served
  const htmlRes = await fetch(`${baseUrl}/`);
  const htmlText = await htmlRes.text();
  if (htmlRes.status !== 200 || !htmlText.includes('PlacementPro')) {
    throw new Error(`Frontend static serving failed: status ${htmlRes.status}`);
  }
  console.log('4. Frontend static index.html served PASSED.');

  // Test 3: Registration with cookie reception
  const uniqueEmail = `smoketest_${Date.now()}@example.com`;
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Smoke Test User',
      email: uniqueEmail,
      password: 'SmokePassword123',
      graduationYear: 2027
    })
  });
  const regData = await regRes.json();
  if (regRes.status !== 201 || !regData.user || regData.user.email !== uniqueEmail) {
    throw new Error(`Registration failed: status ${regRes.status}, ${JSON.stringify(regData)}`);
  }
  const rawCookie = regRes.headers.get('set-cookie');
  if (!rawCookie || !rawCookie.includes('pp_token=')) {
    throw new Error(`Auth cookie pp_token was not set in response: ${rawCookie}`);
  }
  cookie = rawCookie.split(';')[0];
  console.log('5. User registration & httpOnly session cookie PASSED.');

  // Test 4: Authenticated /me endpoint
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: cookie }
  });
  const meData = await meRes.json();
  if (meRes.status !== 200 || meData.user.email !== uniqueEmail) {
    throw new Error(`Authenticated /me failed: ${JSON.stringify(meData)}`);
  }
  console.log('6. Authenticated session validation PASSED.');

  // Test 5: Companies list
  const compRes = await fetch(`${baseUrl}/api/companies`, {
    headers: { Cookie: cookie }
  });
  const compData = await compRes.json();
  if (compRes.status !== 200 || !Array.isArray(compData.items) || compData.items.length < 10) {
    throw new Error(`Companies retrieval failed: ${JSON.stringify(compData)}`);
  }
  console.log(`7. Companies listing PASSED: ${compData.items.length} companies available.`);

  // Test 6: Mock tests list
  const mocksRes = await fetch(`${baseUrl}/api/mocks`, {
    headers: { Cookie: cookie }
  });
  const mocksData = await mocksRes.json();
  if (mocksRes.status !== 200 || !Array.isArray(mocksData.items) || mocksData.items.length < 20) {
    throw new Error(`Mock tests listing failed: ${JSON.stringify(mocksData)}`);
  }
  console.log(`8. Mock tests listing PASSED: ${mocksData.items.length} mocks available.`);

  // Test 7: Start TCS NQT mock test attempt
  const startRes = await fetch(`${baseUrl}/api/mocks/tcs-full-1/start`, {
    method: 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' }
  });
  const startData = await startRes.json();
  if (startRes.status !== 201 || !startData.attemptId) {
    throw new Error(`Starting mock attempt failed: ${JSON.stringify(startData)}`);
  }
  console.log(`9. TCS NQT Mock test start PASSED: attemptId=${startData.attemptId}`);

  // Test 8: Fetch attempt payload and ensure no answer leaks
  const attemptRes = await fetch(`${baseUrl}/api/attempts/${startData.attemptId}`, {
    headers: { Cookie: cookie }
  });
  const attemptData = await attemptRes.json();
  const rawAttempt = JSON.stringify(attemptData);
  if (rawAttempt.includes('"correct"') || rawAttempt.includes('"explanation"') || rawAttempt.includes('referenceSolutions')) {
    throw new Error('SECURITY ALERT: Answer keys or explanations leaked in running attempt payload!');
  }
  console.log('10. Running attempt payload security check PASSED (Zero answer leaks).');

  // Clean up smoke test user and attempts
  await TestAttempt.deleteMany({ user: regData.user._id });
  await User.deleteOne({ _id: regData.user._id });

  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  console.log('--- ALL SMOKE TESTS COMPLETED SUCCESSFULLY ---');
}

runSmokeTest().catch((err) => {
  console.error('Smoke test FAILED:', err);
  process.exit(1);
});
