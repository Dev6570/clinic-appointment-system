const apiBaseCandidates = [
  window.__NIYATI_TEMPLATE_API_BASE__,
  localStorage.getItem('niyati.templateApiBase'),
  'http://localhost:8000'
].filter(Boolean);

const apiBase = String(apiBaseCandidates[0] || '').replace(//$/, '');
document.getElementById('apiBase').textContent = apiBase || '(same origin)';

const badge = document.getElementById('healthBadge');
const versionText = document.getElementById('versionText');

async function check() {
  try {
    const healthResp = await fetch(apiBase + '/health');
    if (!healthResp.ok) throw new Error('health ' + healthResp.status);
    const health = await healthResp.json();
    badge.textContent = health.ok ? 'Healthy' : 'Unhealthy';
    badge.className = health.ok ? 'ok' : 'fail';

    const versionResp = await fetch(apiBase + '/api/version');
    if (!versionResp.ok) throw new Error('version ' + versionResp.status);
    const version = await versionResp.json();
    versionText.textContent = JSON.stringify(version);
  } catch (err) {
    badge.textContent = 'Offline';
    badge.className = 'fail';
    versionText.textContent = err.message;
  }
}

check();
