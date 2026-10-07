/**
 * Client-half checks. Loads the real browser module in a stubbed page, drives
 * the factory the shell would drive, and then reconciles the data baked into it
 * against the assets actually shipped in this package — the check that catches
 * a line with no recording, a scene with no track, or a pose with no sprite.
 *
 *   node test/client.test.mjs
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const PKG = 'dsh-pet-liangzi'
const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SOURCE = readFileSync(join(ROOT, 'lib', 'client.js'), 'utf8')

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

// --- load the module the way the browser module loader would ----------------

let registration = null
const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => {},
  performance: { now: () => 0 },
  Image: function Image() {},
  Audio: function Audio() {
    this.play = () => Promise.resolve()
    this.pause = () => {}
  },
  fetch: () => Promise.reject(new Error('offline')),
  document: { addEventListener() {}, removeEventListener() {}, visibilityState: 'visible' },
  CustomEvent: function CustomEvent(type, init) {
    this.type = type
    this.detail = init && init.detail
  },
}
sandbox.window = sandbox
sandbox.window.innerWidth = 1440
sandbox.window.innerHeight = 900
sandbox.window.addEventListener = () => {}
sandbox.window.removeEventListener = () => {}
sandbox.window.dispatchEvent = () => {}
sandbox.window.__ModuleLoader__ = {
  load(entry) {
    registration = entry
  },
}
vm.createContext(sandbox)
vm.runInContext(SOURCE, sandbox, { filename: 'client.js' })

// --- the data baked into the module ----------------------------------------

/** Pull one `const NAME = <json>` literal out of the module source. */
function literal(name) {
  const match = new RegExp('^\\s*const ' + name + ' = (.+)$', 'm').exec(SOURCE)
  assert.ok(match, 'the module declares ' + name)
  return JSON.parse(match[1])
}

console.log(PKG + ' client half')

await check('registers under the package name the loader row expects', () => {
  assert.ok(registration, 'window.__ModuleLoader__.load was called')
  assert.equal(registration.id, PKG, 'id matches package.json and cordis.patch.yml')
  assert.equal(typeof registration.factory, 'function')
})

await check('the factory returns the Cordis client plugin shape', () => {
  const plugin = registration.factory((id) => {
    assert.equal(id, 'react', 'only React is required from the module table')
    return { createElement: () => null }
  })
  assert.equal(plugin.name, PKG)
  assert.deepEqual([...plugin.inject], ['slots'])
  assert.equal(typeof plugin.apply, 'function')
})

await check('apply() renders into shell.overlay and adds a settings section', () => {
  const plugin = registration.factory(() => ({ createElement: () => null }))
  const injected = []
  const registered = []
  const ctx = {
    slots: {
      inject(owner, callback) {
        injected.push(owner)
        callback()
        return () => {}
      },
      register(options) {
        registered.push(options)
        return () => {}
      },
    },
  }
  const dispose = plugin.apply(ctx)
  assert.deepEqual(injected.sort(), ['settings.section', 'shell.overlay'])
  const overlay = registered.find((o) => o.name === 'shell.overlay')
  const settings = registered.find((o) => o.name === 'settings.section')
  assert.ok(overlay, 'the pet registers into shell.overlay')
  assert.equal(overlay.id, PKG)
  assert.equal(typeof overlay.order, 'number')
  assert.ok(settings, 'a settings section is registered')
  assert.ok(String(settings.label).length > 0, 'the section is labelled')
  assert.equal(typeof dispose, 'function', 'apply returns a disposer')
})

await check('every spoken line has a recording, and every recording a line', () => {
  const lines = literal('LINES')
  const keys = Object.keys(lines)
  assert.ok(keys.length >= 18, 'the pet has a real script, not a placeholder')
  const voiceDir = join(ROOT, 'assets', 'voice')
  const files = new Set(readdirSync(voiceDir).filter((f) => f.endsWith('.mp3')).map((f) => f.slice(0, -4)))
  for (const key of keys) {
    assert.ok(typeof lines[key] === 'string' && lines[key].length > 0, key + ' has text')
    assert.ok(files.has(key), key + ' has assets/voice/' + key + '.mp3')
    files.delete(key)
  }
  assert.equal(files.size, 0, 'no orphan recordings: ' + [...files].join(', '))
})

