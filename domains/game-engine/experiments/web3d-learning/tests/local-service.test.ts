import test from 'node:test';
import assert from 'node:assert/strict';
// @ts-ignore Node executes the management module directly; it is not part of the browser bundle.
import { createPlatform, inspectService, manageService, ownsProcess, serviceRoot, windowsArgs, ServiceError } from '../tools/manage-service.mjs';

const build = { version: 1, sourceId: 'a'.repeat(64), buildId: 'b'.repeat(64) };
const state = () => ({ version: 1, pid: 123, startedAt: '2026-10-27T00:00:00.0000000Z', project: serviceRoot,
  node: 'C:\\Node Runtime\\node.exe', token: 'c'.repeat(32), ...build, stderrLog: 'local.stderr.log' });
const info = (record = state()) => ({ pid: record.pid, startedAt: record.startedAt, executable: record.node,
  commandLine: `"${record.node}" "${record.project}\\tools\\service-host.mjs" "${record.project}" ${record.token}` });
function fixture() {
  let record: ReturnType<typeof state> | null = null;
  let processInfo: ReturnType<typeof info> | null = null;
  let listeners: number[] = [];
  let sourceId = build.sourceId;
  let healthy = true;
  let builds = 0, launches = 0, kills = 0;
  const platform = {
    root: serviceRoot,
    async readState() { return record; },
    async writeState(value: typeof record) { record = value; },
    async clearState() { record = null; },
    async getProcess(_pid: number) { return processInfo; },
    async listeners() { return listeners; },
    async sourceId() { return sourceId; },
    async marker() { return build; },
    async probe() { return healthy; },
    async build() { builds++; return build; },
    async launch() { launches++; record = state(); processInfo = info(record); listeners = [record.pid]; return record; },
    async kill() { kills++; processInfo = null; listeners = []; },
    async wait() {},
  };
  return { platform,
    setup() { record = state(); processInfo = info(record); listeners = [record.pid]; },
    foreign() { listeners = [999]; },
    reusedPid() { processInfo = { ...info(), startedAt: 'reused' }; },
    outdated() { sourceId = 'd'.repeat(64); },
    unhealthy() { healthy = false; },
    counts() { return { builds, launches, kills }; },
    record() { return record; },
  };
}

test('managed service ownership requires the full command, creation time, token, root and executable', () => {
  assert.equal(ownsProcess(state(), info()), true);
  const wrong = [
    { ...info(), startedAt: 'new process with reused PID' },
    { ...info(), executable: 'C:\\Other\\node.exe' },
    { ...info(), commandLine: info().commandLine.replace('service-host.mjs', 'other-host.mjs') },
    { ...info(), commandLine: info().commandLine.replace('c'.repeat(32), 'd'.repeat(32)) },
    { ...info(), commandLine: info().commandLine + ' extra' },
  ];
  for (const processInfo of wrong) assert.equal(ownsProcess(state(), processInfo), false);
  assert.equal(ownsProcess({ ...state(), project: 'D:\\OtherProject' }, info()), false);
  assert.equal(ownsProcess(null, info()), false);
});

test('Windows command-line parsing preserves quoted paths and refuses appended arguments', () => {
  assert.deepEqual(windowsArgs('"C:\\Node Runtime\\node.exe" "D:\\Project Space\\host.mjs" token'),
    ['C:\\Node Runtime\\node.exe', 'D:\\Project Space\\host.mjs', 'token']);
  assert.deepEqual(windowsArgs('node "a\\\\\\"b" ""'), ['node', 'a\\"b', '']);
});

test('cold start builds and becomes healthy; duplicate start reuses without rebuilding', async () => {
  const f = fixture();
  assert.equal((await inspectService(f.platform)).status, 'stopped');
  assert.equal((await manageService('start', f.platform)).status, 'healthy');
  assert.equal((await manageService('start', f.platform)).status, 'healthy');
  assert.deepEqual(f.counts(), { builds: 1, launches: 1, kills: 0 });
});

test('unknown port listener blocks start and stop, and is never killed or rebuilt', async () => {
  const f = fixture(); f.foreign();
  assert.equal((await inspectService(f.platform)).status, 'foreign');
  await assert.rejects(manageService('start', f.platform), { code: 'BUSY' });
  await assert.rejects(manageService('stop', f.platform), { code: 'OWNER' });
  assert.deepEqual(f.counts(), { builds: 0, launches: 0, kills: 0 });
});

