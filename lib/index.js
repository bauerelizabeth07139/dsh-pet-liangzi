/**
 * 梁子 desktop pet (Liangzi) — host half.
 *
 * The browser half is a plain script the shell loads; this module is the Cordis
 * plugin that runs in the Host process. It owns the configuration file and
 * serves every pixel and every sample the pet uses straight out of this
 * package, so installing the plugin is the whole setup — no build step, no
 * external service, no network at runtime.
 *
 * Routes:
 *  - GET  /api/dsh-pet-liangzi/config           the sanitized config object
 *  - PUT  /api/dsh-pet-liangzi/config           a full or partial config; writes
 *                                       $DSH_HOME/dsh-pet-liangzi.json, returns the
 *                                       sanitized result
 *  - GET  /api/dsh-pet-liangzi/asset/<path>     any file under assets/, content-typed,
 *                                       with byte-range support so <audio> can
 *                                       seek
 *  - GET  /api/dsh-pet-liangzi/diag             the last browser-side diagnostic report
 *  - POST /api/dsh-pet-liangzi/diag             record one
 *
 * The config is also stamped into the served HTML as window.DshPetLiangzi so the pet
 * is already on screen at first paint instead of after a fetch.
 */
import { createReadStream, existsSync, mkdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const name = 'dsh-pet-liangzi'
export const inject = ['webServer']

/** Config file name under $DSH_HOME. */
const FILE_NAME = 'dsh-pet-liangzi.json'

/** Everything the browser may request lives under here. */
const ASSET_ROOT = fileURLToPath(new URL('../assets/', import.meta.url))

/** Extension -> content type for the files this package ships. */
const TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.json': 'application/json; charset=utf-8',
}

/** Per-field raw length caps; numeric fields are clamped afterwards. */
const LIMITS = {
  enabled: 8,
  size: 8,
  opacity: 8,
  posX: 8,
  posY: 8,
  wander: 8,
  acts: 8,
  bubble: 8,
  chatter: 8,
  voice: 8,
  voiceVolume: 8,
  sfx: 8,
  sfxVolume: 8,
  bgm: 8,
  bgmVolume: 8,
  link: 8,
}
const KEYS = Object.keys(LIMITS)

/** Flags that are only ever the literal strings 'true' or 'false'. */
const BOOLS = ['enabled', 'wander', 'acts', 'bubble', 'chatter', 'voice', 'sfx', 'bgm', 'link']

/**
 * Stock behaviour: the pet is visible, 190px tall, wandering,
 * talking, and voiced — but silent until the browser's first user gesture
 * unlocks audio. Background music stays off; a pet that makes noise before the
 * user asks for it is a worse default than one that does not.
 *
 * @returns a complete config object.
 */
function defaults() {
  return {
    enabled: 'true',
    size: '190',
    opacity: '100',
    posX: '',
    posY: '18',
    wander: 'true',
    acts: 'true',
    bubble: 'true',
    chatter: 'true',
    voice: 'true',
    voiceVolume: '80',
    sfx: 'true',
    sfxVolume: '60',
    bgm: 'false',
    bgmVolume: '35',
    link: 'true',
  }
}