await check('every situation group points at real lines', () => {
  const lines = literal('LINES')
  const groups = literal('GROUPS')
  for (const [group, keys] of Object.entries(groups)) {
    assert.ok(Array.isArray(keys) && keys.length > 0, group + ' is non-empty')
    for (const key of keys) assert.ok(lines[key] !== undefined, group + ' -> ' + key + ' exists')
  }
  for (const required of ['greet', 'idle', 'click', 'drag', 'sleep', 'wake', 'family']) {
    assert.ok(groups[required] !== undefined, 'the ' + required + ' group exists')
  }
})

await check('every shared scene has a track, timings and attributed cues', () => {
  const joint = literal('JOINT')
  const scenes = Object.keys(joint)
  assert.ok(scenes.length >= 4, 'several father-and-daughter scenes ship (' + scenes.length + ')')
  const jointDir = join(ROOT, 'assets', 'joint')
  for (const scene of scenes) {
    assert.ok(existsSync(join(jointDir, scene + '.mp3')), scene + '.mp3 ships')
    const entry = joint[scene]
    assert.ok(entry.duration > 1000, scene + ' has a duration')
    assert.ok(entry.cues.length >= 3, scene + ' has timed cues')
    let mine = 0
    let theirs = 0
    let previous = -1
    for (const cue of entry.cues) {
      assert.ok(cue.start >= previous, scene + ' cues are ordered')
      previous = cue.start
      assert.ok(cue.text.length > 0, scene + ' cues carry text')
      if (cue.mine) mine += 1
      else theirs += 1
    }
    assert.ok(mine >= 1, scene + ' gives this pet something to say')
    assert.ok(theirs >= 1, scene + ' lets the partner speak too')
    assert.ok(entry.cues[entry.cues.length - 1].start < entry.duration, scene + ' cues fit the track')
  }
})

await check('every sprite state the client can ask for ships as a transparent PNG', () => {
  const dir = join(ROOT, 'assets', 'sprites')
  const files = readdirSync(dir)
  const poses = literal('POSES')
  assert.ok(poses.length >= 14, 'the character has a real animation set, not a stub')
  for (const required of ['idle', 'blink', 'walk1', 'walk2', 'talk', 'sleep']) {
    assert.ok(poses.includes(required), 'the client can reach the ' + required + ' state')
  }
  for (const pose of poses) {
    const name = 'liangzi-' + pose + '.png'
    assert.ok(files.includes(name), name + ' ships')
    const bytes = readFileSync(join(dir, name))
    assert.ok(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), name + ' is a PNG')
    assert.ok(bytes.includes(Buffer.from('tRNS')), name + ' carries an alpha channel')
  }
  assert.equal(files.filter((f) => f.endsWith('.png')).length, poses.length, 'no orphan sprites ship')
})

await check('every idle micro-scene references art and audio that ship', () => {
  const acts = literal('IDLE_ACTS')
  const poses = literal('POSES')
  const lines = literal('LINES')
  assert.ok(acts.length >= 4, 'the pet does several things on its own')
  const voiceDir = join(ROOT, 'assets', 'voice')
  for (const act of acts) {
    assert.ok(poses.includes(act.pose), 'the ' + act.pose + ' act has a sprite')
    assert.ok(typeof act.ms === 'number' && act.ms > 500, 'the ' + act.pose + ' act holds for a while')
    if (act.line !== undefined) {
      assert.ok(lines[act.line] !== undefined, act.line + ' is a scripted line')
      assert.ok(existsSync(join(voiceDir, act.line + '.mp3')), act.line + '.mp3 ships')
    }
  }
})

