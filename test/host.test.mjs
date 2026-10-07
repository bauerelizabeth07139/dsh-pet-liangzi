/**
 * Host-half checks. Exercises the real module — its routes, its config file and
 * its asset server — against a throwaway $DSH_HOME, so no browser is needed.
 *
 *   node test/host.test.mjs
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable, Writable } from 'node:stream'
import { fileURLToPath } from 'node:url'

const PKG = 'dsh-pet-liangzi'
const HOME = mkdtempSync(join(tmpdir(), 'pet-host-'))
process.env.DSH_HOME = HOME

const mod = await import('../lib/index.js')

let passed = 0
function check(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1
      console.log('  ok  ' + name)
    })
    .catch((error) => {
      console.error('  FAIL ' + name + '\n       ' + (error && error.message))
      process.exitCode = 1
    })
}

/** A fake ServerResponse that records status, headers and body bytes. */
function fakeRes() {
  const chunks = []
  const res = new Writable({
    write(chunk, _enc, done) {
      chunks.push(Buffer.from(chunk))
      done()
    },
  })
  res.status = 0
  res.headers = {}
  res.writeHead = (status, headers) => {
    res.status = status
    res.headers = headers || {}
    return res
  }
  res.body = () => Buffer.concat(chunks)
  res.json = () => JSON.parse(res.body().toString('utf8'))
  // Asset responses are piped, so the handler returns before the bytes land.
  // `finished` resolves when the stream is actually done.
  res.finished = new Promise((resolve) => res.on('finish', resolve))
  return res
}

/** Run one handler and wait for the response stream to finish. */
async function serve(handler, req) {
  const res = fakeRes()
  await handler(req, res)
  await res.finished
  return res
}

/** A fake IncomingMessage carrying an optional JSON body. */
function fakeReq(method, url, { body, headers } = {}) {
  const req = Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))])
  req.method = method
  req.url = url
  req.headers = headers || { host: '127.0.0.1:19387' }
  return req
}

/** Capture the routes the plugin registers, and the index stamp it installs. */
const routes = new Map()
const taps = []
const ctx = {
  effect(fn) {
    const dispose = fn()
    return typeof dispose === 'function' ? dispose : () => {}
  },
  webServer: {
    register(route) {
      routes.set(route.kind + ' ' + route.path, route)
      return () => routes.delete(route.kind + ' ' + route.path)
    },
    tapIndex(transform) {
      taps.push(transform)
      return () => {}
    },
  },
}

function route(kind, path) {
  const found = routes.get(kind + ' ' + path)
  assert.ok(found, 'route ' + kind + ' ' + path + ' is registered')
  return found.handler
}

console.log(PKG + ' host half')

await check('exports the package name and injects webServer', () => {
  assert.equal(mod.name, PKG)
  assert.deepEqual(mod.inject, ['webServer'])
})

await check('apply() registers config, diag, asset routes and the index stamp', () => {
  mod.apply(ctx)
  assert.equal(routes.size, 3, 'three routes')
  assert.equal(taps.length, 1, 'one index stamp')
  assert.deepEqual([...routes.keys()].sort(), [
    'exact /api/' + PKG + '/config',
    'exact /api/' + PKG + '/diag',
    'prefix /api/' + PKG + '/asset',
  ])
})

await check('GET config returns the defaults when no file exists', async () => {
  const res = fakeRes()
  await route('exact', '/api/' + PKG + '/config')(fakeReq('GET', '/api/' + PKG + '/config'), res)
  assert.equal(res.status, 200)
  const cfg = res.json()
  assert.equal(cfg.enabled, 'true')
  assert.equal(cfg.bgm, 'false', 'music stays off by default')
  assert.equal(cfg.posX, '', 'default spot is resolved in the browser')
})

await check('PUT config clamps out-of-range values and persists valid JSON', async () => {
  const res = fakeRes()
  await route('exact', '/api/' + PKG + '/config')(
    fakeReq('PUT', '/api/' + PKG + '/config', {
      body: { size: '9999', opacity: '1', bgmVolume: '-5', posY: '50', wander: 'maybe', acts: 'nope', extra: 'dropped' },
    }),
    res,
  )
  assert.equal(res.status, 200)
  const cfg = res.json()
  assert.equal(cfg.size, '460', 'size clamps to its maximum')
  assert.equal(cfg.opacity, '30', 'opacity clamps to its minimum')
  assert.equal(cfg.bgmVolume, '0')
  assert.equal(cfg.wander, 'true', 'an unknown boolean falls back to the default')
  assert.equal(cfg.acts, 'true', 'the idle-acts switch defaults to on')
  assert.equal(cfg.extra, undefined, 'unknown fields are dropped')

  const onDisk = JSON.parse(readFileSync(join(HOME, 'dsh-pet-liangzi.json'), 'utf8'))
  assert.deepEqual(onDisk, cfg, 'the file matches the response')
})

await check('a malformed config file falls back to defaults instead of throwing', async () => {
  writeFileSync(join(HOME, 'dsh-pet-liangzi.json'), '{ this is not json', 'utf8')
  const res = fakeRes()
  await route('exact', '/api/' + PKG + '/config')(fakeReq('GET', '/api/' + PKG + '/config'), res)
  assert.equal(res.json().enabled, 'true')
})