/** Clamp a parsed integer into `[min, max]`, falling back when unparseable. */
function clampInt(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

/**
 * Keep only known fields and clamp everything the client turns into CSS or
 * gain. `posX` is special: the empty string means "wherever the pet's default
 * spot is", which depends on the viewport and so cannot be resolved here.
 *
 * @param input - untrusted parsed JSON.
 * @returns a complete, safe config object.
 */
function sanitize(input) {
  const out = defaults()
  if (input === null || typeof input !== 'object') return out
  for (const key of KEYS) {
    const value = input[key]
    if (typeof value === 'string') out[key] = value.slice(0, LIMITS[key])
  }
  for (const key of BOOLS) {
    if (out[key] !== 'true' && out[key] !== 'false') out[key] = defaults()[key]
  }
  out.size = String(clampInt(out.size, 90, 460, Number(defaults().size)))
  out.opacity = String(clampInt(out.opacity, 30, 100, 100))
  out.posY = String(clampInt(out.posY, -200, 4000, 18))
  out.posX = out.posX.trim() === '' ? '' : String(clampInt(out.posX, 0, 20000, 0))
  out.voiceVolume = String(clampInt(out.voiceVolume, 0, 100, 80))
  out.sfxVolume = String(clampInt(out.sfxVolume, 0, 100, 60))
  out.bgmVolume = String(clampInt(out.bgmVolume, 0, 100, 35))
  return out
}

/** Absolute config path: $DSH_HOME/dsh-pet-liangzi.json, defaulting to ~/.dsh. */
function configPath() {
  const env = process.env.DSH_HOME
  const home = typeof env === 'string' && env.trim() !== '' ? env : join(homedir(), '.dsh')
  return join(home, FILE_NAME)
}

/** Read the config file; a missing or malformed file yields the defaults. */
function readConfig() {
  try {
    const path = configPath()
    if (!existsSync(path)) return defaults()
    return sanitize(JSON.parse(readFileSync(path, 'utf8')))
  } catch {
    return defaults()
  }
}

/**
 * Persist the config, creating $DSH_HOME when needed.
 *
 * The bytes go to a sibling temporary file first and are renamed over the
 * target, so a process killed mid-write can never leave a half-written file
 * behind for the next start to read.
 */
function writeConfig(cfg) {
  const path = configPath()
  mkdirSync(dirname(path), { recursive: true })
  const temp = path + '.' + String(process.pid) + '.tmp'
  try {
    writeFileSync(temp, JSON.stringify(cfg, null, 2) + '\n', 'utf8')
    renameSync(temp, path)
  } catch (error) {
    try {
      unlinkSync(temp)
    } catch {
      /* the rename already consumed it, or it was never created */
    }
    throw error
  }
}

/** The object the client boots from. */
function bootPayload() {
  return { config: readConfig(), pet: 'liangzi', name: '梁子' }
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

/** Collect a JSON request body with a hard 256 KB ceiling. */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let text = ''
    req.on('data', (chunk) => {
      text += chunk
      if (text.length > 256 * 1024) {
        reject(new Error('request body too large'))
        req.destroy()
      }
    })
    req.on('end', () => {
      try {
        resolve(text === '' ? {} : JSON.parse(text))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

/**
 * Mutations require a same-origin browser call: requests without an Origin
 * header (same-origin navigations, curl) pass; a cross-site Origin must not.
 */
function sameOrigin(req) {
  const origin = req.headers?.origin
  if (typeof origin !== 'string' || origin === '') return true
  try {
    return new URL(origin).host === req.headers.host
  } catch {
    return false
  }
}

/** Handle GET/PUT /api/dsh-pet-liangzi/config. */
async function handleConfig(req, res) {
  try {
    if (req.method === 'GET') {
      sendJson(res, 200, readConfig())
      return
    }
    if (req.method === 'PUT' || req.method === 'POST') {
      if (!sameOrigin(req)) {
        sendJson(res, 403, { error: 'untrusted origin' })
        return
      }
      const cfg = sanitize(await readBody(req))
      writeConfig(cfg)
      sendJson(res, 200, cfg)
      return
    }
    res.writeHead(405, { allow: 'GET, PUT, POST' })
    res.end()
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) })
  }
}

/**
 * Resolve a request path against the asset root, refusing anything that escapes
 * it. A URL like `../../package.json` must not become a file read.
 *
 * @param relative - the decoded path after `/asset/`.
 * @returns the absolute file path, or null when it is not a legal asset.
 */
function resolveAsset(relative) {
  const clean = normalize(relative).replace(/^([/\\])+/, '')
  if (clean === '' || clean.startsWith('..')) return null
  const full = resolve(ASSET_ROOT, clean)
  const root = resolve(ASSET_ROOT)
  if (full !== root && !full.startsWith(root + sep)) return null
  return full
}

/**
 * Serve one asset with byte-range support.
 *
 * `<audio>` seeks and some browsers probe with a `Range` request before they
 * will play at all, so a plain 200 is not enough for the voice clips.
 */
async function handleAsset(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { allow: 'GET, HEAD' })
    res.end()
    return
  }
  try {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const relative = decodeURIComponent(url.pathname.replace('/api/dsh-pet-liangzi/asset/', ''))
    const path = resolveAsset(relative)
    if (path === null || !existsSync(path)) {
      sendJson(res, 404, { error: 'asset not found' })
      return
    }
    const info = statSync(path)
    if (!info.isFile()) {
      sendJson(res, 404, { error: 'asset not found' })
      return
    }
    const type = TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream'
    const range = req.headers?.range
    if (typeof range === 'string' && /^bytes=\d*-\d*$/.test(range.trim())) {
      const [startRaw, endRaw] = range.trim().slice(6).split('-')
      const start = startRaw === '' ? Math.max(0, info.size - Number(endRaw)) : Number(startRaw)
      const end = endRaw === '' || startRaw === '' ? info.size - 1 : Math.min(Number(endRaw), info.size - 1)
      if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= info.size) {
        res.writeHead(416, { 'content-range': 'bytes */' + String(info.size) })
        res.end()
        return
      }
      res.writeHead(206, {
        'content-type': type,
        'content-length': String(end - start + 1),
        'content-range': 'bytes ' + String(start) + '-' + String(end) + '/' + String(info.size),
        'accept-ranges': 'bytes',
        'cache-control': 'public, max-age=86400',
      })
      if (req.method === 'HEAD') {
        res.end()
        return
      }
      createReadStream(path, { start, end }).pipe(res)
      return
    }
    res.writeHead(200, {
      'content-type': type,
      'content-length': String(info.size),
      'accept-ranges': 'bytes',
      'cache-control': 'public, max-age=86400',
    })
    if (req.method === 'HEAD') {
      res.end()
      return
    }
    createReadStream(path).pipe(res)
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) })
  }
}