await check('the sound effects the client names all ship', () => {
  const named = ['pop', 'click', 'sparkle', 'heart', 'sleep', 'link']
  const dir = join(ROOT, 'assets', 'sfx')
  const files = new Set(readdirSync(dir).map((f) => f.replace(/\.mp3$/, '')))
  for (const key of named) {
    assert.ok(SOURCE.includes("'" + key + "'"), key + ' is used by the client')
    assert.ok(files.has(key), key + '.mp3 ships')
  }
})

await check('the background track the client asks for ships', () => {
  const match = /const BGM_TRACK = '([^']+)'/.exec(SOURCE)
  assert.ok(match, 'the client names a background track')
  assert.ok(existsSync(join(ROOT, 'assets', 'bgm', match[1] + '.mp3')), match[1] + '.mp3 ships')
})

await check('the walk cycle is a real one, not two near-identical frames', () => {
  const poses = literal('POSES')
  for (const frame of ['walk1', 'walk2']) {
    assert.ok(poses.includes(frame), 'the ' + frame + ' frame ships')
  }
  const cycle = /const WALK_CYCLE = \[([^\]]+)\]/.exec(SOURCE)
  assert.ok(cycle, 'the client declares a walk cycle')
  const order = cycle[1].split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean)
  assert.deepEqual(order, ['walk1', 'walk2'],
    'two contact frames, so the body cannot twist between them')
  // Ground speed must be derived from the step cadence, never chosen freely.
  assert.ok(/function walkSpeed\(\)/.test(SOURCE), 'ground speed is computed')
  assert.ok(/STRIDE_RATIO/.test(SOURCE), 'it is computed from a stride length')
  assert.ok(/walkDuration\(/.test(SOURCE), 'trip length is derived from that speed')
})

await check('the two pets can walk to each other and hand things over', () => {
  for (const method of ['approach()', 'gift(kind)', 'partnerBounds()', 'walkToX(', 'facePartner()']) {
    assert.ok(SOURCE.includes(method), 'the pet exposes ' + method)
  }
  assert.ok(SOURCE.includes("'family/approach'"), 'it asks its sibling to come over')
  assert.ok(SOURCE.includes("'family/gesture'"), 'and it can hand something across')
  // The bond line drawn towards the viewport centre was removed on request.
  assert.ok(!SOURCE.includes('strokeDasharray'), 'no dashed line is drawn to the middle')
})

await check('the plugin card icon is a small image inside the package', () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
  assert.ok(manifest.icon, 'package.json declares an icon')
  assert.ok(!manifest.icon.includes('..'), 'the icon path stays inside the package')
  const bytes = readFileSync(join(ROOT, manifest.icon))
  assert.ok(bytes.length <= 256 * 1024, 'the icon is under the 256 KiB card limit')
})

await check('the client names the character, rather than a template placeholder', () => {
  const name = /const PET_NAME = '([^']*)'/.exec(SOURCE)[1]
  assert.ok(name.length > 0, 'the character has a display name')
  assert.ok(!name.includes('{{'), 'the name was substituted at build time, not shipped raw')
  assert.ok(!/\{\{[A-Z_]+\}\}/.test(SOURCE), 'no template placeholder survives in the client')
  const label = /const LABEL = ([^\n]+)/.exec(SOURCE)[1]
  assert.ok(label.includes('PET_NAME'), 'the accessible label is built from that name')
})

await check('the client never reaches for a Harness Client package', () => {
  assert.ok(!SOURCE.includes("require('@deepseek-ai"), 'no Client package is required')
  assert.ok(!SOURCE.includes('document.body'), 'nothing is appended to document.body')
  assert.ok(SOURCE.includes("inject: ['slots']"), 'extension happens through slots')
})

rmSyncSafe()
function rmSyncSafe() {}

console.log('\n' + String(passed) + ' checks passed' + (process.exitCode ? ' (with failures)' : ''))
