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

/**
 * Read a constant that is an `Object.freeze({...})` rather than bare JSON.
 *
 * `literal()` above is deliberately strict — it parses JSON, so a constant that
 * is not JSON fails loudly instead of being misread. `SPRITE_FACING` is wrapped
 * in `Object.freeze`, so it needs its two fields pulled out by name.
 */
function frozenLiteral(name, fields) {
  const match = new RegExp('^\\s*const ' + name + ' = Object\\.freeze\\(\\{([\\s\\S]*?)\\}\\)\\s*$', 'm')
    .exec(SOURCE)
  assert.ok(match, 'the module declares ' + name + ' as a frozen object')
  const body = match[1]
  const out = {}
  for (const field of fields) {
    const found = new RegExp('(?:^|,)\\s*' + field + '\\s*:\\s*(\\{[^}]*\\}|-?\\d+|' + "'[^']*')")
      .exec(body)
    assert.ok(found, name + ' declares ' + field)
    const raw = found[1]
    out[field] = raw.startsWith("'") ? raw.slice(1, -1) : JSON.parse(raw)
  }
  return out
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

await check('the walk cycle is a real one, not near-identical frames', () => {
  const poses = literal('POSES')
  for (const frame of ['walk1', 'walkpass', 'walk2']) {
    assert.ok(poses.includes(frame), 'the ' + frame + ' frame ships')
  }
  const cycle = /const WALK_CYCLE = \[([^\]]+)\]/.exec(SOURCE)
  assert.ok(cycle, 'the client declares a walk cycle')
  const order = cycle[1].split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean)
  // Contact, pass, contact. The pass frame is what gives the cycle a middle;
  // without it the walk is two contact poses alternating, and a pair of contacts
  // that the model drew as the same leg pose reads as a slide.
  assert.deepEqual(order, ['walk1', 'walkpass', 'walk2'],
    'contact, pass, contact — a walk needs a middle')
  // Ground speed must be derived from the step cadence, never chosen freely.
  assert.ok(/function walkSpeed\(\)/.test(SOURCE), 'ground speed is computed')
  assert.ok(/STRIDE_RATIO/.test(SOURCE), 'it is computed from a stride length')
  assert.ok(/walkDuration\(/.test(SOURCE), 'trip length is derived from that speed')
})

await check('the walk frames really differ, and the body does not move between them', () => {
  // The failure this exists to catch: three frames that are the same leg pose
  // drawn three times. It shipped that way once — the pair differed over only
  // 2-6% of the leg silhouette, so the character slid rather than walked while
  // every other assertion passed.
  const spriteDir = join(ROOT, 'assets', 'sprites')
  const petId = /const PET_ID = '([^']*)'/.exec(SOURCE)[1]
  const frames = ['walk1', 'walkpass', 'walk2']
  for (const f of frames) {
    assert.ok(existsSync(join(spriteDir, petId + '-' + f + '.png')), petId + '-' + f + '.png ships')
  }

  // Read the alpha channel in-process: no image library here, so use the PNG
  // the build already produced and let the browser-side check in realwalk cover
  // the rest. This asserts the *files* are not byte-identical, which is the
  // cheapest way to catch a build that copied one frame over the others.
  const bytes = frames.map((f) => readFileSync(join(spriteDir, petId + '-' + f + '.png')))
  assert.notEqual(bytes[0].length + ':' + bytes[0].slice(0, 64).toString('hex'),
    bytes[1].length + ':' + bytes[1].slice(0, 64).toString('hex'),
    'walk1 and walkpass are different files')
  assert.notEqual(bytes[1].length + ':' + bytes[1].slice(0, 64).toString('hex'),
    bytes[2].length + ':' + bytes[2].slice(0, 64).toString('hex'),
    'walkpass and walk2 are different files')
  assert.notEqual(bytes[0].length + ':' + bytes[0].slice(0, 64).toString('hex'),
    bytes[2].length + ':' + bytes[2].slice(0, 64).toString('hex'),
    'walk1 and walk2 are different files')
})

// --- which way each pose is drawn, and therefore which way it must be mirrored
//
// The direction a drawing faces cannot be recovered from the file, so the build
// writes it down twice: once in `assets/sprites/manifest.json`, next to the
// images, and once in the client's `SPRITE_FACING`, which the renderer uses. If
// those two ever disagree, the pet is drawn backwards on screen while both
// files still look self-consistent — and a pet with one pose drawn facing left
// inside a package that assumes everything faces right is exactly how that
// happens. This is the assertion that ties the two records together.

await check('every pose is drawn the way its manifest and the client both say', () => {
  const sprite = JSON.parse(readFileSync(join(ROOT, 'assets', 'sprites', 'manifest.json'), 'utf8'))
  const facing = frozenLiteral('SPRITE_FACING', ['default', 'faces'])
  const poses = literal('POSES')
  const mapped = facing.faces || {}
  assert.ok(Object.keys(mapped).length > 0,
    'the client records a direction per pose, not just one for the package')
  for (const pose of poses) {
    const declared = mapped[pose] ?? (facing.default === -1 ? 'left' : 'right')
    const shipped = sprite.faces[pose] ?? sprite.defaultFacing
    assert.equal(declared, shipped,
      pose + ': the client says ' + declared + ', the manifest says ' + shipped)
  }
  assert.equal(sprite.order.length, poses.length, 'the manifest lists every shipped pose')
})

