import { createHash, randomBytes } from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, open, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { openSync, closeSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const exec = promisify(execFile);
export const serviceOrigin = 'http://127.0.0.1:5173';
export const serviceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const normalized = value => resolve(value).toLowerCase();
const delay = milliseconds => new Promise(done => setTimeout(done, milliseconds));

export class ServiceError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

// Sufficient Windows command-line parsing for spawn's standard quoted argv.
export function windowsArgs(command) {
  const result = [];
  let value = '', quoted = false, active = false;
  for (let i = 0; i < command.length; i++) {
    if (command[i] === '\\') {
      let count = 0;
      while (command[i + count] === '\\') count++;
      if (command[i + count] === '"') {
        value += '\\'.repeat(Math.floor(count / 2));
        if (count % 2) value += '"'; else quoted = !quoted;
        i += count;
      } else { value += '\\'.repeat(count); i += count - 1; }
      active = true;
    } else if (command[i] === '"') { quoted = !quoted; active = true; }
    else if (/\s/.test(command[i]) && !quoted) {
      if (active) result.push(value);
      value = ''; active = false;
    } else { value += command[i]; active = true; }
  }
  if (active) result.push(value);
  return result;
}

export function ownsProcess(state, processInfo, root = serviceRoot) {
  if (!state || !processInfo || state.version !== 1 || state.pid !== processInfo.pid ||
      !Number.isInteger(state.pid) || state.pid <= 0 || state.startedAt !== processInfo.startedAt ||
      typeof state.project !== 'string' || normalized(state.project) !== normalized(root) ||
      typeof state.startedAt !== 'string' || typeof state.node !== 'string' || normalized(state.node) !== normalized(processInfo.executable ?? '') ||
      !/^[a-f0-9]{32}$/.test(state.token ?? '') || !/^[a-f0-9]{64}$/.test(state.buildId ?? '')) return false;
  const argv = windowsArgs(processInfo.commandLine ?? '');
  return argv.length === 4 && normalized(argv[0]) === normalized(state.node) &&
    normalized(argv[1]) === normalized(join(root, 'tools', 'service-host.mjs')) &&
    normalized(argv[2]) === normalized(root) && argv[3] === state.token;
}

async function filesUnder(root) {
  const results = [];
  for (const entry of (await readdir(root, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) results.push(...await filesUnder(path));
    else if (entry.isFile()) results.push(path);
  }
  return results;
}

export async function fingerprint(root, build = false) {
  const files = build ? await filesUnder(join(root, 'dist')) : [
    ...await filesUnder(join(root, 'src')), ...await filesUnder(join(root, 'public')),
    ...['index.html', 'package.json', 'package-lock.json', 'tsconfig.json',
      'tools/service-host.mjs', 'tools/manage-service.mjs', 'tools/run.ps1'].map(file => join(root, file)),
    ...((await readdir(root)).filter(file => /^vite\.config\./.test(file)).map(file => join(root, file))),
  ];
  const hash = createHash('sha256');
  for (const file of files.filter(file => !file.endsWith('learning-build.json')).sort()) {
    hash.update(relative(root, file).replaceAll('\\', '/')); hash.update('\0');
    hash.update(await readFile(file)); hash.update('\0');
  }
  return hash.digest('hex');
}

async function jsonOrNull(path) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

export function createPlatform(root = serviceRoot, npmCli = '') {
  const local = join(root, 'tools', '.local');
  const statePath = join(local, 'service.json');
  const markerPath = join(root, 'dist', 'learning-build.json');
  const launchedChildren = new Map();
  const platform = {
    root, local, statePath,
    async readState() { return jsonOrNull(statePath); },
    async writeState(state) {
      await mkdir(local, { recursive: true });
      const temporary = `${statePath}.${process.pid}.tmp`;
      await writeFile(temporary, JSON.stringify(state, null, 2)); await rename(temporary, statePath);
    },
    async clearState() { await rm(statePath, { force: true }); },
    async sourceId() { return fingerprint(root); },
    async marker() { return jsonOrNull(markerPath); },
    async getProcess(pid) {
      if (!Number.isInteger(pid) || pid <= 0) return null;
      const script = `$p=Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}'; if ($p) { @{pid=[int]$p.ProcessId;startedAt=$p.CreationDate.ToUniversalTime().ToString('o');executable=$p.ExecutablePath;commandLine=$p.CommandLine}|ConvertTo-Json -Compress }`;
      const { stdout } = await exec('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true, timeout: 7000 });
      return stdout.trim() ? JSON.parse(stdout) : null;
    },
    async listeners() {
      const script = "@(Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique) | ConvertTo-Json -Compress";
      const { stdout } = await exec('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true, timeout: 7000 });
      const data = stdout.trim() ? JSON.parse(stdout) : [];
      return Array.isArray(data) ? data : [data];
    },
    async probe(state, fetcher = fetch) {
      const get = async (path, type) => {
        const response = await fetcher(serviceOrigin + path, { signal: AbortSignal.timeout(2000), cache: 'no-store' });
        if (!response.ok || !response.headers.get('content-type')?.includes(type)) throw new Error(`${path} response type/status`);
        return type === 'application/json' ? response.json() : response.text();
      };
      try {
        const marker = await get('/learning-build.json', 'application/json');
        if (marker.version !== 1 || marker.buildId !== state.buildId || marker.sourceId !== state.sourceId) return false;
        const html = await get('/?lab=practice&experiment=02', 'text/html');
        if (!/<script\b[^>]*\bsrc=["'][^"']+\.js/.test(html)) return false;
        const course = await get('/translations/games101/03.json', 'application/json');
        return course.course === 'games101' && course.chapter === '03' && Array.isArray(course.sections) && course.sections.length > 0;
      } catch { return false; }
    },
    async build() {
      if (!npmCli) throw new ServiceError('BUILD', 'npm-cli.js is required');
      await mkdir(local, { recursive: true });
      const stamp = `${Date.now()}-${randomBytes(4).toString('hex')}`;
      const log = join(local, `build-${stamp}.log`);
      const handle = openSync(log, 'a');
      try {
        await new Promise((done, reject) => {
          const child = spawn(process.execPath, [npmCli, 'run', 'build'], { cwd: root, windowsHide: true, stdio: ['ignore', handle, handle] });
          let deadline, originalProcess, timedOut = false;
          child.once('spawn', () => {
            originalProcess = this.getProcess(child.pid).catch(() => null);
            deadline = setTimeout(async () => {
              timedOut = true;
              // npm owns a command-shell/build subtree on Windows. Recheck creation time before killing that subtree.
              const before = await originalProcess, current = await this.getProcess(child.pid).catch(() => null);
              if (before && current && before.startedAt === current.startedAt && before.commandLine === current.commandLine) {
                await exec('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, timeout: 7000 }).catch(() => {});
              }
              reject(new ServiceError('BUILD_TIMEOUT', `构建超过 120 秒，请查看日志：${log}`));
            }, 120000);
          });
          child.once('error', error => { clearTimeout(deadline); reject(error); });
          child.once('exit', code => {
            clearTimeout(deadline);
            if (!timedOut) code === 0 ? done() : reject(new ServiceError('BUILD', `构建失败（${code}）。日志：${log}`));
          });
        });
      } finally { closeSync(handle); }
      const sourceId = await fingerprint(root), buildId = await fingerprint(root, true);
      const marker = { version: 1, sourceId, buildId, builtAt: new Date().toISOString() };
      await writeFile(markerPath, JSON.stringify(marker));
      return marker;
    },
    async launch(marker) {
      const token = randomBytes(16).toString('hex');
      const stdoutLog = join(local, `preview-${Date.now()}-${token.slice(0, 8)}.stdout.log`);
      const stderrLog = stdoutLog.replace('.stdout.', '.stderr.');
      const stdout = openSync(stdoutLog, 'a'), stderr = openSync(stderrLog, 'a');
      let child;
      try {
        child = spawn(process.execPath, [join(root, 'tools', 'service-host.mjs'), root, token], {
          cwd: root, detached: true, windowsHide: true, stdio: ['ignore', stdout, stderr],
        });
        await new Promise((done, reject) => { child.once('spawn', done); child.once('error', reject); });
        launchedChildren.set(token, child);
        child.once('exit', () => launchedChildren.delete(token));
        child.unref();
        const info = await this.getProcess(child.pid);
        if (!info) throw new ServiceError('LAUNCH', `服务进程未启动。日志：${stderrLog}`);
        return { version: 1, pid: child.pid, startedAt: info.startedAt, project: root, node: process.execPath, token,
          buildId: marker.buildId, sourceId: marker.sourceId, stdoutLog, stderrLog };
      } catch (error) {
        // The native ChildProcess handle identifies only this newly spawned process, even if PID lookup failed.
        if (child && child.exitCode === null && child.pid) child.kill();
        launchedChildren.delete(token);
        throw error;
      } finally { closeSync(stdout); closeSync(stderr); }
    },
    async abortLaunch(state) {
      const child = launchedChildren.get(state.token);
      if (child && child.pid === state.pid) {
        if (child.exitCode === null) child.kill();
        launchedChildren.delete(state.token);
      } else if (ownsProcess(state, await this.getProcess(state.pid), root)) await this.kill(state);
    },
    async kill(state) {
      // Recheck immediately before stopping. Never stop a process merely because its port or PID matches.
      if (!ownsProcess(state, await this.getProcess(state.pid), root)) throw new ServiceError('OWNER', '进程身份已改变，未停止任何进程。');
      process.kill(state.pid);
    },
    async wait() { await delay(300); },
  };
  return platform;
}

export async function inspectService(platform) {
  const listeners = await platform.listeners();
  let state;
  try { state = await platform.readState(); }
  catch { return { status: 'invalid', message: '管理记录损坏；未停止任何进程。' }; }
  if (!state) return { status: listeners.length ? 'foreign' : 'stopped', message: listeners.length ? '5173 已被未登记进程占用；未停止它。' : '学习服务未启动。' };
  const info = await platform.getProcess(state.pid);
  if (!ownsProcess(state, info, platform.root)) return { status: listeners.length ? 'foreign' : 'stale', message: '管理记录已过期或进程不属于本项目；未停止任何进程。', state };
  if (listeners.length !== 1 || listeners[0] !== state.pid) return { status: 'unhealthy', message: '本项目进程尚未监听或端口归属不一致。', state };
  let marker;
  try { marker = await platform.marker(); } catch { marker = null; }
  if (!marker || marker.version !== 1 || marker.buildId !== state.buildId || marker.sourceId !== state.sourceId || !await platform.probe(state)) {
    return { status: 'unhealthy', message: '页面、构建标识或课程 JSON 检查未通过。', state };
  }
  if (await platform.sourceId() !== state.sourceId) return { status: 'outdated', message: '服务正常响应，但代码已有修改。请先 stop，再 start 重建。', state };
  return { status: 'healthy', message: `学习服务可访问：${serviceOrigin}`, state };
}

export async function manageService(command, platform) {
  if (command === 'status') return inspectService(platform);
  const current = await inspectService(platform);
  if (command === 'stop') {
    if (!current.state || !ownsProcess(current.state, await platform.getProcess(current.state.pid), platform.root)) {
      if (current.status === 'stopped' || current.status === 'stale') { await platform.clearState(); return { status: 'stopped', message: '学习服务已停止；已清理失效记录。' }; }
      throw new ServiceError('OWNER', current.message);
    }
    await platform.kill(current.state);
    const stopDeadline = Date.now() + 10000;
    for (let attempt = 0; attempt < 20 && Date.now() < stopDeadline; attempt++) {
      if (!ownsProcess(current.state, await platform.getProcess(current.state.pid), platform.root)) {
        await platform.clearState(); return { status: 'stopped', message: '学习服务已停止。' };
      }
      await platform.wait();
    }
    throw new ServiceError('STOP', '停止检查超时；保留记录以便再次检查。');
  }
  if (command !== 'start') throw new ServiceError('COMMAND', '仅支持 start/status/stop。');
  if (current.status === 'healthy') return { ...current, message: `复用已启动的学习服务：${serviceOrigin}` };
  if (current.status === 'outdated') throw new ServiceError('OUTDATED', current.message);
  if (current.status === 'foreign' || current.status === 'invalid' || current.status === 'unhealthy') throw new ServiceError('BUSY', current.message);
  // No managed live instance and no listeners: safe to replace the build output.
  const before = await platform.sourceId();
  const marker = await platform.build();
  if (before !== marker.sourceId || before !== await platform.sourceId()) throw new ServiceError('CHANGED', '构建期间代码发生修改，请完成修改后重新 start。');
  if ((await platform.listeners()).length) throw new ServiceError('BUSY', '构建后 5173 被其它进程占用，未启动服务。');
  const state = await platform.launch(marker);
  try {
    await platform.writeState(state);
    const readyDeadline = Date.now() + 20000;
    for (let attempt = 0; attempt < 25 && Date.now() < readyDeadline; attempt++) {
      if (!ownsProcess(state, await platform.getProcess(state.pid), platform.root)) break;
      if ((await platform.listeners()).includes(state.pid) && await platform.probe(state)) return { status: 'healthy', message: `学习服务已启动：${serviceOrigin}`, state };
      await platform.wait();
    }
    throw new ServiceError('READY', `服务未在限定次数内就绪。日志：${state.stderrLog}`);
  } catch (error) {
    try {
      if (platform.abortLaunch) await platform.abortLaunch(state);
      else if (ownsProcess(state, await platform.getProcess(state.pid), platform.root)) await platform.kill(state);
      const recorded = await platform.readState();
      if (recorded?.token === state.token) await platform.clearState();
    } catch (cleanupError) { error.message += `；清理检查失败：${cleanupError.message}`; }
    throw error;
  }
}

async function withLock(platform, callback) {
  await mkdir(platform.local, { recursive: true });
  const lockPath = join(platform.local, 'manager.lock');
  let handle;
  try { handle = await open(lockPath, 'wx'); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const lock = await jsonOrNull(lockPath).catch(() => null);
    // A second manager may observe the lock between exclusive creation and its first write.
    if (!lock && Date.now() - (await stat(lockPath)).mtimeMs < 30000) throw new ServiceError('LOCK', '另一个启动／停止操作正在初始化，请稍后重试。');
    const info = lock?.pid ? await platform.getProcess(lock.pid) : null;
    if (info && info.startedAt === lock.startedAt) throw new ServiceError('LOCK', '另一个启动／停止操作正在运行，请稍后重试。');
    await rm(lockPath, { force: true }); handle = await open(lockPath, 'wx');
  }
  try {
    const info = await platform.getProcess(process.pid);
    await handle.writeFile(JSON.stringify({ pid: process.pid, startedAt: info?.startedAt }));
    return await callback();
  } finally { await handle.close(); await rm(lockPath, { force: true }); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [command, npmCli] = process.argv.slice(2);
  const platform = createPlatform(serviceRoot, npmCli);
  try {
    const result = command === 'status' ? await manageService(command, platform) : await withLock(platform, () => manageService(command, platform));
    console.log(result.message);
    if (result.state) console.log(`PID ${result.state.pid} · 日志 ${result.state.stderrLog}`);
    if (command === 'status' && result.status !== 'healthy') process.exitCode = 2;
  } catch (error) { console.error(`[${error.code ?? 'SERVICE'}] ${error.message}`); process.exitCode = 1; }
}
