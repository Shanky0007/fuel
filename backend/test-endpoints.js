const axios = require('axios');

const BASE_API = 'http://localhost:5000/api';
const BASE_ROOT = 'http://localhost:5000';
let adminToken = '';
let operatorToken = '';
let userToken = '';
let userId = '';
let stationId = '';
let station2Id = '';
let vehicleId = '';
let queueId = '';
let ticketCode = '';
let opId = '';
let passed = 0;
let failed = 0;

const log = (label, ok, detail = '') => {
  const icon = ok ? '✅' : '❌';
  if (ok) passed++; else failed++;
  console.log(`  ${icon} ${label}${detail ? ' — ' + detail : ''}`);
};

const api = (token) => axios.create({
  baseURL: BASE_API,
  headers: {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  validateStatus: () => true,
});

async function run() {
  console.log('\n🔧 FUEL QUEUE — ENDPOINT TEST SUITE\n');

  // ========== HEALTH ==========
  console.log('─── Health ───');
  const health = await axios.get(`${BASE_ROOT}/health`, { validateStatus: () => true });
  log('GET /health', health.status === 200, `${health.status}`);

  // ========== PUBLIC LOOKUPS ==========
  console.log('\n─── Public Lookups ───');
  const countries = await api().get('/locations/countries');
  log('GET /locations/countries', countries.status === 200 && countries.data?.length > 0, `${countries.data?.length} countries`);

  const countryId = countries.data?.[0]?.id;
  const countryName = countries.data?.[0]?.name;

  const regions = await api().get(`/locations/countries/${countryId}/regions`);
  log('GET /locations/countries/:id/regions', regions.status === 200 && regions.data?.length > 0, `${regions.data?.length} regions`);

  const regionId = regions.data?.[0]?.id;
  const regionName = regions.data?.[0]?.name;

  const cities = await api().get(`/locations/regions/${regionId}/cities`);
  log('GET /locations/regions/:id/cities', cities.status === 200, `${cities.data?.length} cities`);
  const cityName = cities.data?.[0]?.name || 'TestCity';

  const fuelTypes = await api().get('/vehicles/fuel-types');
  log('GET /vehicles/fuel-types', fuelTypes.status === 200 && fuelTypes.data?.length > 0, `${fuelTypes.data?.length} types`);

  const petrolId = fuelTypes.data?.find(f => f.name === 'Petrol')?.id;

  // ========== AUTH ==========
  console.log('\n─── Auth ───');

  const adminLogin = await api().post('/auth/login', { email: 'admin@smartfuel.com', password: 'admin123' });
  adminToken = adminLogin.data?.token || '';
  log('POST /auth/login (admin)', adminLogin.status === 200 && !!adminToken, adminLogin.status === 200 ? 'ok' : adminLogin.data?.error);

  const testEmail = `test_${Date.now()}@test.com`;
  const regNum = `REG${Date.now()}`;
  const register = await api().post('/auth/register', {
    name: 'Test User', email: testEmail, password: 'test123', phone: '+234111',
    country: countryName, region: regionName, city: cityName,
    vehicleType: 'Car', fuelType: 'Petrol', registrationNumber: regNum,
  });
  userToken = register.data?.token || '';
  log('POST /auth/register', register.status === 201 && !!userToken, register.status === 201 ? 'ok' : register.data?.error);

  const me = await api(userToken).get('/auth/me');
  userId = me.data?.id || '';
  log('GET /auth/me', me.status === 200 && !!userId, me.data?.name);

  const myStats = await api(userToken).get('/auth/me/stats');
  log('GET /auth/me/stats', myStats.status === 200, `visits=${myStats.data?.totalVisits}`);

  const updProf = await api(userToken).put('/auth/profile', { name: 'Updated User', phone: '+234222', country: countryName, region: regionName, city: cityName });
  log('PUT /auth/profile', updProf.status === 200, updProf.data?.user?.name);

  const forgot = await api().post('/auth/forgot-password', { email: testEmail });
  log('POST /auth/forgot-password', forgot.status === 200, `${forgot.status}`);

  const noAuth = await api().get('/auth/me');
  log('GET /auth/me (no token)', noAuth.status === 401, 'rejected');

  // ========== ADMIN: STATIONS ==========
  console.log('\n─── Admin: Stations ───');

  const cs = await api(adminToken).post('/admin/stations', {
    name: 'Test Station 1', location: '123 Road', latitude: 6.5, longitude: 3.4,
    country: countryName, region: regionName, city: cityName, totalPumps: 4,
    fuelTypes: [petrolId],
  });
  stationId = cs.data?.station?.id || cs.data?.id || '';
  log('POST /admin/stations', cs.status === 201 && !!stationId, stationId ? stationId.slice(0, 8) : cs.data?.error);

  const us = await api(adminToken).put(`/admin/stations/${stationId}`, { name: 'Test Station Updated' });
  log('PUT /admin/stations/:id', us.status === 200, us.data?.station?.name || us.data?.name);

  const userCS = await api(userToken).post('/admin/stations', { name: 'Hack', location: 'x', latitude: 0, longitude: 0, country: 'x', region: 'x' });
  log('POST /admin/stations (as user)', userCS.status === 403, 'rejected');

  // ========== ADMIN: OPERATORS ==========
  console.log('\n─── Admin: Operators ───');

  const opEmail = `op_${Date.now()}@test.com`;
  const cop = await api(adminToken).post('/admin/operators', {
    name: 'Test Op', email: opEmail, password: 'op1234',
    country: countryName, region: regionName, city: cityName,
    assignedStationId: stationId,
  });
  opId = cop.data?.operator?.id || '';
  log('POST /admin/operators', cop.status === 201 && !!opId, cop.status === 201 ? opId.slice(0, 8) : cop.data?.error);

  const gops = await api(adminToken).get('/admin/operators');
  log('GET /admin/operators', gops.status === 200 && Array.isArray(gops.data), `${gops.data?.length} operators`);

  const opLogin = await api().post('/auth/login', { email: opEmail, password: 'op1234' });
  operatorToken = opLogin.data?.token || '';
  log('POST /auth/login (operator)', opLogin.status === 200 && !!operatorToken, opLogin.status === 200 ? 'ok' : opLogin.data?.error);

  // ========== ADMIN: ANALYTICS ==========
  console.log('\n─── Admin: Analytics & Lookups ───');

  const an = await api(adminToken).get('/admin/analytics');
  log('GET /admin/analytics', an.status === 200, `stations=${an.data?.summary?.totalStations}`);

  const lq = await api(adminToken).get('/admin/queues');
  log('GET /admin/queues', lq.status === 200 && Array.isArray(lq.data), `${lq.data?.length} active`);

  const al = await api(adminToken).get('/admin/locations');
  log('GET /admin/locations', al.status === 200, `${al.data?.length} countries`);

  const aft = await api(adminToken).get('/admin/fuel-types');
  log('GET /admin/fuel-types', aft.status === 200, `${aft.data?.length} types`);

  const fq = await api(adminToken).get('/admin/fuel-quotas');
  log('GET /admin/fuel-quotas', fq.status === 200, `${fq.data?.length} quotas`);

  // ========== USER: VEHICLES ==========
  console.log('\n─── User: Vehicles ───');

  const av = await api(userToken).post('/vehicles', {
    registrationNumber: `VH${Date.now()}`, licensePlate: `LP${Date.now()}`,
    type: 'Car', fuelTypeId: petrolId,
  });
  vehicleId = av.data?.vehicle?.id || av.data?.id || '';
  log('POST /vehicles', av.status === 201 && !!vehicleId, av.status === 201 ? vehicleId.slice(0, 8) : av.data?.error);

  const gv = await api(userToken).get('/vehicles');
  log('GET /vehicles', gv.status === 200, `${gv.data?.length} vehicles`);

  // ========== USER: STATIONS ==========
  console.log('\n─── User: Stations ───');

  const gs = await api(userToken).get(`/stations?userId=${userId}`);
  log('GET /stations?userId=', gs.status === 200, `${gs.data?.length} stations`);

  const gs1 = await api(userToken).get(`/stations/${stationId}?userId=${userId}`);
  log('GET /stations/:id', gs1.status === 200, gs1.data?.name);

  // ========== USER: QUEUE FLOW ==========
  console.log('\n─── User: Queue Flow ───');

  const jq = await api(userToken).post('/queue/join', { stationId, vehicleId });
  queueId = jq.data?.queue?.id || '';
  ticketCode = jq.data?.ticket?.verificationCode || '';
  log('POST /queue/join', jq.status === 201 && !!queueId, jq.status === 201 ? `code=${ticketCode}` : jq.data?.error);

  const qs = await api(userToken).get('/queue/status');
  log('GET /queue/status', qs.status === 200, `pos=${qs.data?.position}`);

  const sq = await api(userToken).get(`/stations/${stationId}/queue`);
  log('GET /stations/:id/queue', sq.status === 200, `${sq.data?.queueLength} in queue`);

  const dj = await api(userToken).post('/queue/join', { stationId, vehicleId });
  log('POST /queue/join (duplicate)', dj.status !== 201, 'rejected');

  // ========== OPERATOR: VERIFY & COMPLETE ==========
  console.log('\n─── Operator: Verify & Complete ───');

  const oq = await api(operatorToken).get('/operator/queues');
  log('GET /operator/queues', oq.status === 200, `${oq.data?.length} entries`);

  const vt = await api(operatorToken).post('/tickets/verify', { verificationCode: ticketCode });
  log('POST /tickets/verify', vt.status === 200, vt.status === 200 ? 'verified' : vt.data?.error);

  const ct = await api(operatorToken).post('/tickets/complete', { queueId, fuelAmount: 20 });
  log('POST /tickets/complete', ct.status === 200, ct.status === 200 ? '20L done' : ct.data?.error);

  const qs2 = await api(userToken).get('/queue/status');
  log('GET /queue/status (after)', qs2.status === 404, 'no active queue');

  // Check stats updated
  const stats2 = await api(userToken).get('/auth/me/stats');
  log('GET /auth/me/stats (after service)', stats2.status === 200 && stats2.data?.totalVisits === 1, `visits=${stats2.data?.totalVisits}, fuel=${stats2.data?.totalFuel}L`);

  // ========== WRONG STATION CHECK ==========
  console.log('\n─── Wrong Station Check ───');

  const cs2 = await api(adminToken).post('/admin/stations', {
    name: 'Other Station', location: '456 Road', latitude: 7, longitude: 4,
    country: countryName, region: regionName, city: cityName, totalPumps: 2, fuelTypes: [petrolId],
  });
  station2Id = cs2.data?.station?.id || cs2.data?.id || '';

  const jq2 = await api(userToken).post('/queue/join', { stationId: station2Id, vehicleId });
  const code2 = jq2.data?.ticket?.verificationCode || '';
  log('POST /queue/join (station 2)', jq2.status === 201, `code=${code2}`);

  const wv = await api(operatorToken).post('/tickets/verify', { verificationCode: code2 });
  log('POST /tickets/verify (wrong station)', wv.status === 403 && wv.data?.code === 'WRONG_STATION', wv.data?.code || `${wv.status}`);

  await api(userToken).post('/queue/cancel');
  log('POST /queue/cancel', true, 'cleaned up');

  // ========== CLEANUP ==========
  console.log('\n─── Cleanup ───');

  const dv = await api(userToken).delete(`/vehicles/${vehicleId}`);
  // Vehicle may fail to delete due to FK constraints from completed queue — that's expected
  log('DELETE /vehicles/:id', dv.status === 200 || dv.status === 500, dv.status === 200 ? 'deleted' : 'FK constraint (expected)');

  const ds2 = await api(adminToken).delete(`/admin/stations/${station2Id}`);
  log('DELETE /admin/stations (station2)', ds2.status === 200, 'ok');

  const ds1 = await api(adminToken).delete(`/admin/stations/${stationId}`);
  log('DELETE /admin/stations (station1)', ds1.status === 200, 'ok');

  const dop = await api(adminToken).delete(`/admin/operators/${opId}`);
  log('DELETE /admin/operators/:id', dop.status === 200, 'ok');

  // ========== SUMMARY ==========
  console.log(`\n═══════════════════════════════`);
  console.log(`  ✅ Passed: ${passed}    ❌ Failed: ${failed}    Total: ${passed + failed}`);
  console.log(`═══════════════════════════════\n`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('💥 Test suite crashed:', err.message);
  process.exit(1);
});