test('source changes require an explicit stop/start and never rebuild a live output directory', async () => {
  const f = fixture(); f.setup(); f.outdated();
  assert.equal((await inspectService(f.platform)).status, 'outdated');
  await assert.rejects(manageService('start', f.platform), { code: 'OUTDATED' });
  assert.deepEqual(f.counts(), { builds: 0, launches: 0, kills: 0 });
  assert.equal((await manageService('stop', f.platform)).status, 'stopped');
  assert.equal(f.counts().kills, 1);
});

test('reused PID and corrupted records never authorize stopping an unrelated process', async () => {
  const f = fixture(); f.setup(); f.reusedPid();
  assert.equal((await inspectService(f.platform)).status, 'foreign');
  await assert.rejects(manageService('stop', f.platform), { code: 'OWNER' });
  f.platform.readState = async () => { throw new SyntaxError('corrupted JSON'); };
  assert.equal((await inspectService(f.platform)).status, 'invalid');
  await assert.rejects(manageService('start', f.platform), { code: 'BUSY' });
  assert.equal(f.counts().kills, 0);
});

test('stale record with no listener is cleared without killing any process', async () => {
  const f = fixture();
  f.platform.readState = async () => state();
  assert.equal((await inspectService(f.platform)).status, 'stale');
  assert.equal((await manageService('stop', f.platform)).status, 'stopped');
  assert.equal(f.counts().kills, 0);
});

test('healthy response requires matching build marker, content and ownership', async () => {
  const f = fixture(); f.setup(); f.unhealthy();
  assert.equal((await inspectService(f.platform)).status, 'unhealthy');
  await assert.rejects(manageService('start', f.platform), { code: 'BUSY' });
  assert.equal(f.counts().builds, 0);
});

test('build failure and mid-build source changes never launch the preview', async () => {
  const failed = fixture();
  failed.platform.build = async () => { throw new ServiceError('BUILD', 'fixture build failed'); };
  await assert.rejects(manageService('start', failed.platform), { code: 'BUILD' });
  assert.equal(failed.counts().launches, 0);
  const changed = fixture();
  changed.platform.build = async () => { changed.outdated(); return build; };
  await assert.rejects(manageService('start', changed.platform), { code: 'CHANGED' });
  assert.equal(changed.counts().launches, 0);
});

test('readiness failure has bounded attempts and stops only the newly owned instance', async () => {
  const f = fixture(); f.unhealthy();
  await assert.rejects(manageService('start', f.platform), { code: 'READY' });
  assert.deepEqual(f.counts(), { builds: 1, launches: 1, kills: 1 });
  assert.equal(f.record(), null);
});

test('record-write failure or readiness query exception cleans up the newly owned process', async () => {
  const denied = fixture();
  denied.platform.writeState = async () => { throw Object.assign(new Error('record not writable'), { code: 'EACCES' }); };
  await assert.rejects(manageService('start', denied.platform), { code: 'EACCES' });
  assert.equal(denied.counts().kills, 1);
  assert.equal(denied.record(), null);
  const failed = fixture();
  const launch = failed.platform.launch;
  failed.platform.launch = async () => {
    const record = await launch();
    failed.platform.probe = async () => { throw new Error('readiness query failed'); };
    return record;
  };
  await assert.rejects(manageService('start', failed.platform), /readiness query failed/);
  assert.equal(failed.counts().kills, 1);
  assert.equal(failed.record(), null);
});

test('HTTP 200 SPA fallback, wrong marker and malformed course JSON do not count as healthy', async () => {
  const platform = createPlatform();
  const goodFetch = async (url: string) => url.endsWith('/learning-build.json')
    ? new Response(JSON.stringify(build), { headers: { 'content-type': 'application/json' } })
    : url.includes('/translations/')
      ? new Response(JSON.stringify({ course: 'games101', chapter: '03', sections: [{}] }), { headers: { 'content-type': 'application/json' } })
      : new Response('<script type="module" src="/assets/index.js"></script>', { headers: { 'content-type': 'text/html' } });
  assert.equal(await platform.probe(state(), goodFetch), true);
  assert.equal(await platform.probe(state(), async () => new Response('<html>SPA fallback</html>', { headers: { 'content-type': 'text/html' } })), false);
  assert.equal(await platform.probe(state(), async (url: string) => url.endsWith('/learning-build.json')
    ? new Response(JSON.stringify({ ...build, buildId: 'wrong' }), { headers: { 'content-type': 'application/json' } }) : goodFetch(url)), false);
  assert.equal(await platform.probe(state(), async (url: string) => url.includes('/translations/')
    ? new Response('{broken json', { headers: { 'content-type': 'application/json' } }) : goodFetch(url)), false);
});