await check('a cross-site Origin is refused on writes', async () => {
  const res = fakeRes()
  await route('exact', '/api/' + PKG + '/config')(
    fakeReq('PUT', '/api/' + PKG + '/config', {
      body: { size: '200' },
      headers: { host: '127.0.0.1:19387', origin: 'https://evil.example' },
    }),
    res,
  )
  assert.equal(res.status, 403)
})

await check('every shipped sprite, voice line, effect, scene and track is served', async () => {
  const handler = route('prefix', '/api/' + PKG + '/asset')
  const pkgRoot = fileURLToPath(new URL('..', import.meta.url))
  const manifest = JSON.parse(readFileSync(join(pkgRoot, 'test', 'manifest.json'), 'utf8'))
  assert.ok(manifest.files.length > 20, 'the manifest lists the asset set')
  for (const file of manifest.files) {
    const res = await serve(handler, fakeReq('GET', '/api/' + PKG + '/asset/' + file))
    assert.equal(res.status, 200, file + ' is served')
    assert.ok(res.body().length > 0, file + ' is not empty')
    // The sprite folder also carries a JSON manifest recording which way each
    // pose faces; without this the content-type check below assumes anything
    // that is not a PNG must be audio.
    const want = file.endsWith('.png') ? 'image/png'
      : (file.endsWith('.json') ? 'application/json' : 'audio/')
    assert.ok(
      String(res.headers['content-type']).startsWith(want),
      file + ' has the right content type',
    )
  }
})

await check('byte ranges are honoured, because <audio> seeks', async () => {
  const handler = route('prefix', '/api/' + PKG + '/asset')
  const manifest = JSON.parse(
    readFileSync(join(fileURLToPath(new URL('..', import.meta.url)), 'test', 'manifest.json'), 'utf8'),
  )
  const track = manifest.files.find((f) => f.startsWith('bgm/')) || manifest.files[0]
  const full = await serve(handler, fakeReq('GET', '/api/' + PKG + '/asset/' + track))
  const size = full.body().length

  const partial = await serve(
    handler,
    fakeReq('GET', '/api/' + PKG + '/asset/' + track, { headers: { host: 'x', range: 'bytes=0-9' } }),
  )
  assert.equal(partial.status, 206)
  assert.equal(partial.headers['content-range'], 'bytes 0-9/' + String(size))
  assert.equal(partial.body().length, 10)
})

await check('path traversal out of assets/ is refused', async () => {
  const handler = route('prefix', '/api/' + PKG + '/asset')
  for (const attempt of ['../package.json', '..%2Fpackage.json', 'sprites/../../package.json', '..\\package.json']) {
    const res = await serve(handler, fakeReq('GET', '/api/' + PKG + '/asset/' + attempt))
    assert.equal(res.status, 404, attempt + ' is not served')
    assert.ok(!res.body().toString('utf8').includes('"dsh"'), attempt + ' leaks nothing')
  }
})

await check('a missing asset is a clean 404', async () => {
  const res = await serve(route('prefix', '/api/' + PKG + '/asset'), fakeReq('GET', '/api/' + PKG + '/asset/nope.png'))
  assert.equal(res.status, 404)
})

await check('diag records a report and reads it back, capped', async () => {
  const post = fakeRes()
  await route('exact', '/api/' + PKG + '/diag')(
    fakeReq('POST', '/api/' + PKG + '/diag', { body: { pet: 'x'.repeat(900), mounted: true, junk: 'nope' } }),
    post,
  )
  assert.equal(post.status, 200)
  const get = fakeRes()
  await route('exact', '/api/' + PKG + '/diag')(fakeReq('GET', '/api/' + PKG + '/diag'), get)
  const report = get.json().report
  assert.equal(report.pet.length, 300, 'long strings are capped')
  assert.equal(report.mounted, true)
  assert.equal(report.junk, undefined)
})

await check('the index stamp cannot be broken out of', () => {
  // Every config field is clamped to a boolean or a number, so no value can
  // carry markup into the page. The escaping is the belt to that braces: it
  // must hold even if a future field is a free string.
  writeFileSync(
    join(HOME, 'dsh-pet-liangzi.json'),
    JSON.stringify({ posX: '</script><script>alert(1)</script>' }),
    'utf8',
  )
  const html = taps[0]('<html><head></head><body>hi</body></html>')
  assert.ok(html.includes('window.DshPetLiangzi='), 'the boot payload is stamped')
  assert.ok(html.indexOf('window.DshPetLiangzi=') <= html.indexOf('</head>'), 'stamped into <head>')
  const match = /window\.DshPetLiangzi=([\s\S]*?);<\/script>/.exec(html)
  assert.ok(match, 'the payload is delimited by its own script tag')
  const payload = match[1]
  assert.ok(!payload.includes('<'), 'no raw angle bracket reaches the document')
  assert.doesNotThrow(() => JSON.parse(payload), 'the payload stays valid JSON')
  assert.equal(html.split('</head>')[0].includes('alert(1)'), false, 'the injected script is neutralised')
})

rmSync(HOME, { recursive: true, force: true })
console.log('\n' + String(passed) + ' checks passed' + (process.exitCode ? ' (with failures)' : ''))