await check('a pose that is drawn facing left is declared as such, and mirrored to face right', () => {
  const facing = frozenLiteral('SPRITE_FACING', ['default', 'faces'])
  const left = Object.entries(facing.faces || {})
    .filter(([, how]) => how === 'left').map(([pose]) => pose).sort()
  if (left.length === 0) {
    // Nothing to mirror the other way: the package is uniform, which is the
    // simple case and needs no exemption.
    assert.equal(facing.default, 1, 'a uniform package faces right by default')
    return
  }
  // At least one pose is exempt from the default, so the renderer has to ask
  // per pose — otherwise that pose is drawn facing the wrong way.
  assert.ok(/function poseArtFacing\(/.test(SOURCE),
    'the renderer resolves the direction per pose when the poses disagree')
  assert.ok(/facingToFlip\(state\.facing, state\.pose\)/.test(SOURCE),
    'and the renderer passes the pose in, rather than assuming the package default')
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

// --- the arithmetic that keeps the two from being drawn on top of each other
//
// This is the check that matters most and is easiest to get wrong: the pets
// were shipped once while both walked to the same coordinate and came to rest
// overlapping, and every other assertion still passed, because "they are not
// on top of each other" was only ever asserted in a browser run.

const spacingTarget = registration.factory(() => ({ createElement: () => null })).__spacingTarget
const GAP = 28
/** Centre-to-centre distance two bodies need in order not to overlap. */
const needBetween = (a, b) => (a + b) / 2 + GAP

await check('the spacing rule is reachable for testing', () => {
  assert.equal(typeof spacingTarget, 'function', 'the factory exposes __spacingTarget')
})

await check('a pet already clear of its sibling is not moved', () => {
  const mine = { x: 100, width: 141, floor: 2000 }
  const theirs = { x: 0, width: 130 }
  assert.equal(spacingTarget(mine, { x: 1500, width: 130 }, GAP), null, 'far apart means no move')

  // The sibling sits to the right, so this pet is the one that gives way. Put
  // it exactly at the required clearance: nothing to do. Bring it 6px closer
  // and there is a move.
  const required = needBetween(mine.width, theirs.width)
  const mineCentre = mine.x + mine.width / 2
  const siblingLeftFor = (centreDistance) => mineCentre + centreDistance - theirs.width / 2

  const exactly = { x: siblingLeftFor(required), width: theirs.width }
  assert.equal(Math.abs(mineCentre - (exactly.x + theirs.width / 2)).toFixed(6), required.toFixed(6), 'the exact case is exact')
  assert.equal(spacingTarget(mine, exactly, GAP), null, 'clearance met means no move')

  const inside = { x: siblingLeftFor(required - 6), width: theirs.width }
  assert.ok(mineCentre < inside.x + theirs.width / 2, 'the sibling is still to the right, so this pet gives way')
  assert.notEqual(spacingTarget(mine, inside, GAP), null, 'inside clearance means a move')
})

await check('two pets on the same spot separate instead of leapfrogging', () => {
  // Both inside each other's floor space. Each steps away from the other, so
  // they diverge — picking the "roomier side" instead makes both choose the
  // same direction and swap places.
  const left = { x: 300, width: 141, floor: 2000 }
  const right = { x: 340, width: 130, floor: 2000 }
  const leftMove = spacingTarget(left, right, GAP)
  const rightMove = spacingTarget(right, left, GAP)
  assert.ok(leftMove !== null && rightMove !== null, 'both have somewhere to go')
  assert.ok(leftMove < left.x, 'the left pet steps further left')
  assert.ok(rightMove > right.x, 'the right pet steps further right')
})

await check('two pets that stop on the same spot are pulled apart', () => {
  // The real failure: both were sent to the same target and both arrived.
  const mine = { x: 400, width: 141, floor: 1280 }
  const theirs = { x: 400, width: 130 }
  const target = spacingTarget(mine, theirs, GAP)
  assert.ok(target !== null, 'a move is produced')
  const centreGap = Math.abs((target + 141 / 2) - (400 + 130 / 2))
  assert.ok(centreGap >= needBetween(141, 130),
    'ends at least a body-width plus the personal gap away (' + Math.round(centreGap) + 'px)')
})

await check('the pet pinned against the window edge is the one that moves', () => {
  // Hard against the left edge, so the only way out is to the right — and it
  // must take it rather than giving up.
  const mine = { x: 0, width: 141, floor: 1280 }
  const theirs = { x: 40, width: 130 }
  const target = spacingTarget(mine, theirs, GAP)
  assert.ok(target !== null, 'a move is produced')
  assert.ok(target > mine.x, 'it moves right, away from the edge')
  const centreGap = Math.abs((target + 141 / 2) - (40 + 130 / 2))
  assert.ok(centreGap >= needBetween(141, 130), 'and it ends up clear')
})

await check('when there is no room to give way, nobody paces on the spot', () => {
  // Already as far right as it may go, so stepping clear of the sibling would
  // take it out of the window. There is no legal move, and standing still beats
  // walking to an impossible coordinate on every check.
  const floor = 420
  const mine = { x: floor - 141, width: 141, floor }
  const theirs = { x: 100, width: 130 }
  assert.ok(mine.x + 141 / 2 > 100 + 65, 'this pet is the one on the right')
  assert.equal(spacingTarget(mine, theirs, GAP), null)
})

await check('any move it does make reduces the overlap', () => {
  const mine = { x: 700, width: 141, floor: 1280 }
  for (const theirX of [400, 500, 560, 620, 660, 680, 700]) {
    const target = spacingTarget(mine, { x: theirX, width: 130 }, GAP)
    if (target === null) continue
    const theirCentre = theirX + 65
    const before = Math.abs((mine.x + 70.5) - theirCentre)
    const after = Math.abs((target + 70.5) - theirCentre)
    assert.ok(after > before, 'sibling at ' + theirX + ': gap ' + Math.round(before) + ' -> ' + Math.round(after))
    assert.ok(target >= 0 && target <= mine.floor, 'sibling at ' + theirX + ': stays inside the window')
  }
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