/**
 * Last browser-side diagnostic report (mount state, errors). The client POSTs
 * after it applies the config; support reads it back over GET so a pet that
 * fails to appear can be diagnosed without a screenshot.
 */
let lastDiag = null

/** Keep only known scalar fields, capped — this comes from the browser. */
function sanitizeDiag(input) {
  if (input === null || typeof input !== 'object') return null
  const out = {}
  for (const key of ['at', 'pet', 'mounted', 'client', 'error']) {
    const value = input[key]
    if (typeof value === 'string') out[key] = value.slice(0, 300)
    else if (typeof value === 'number' || typeof value === 'boolean') out[key] = value
  }
  return out
}

/** Handle GET (read) / POST (record) /api/dsh-pet-liangzi/diag. */
async function handleDiag(req, res) {
  try {
    if (req.method === 'GET') {
      sendJson(res, 200, { report: lastDiag })
      return
    }
    if (req.method === 'POST' || req.method === 'PUT') {
      if (!sameOrigin(req)) {
        sendJson(res, 403, { error: 'untrusted origin' })
        return
      }
      lastDiag = sanitizeDiag(await readBody(req))
      sendJson(res, 200, { ok: true })
      return
    }
    res.writeHead(405, { allow: 'GET, POST, PUT' })
    res.end()
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) })
  }
}

/**
 * Stamp the boot payload into the served HTML so the pet is on screen at first
 * paint. `<` is escaped so config text can never break out of the tag.
 *
 * @param html - the index document.
 * @returns the stamped document.
 */
function stampIndex(html) {
  const json = JSON.stringify(bootPayload()).replace(/</g, '\\u003c')
  const tag = '<script>window.DshPetLiangzi=' + json + ';</' + 'script>'
  const at = html.indexOf('</head>')
  return at === -1 ? html + tag : html.slice(0, at) + tag + html.slice(at)
}

export function apply(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/api/dsh-pet-liangzi/config',
    handler: handleConfig,
  }), 'dsh-pet-liangzi: config route')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/api/dsh-pet-liangzi/diag',
    handler: handleDiag,
  }), 'dsh-pet-liangzi: diag route')

  ctx.effect(() => ctx.webServer.register({
    // No trailing slash: the router matches a prefix route on
    // `pathname.startsWith(prefix + '/')`, so `/api/dsh-pet-liangzi/asset` is the form
    // that actually captures `/api/dsh-pet-liangzi/asset/sprites/idle.png`.
    kind: 'prefix',
    path: '/api/dsh-pet-liangzi/asset',
    handler: handleAsset,
  }), 'dsh-pet-liangzi: asset route')

  ctx.effect(() => ctx.webServer.tapIndex(stampIndex), 'dsh-pet-liangzi: index stamp')
}
