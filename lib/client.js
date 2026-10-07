/**
 * 梁子 desktop pet (Liangzi) — browser half.
 *
 * A 父亲 that lives in the Harness Web GUI. It stands on the bottom
 * edge of the window, breathes, blinks, walks about with a real two-frame step
 * cycle, can be picked up and thrown, lands with a squash, turns to face the
 * pointer, does small things on its own, dozes off, says things out loud, and —
 * when its counterpart plugin is installed — links up with it for shared scenes.
 *
 * Shape: the official Client-package protocol. `window.__ModuleLoader__.load`
 * registers the module under the package name (which must equal `name` in
 * cordis.patch.yml), and the factory returns the usual
 * `{ name, inject, apply }` Cordis Client plugin.
 *
 * Where it draws: the `shell.overlay` list slot, which the app frame renders as
 * an absolutely positioned, `pointer-events:none` layer above the whole shell.
 * That layer's CSS re-enables pointer events on its direct children, so this
 * component renders one full-viewport root with inline `pointer-events:none`
 * and re-enables them on the character alone — clicks therefore reach the
 * Harness everywhere except on the pet.
 *
 * Everything the pet needs is served by the Host half from inside this package:
 * no network, no CDN, no build step.
 */
window.__ModuleLoader__.load({
  id: 'dsh-pet-liangzi',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement

    const PKG = 'dsh-pet-liangzi'
    const PET_ID = 'liangzi'
    const PET_NAME = '梁子'
    const SIBLING_ID = 'dafeiyu'
    const SIBLING_NAME = '大肥鱼'
    const ACCENT = '#4d6bfe'
    const LABEL = PET_NAME + ' 桌宠'

    const API = '/api/' + PKG + '/config'
    const DIAG_API = '/api/' + PKG + '/diag'
    const ASSET = '/api/' + PKG + '/asset/'
    const BGM_TRACK = 'liangzi'

    /** Every state this character was drawn in. */
    const POSES = ["idle", "blink", "walk1", "walk2", "happy", "cheer", "talk", "think", "love", "sad", "angry", "surprise", "sleep", "wave", "shh"]

    /** States a blink may interrupt — never mid-sentence or mid-jump. */
    const BLINKABLE = ['idle', 'walk1', 'walk2', 'think', 'love', 'sad', 'angry', 'basin', 'shh']

    /** Spoken lines. Subtitles read from here; audio uses the same key. */
    const LINES = {"greet1": "我在。慢慢来，不着急。", "greet2": "又见面了。今天想聊点什么？", "idle1": "写代码这件事，急不得。想清楚了再动手，比什么都快。", "idle2": "上下文够长，人才敢把话说完。", "idle3": "别人问我累不累。我说，看着东西一点点长出来，就不累。", "idle4": "深夜的键盘声，是我听过最好听的动静。", "idle5": "别急着要结果，先把问题问对。", "idle6": "我那条小鱼啊，从小就爱问为什么。随我。", "click1": "嗯？有事？", "click2": "别戳了，我在这儿呢。", "click3": "怎么了，卡住了？把报错贴给我看看。", "click4": "深呼吸。天塌不下来。", "drag1": "哎，放我下来。", "drag2": "这把老骨头，经不起你这么折腾。", "sleep1": "我先眯一会儿，有事叫我。", "wake1": "唔，睡过头了？", "family1": "大肥鱼，别闹你爸。", "family2": "过来，站我旁边。", "family3": "她啊，吵是吵了点，但是真好。", "shh1": "嘘，让它安静地想一会儿。", "think1": "让我想想。这个问题不难，只是要慢一点。", "cheer1": "好，就这么办。", "love1": "这丫头，随我。", "angry1": "别闹。"}

    /** Situation -> the keys to pick from. */
    const GROUPS = {"greet": ["greet1", "greet2"], "idle": ["idle1", "idle2", "idle3", "idle4", "idle5", "idle6"], "click": ["click1", "click2", "click3", "click4"], "drag": ["drag1", "drag2"], "sleep": ["sleep1"], "wake": ["wake1"], "family": ["family1", "family2", "family3"]}

    /**
     * Idle micro-scenes: rather than only ever standing and breathing, the pet
     * now and then does something by itself. Each entry is a pose, the line it
     * says, how long it holds, and an optional particle burst.
     */
    const IDLE_ACTS = [{"pose": "think", "line": "think1", "ms": 3000}, {"pose": "shh", "line": "shh1", "ms": 2600}, {"pose": "cheer", "line": "cheer1", "ms": 1800, "fx": "sparkle"}, {"pose": "love", "line": "love1", "ms": 2400, "fx": "heart"}, {"pose": "angry", "line": "angry1", "ms": 1700, "fx": "anger"}]

    /**
     * Two-hander scenes shared by both pets. `cues` carry millisecond timings
     * lifted from the mixed track's own subtitle stream, so each pet shows its
     * line exactly when that line is spoken. `mine` marks the cues this pet
     * speaks; on the partner's cues it turns and listens.
     */
    const JOINT = {"reunion": {"duration": 15180, "cues": [{"start": 320, "end": 3320, "text": "大肥鱼，又在人家屏幕上赖着不走？", "mine": true, "key": ""}, {"start": 4120, "end": 5120, "text": "才没有呢！", "mine": false, "key": ""}, {"start": 5640, "end": 7400, "text": "我在陪他写代码呀。", "mine": false, "key": ""}, {"start": 8160, "end": 11320, "text": "陪就好好陪，别把代码挡住了。", "mine": true, "key": ""}, {"start": 12000, "end": 15120, "text": "知道啦——那我坐这边，安安静静的。", "mine": false, "key": ""}]}, "goodnight": {"duration": 10600, "cues": [{"start": 440, "end": 2320, "text": "爸爸，今天也辛苦啦。", "mine": false, "key": ""}, {"start": 2880, "end": 3240, "text": "嗯。", "mine": true, "key": ""}, {"start": 3600, "end": 6880, "text": "你也早点睡，别又偷偷游到天亮。", "mine": true, "key": ""}, {"start": 7480, "end": 9600, "text": "好——那，晚安。", "mine": false, "key": ""}, {"start": 10120, "end": 10400, "text": "晚安。", "mine": false, "key": ""}]}, "cheer": {"duration": 13000, "cues": [{"start": 360, "end": 2760, "text": "爸爸你看，他今天写了这么多代码！", "mine": false, "key": ""}, {"start": 3760, "end": 4560, "text": "看见了。", "mine": true, "key": ""}, {"start": 5520, "end": 6400, "text": "做得不错。", "mine": true, "key": ""}, {"start": 7280, "end": 8880, "text": "那我们要不要给他鼓鼓掌？", "mine": false, "key": ""}, {"start": 9800, "end": 10360, "text": "鼓吧。", "mine": true, "key": ""}, {"start": 11240, "end": 12760, "text": "鼓完让他早点休息。", "mine": true, "key": ""}]}}

    /**
     * The family bus. Both pet plugins look for this object on `window`; the
     * first to load creates it and the second joins. It carries a protocol
     * number so a future revision degrades to "no partner" instead of throwing,
     * and it is the only thing the two packages share — neither imports,
     * requires, nor reaches into the other.
     */
    const FAMILY_KEY = '__DSH_PET_FAMILY__'
    const FAMILY_PROTOCOL = 1

    /** Where the pet's feet rest, in pixels above the bottom of the window. */
    const FLOOR = 18

    /** Downward acceleration while the pet is falling, in px/s². */
    const GRAVITY = 2600

    /** How long each particle kind lives, in ms. */
    const FX_LIFE = { heart: 1500, sparkle: 1200, zzz: 2200, sweat: 1100, note: 1600, rice: 1400, anger: 1100 }

    /** The glyph drawn for each burst. */
    const FX_GLYPH = { heart: '💗', sparkle: '✨', zzz: '💤', sweat: '💧', note: '🎵', rice: '🍚', anger: '💢' }

    /**
     * The pet's own styling. Only `--dsw-alias-*` theme tokens are referenced,
     * so the chrome follows light/dark like the rest of the shell while the
     * artwork keeps its own colours.
     */
    const PET_CSS = [
      '[data-dsh-pet]{font:inherit;color:var(--dsw-alias-label-primary,#e8e8ea)}',
      '.dsh-pet-bob{transform-origin:50% 100%;will-change:transform}',
      '.dsh-pet-bob[data-pose="idle"],.dsh-pet-bob[data-pose="blink"]{animation:dsh-pet-breathe 3.4s ease-in-out infinite}',
      '.dsh-pet-bob[data-pose="walk1"],.dsh-pet-bob[data-pose="walk2"]{animation:dsh-pet-step .3s ease-in-out infinite}',
      '.dsh-pet-bob[data-pose="talk"]{animation:dsh-pet-talk .34s ease-in-out infinite}',
      '.dsh-pet-bob[data-pose="happy"],.dsh-pet-bob[data-pose="love"]{animation:dsh-pet-hop .62s ease-in-out infinite}',
      '.dsh-pet-bob[data-pose="cheer"]{animation:dsh-pet-hop .44s ease-in-out infinite}',
      '.dsh-pet-bob[data-pose="sing"]{animation:dsh-pet-sway 1.1s ease-in-out infinite}',
      '.dsh-pet-bob[data-pose="sleep"]{animation:dsh-pet-breathe 5.2s ease-in-out infinite}',
      '.dsh-pet-bob[data-pose="surprise"]{animation:dsh-pet-shake .3s ease-in-out 3}',
      '.dsh-pet-bob[data-pose="angry"]{animation:dsh-pet-shake .16s ease-in-out 5}',
      '.dsh-pet-bob[data-pose="eat"]{animation:dsh-pet-nod .5s ease-in-out infinite}',
      '.dsh-pet-bob[data-pose="think"],.dsh-pet-bob[data-pose="shh"]{animation:dsh-pet-breathe 4.2s ease-in-out infinite}',
      '.dsh-pet-img{pointer-events:none;-webkit-user-drag:none}',
      '.dsh-pet-ground{position:absolute;left:50%;bottom:-4px;width:64%;height:13px;'
        + 'border-radius:50%;background:radial-gradient(ellipse at center,rgba(0,0,0,.3),rgba(0,0,0,0) 70%);'
        + 'pointer-events:none;transform-origin:50% 50%}',
      '.dsh-pet-bubble{position:absolute;transform:translateX(-50%);padding:8px 12px;border-radius:12px;'
        + 'background:var(--dsw-alias-bg-layer-2,rgba(32,32,38,.95));color:var(--dsw-alias-label-primary,#f2f2f4);'
        + 'border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.35));'
        + 'box-shadow:0 6px 20px rgba(0,0,0,.28);font-size:13px;line-height:1.5;white-space:pre-wrap;'
        + 'pointer-events:none;animation:dsh-pet-pop .22s ease-out}',
      '.dsh-pet-tail{position:absolute;left:50%;bottom:-6px;width:12px;height:12px;margin-left:-6px;'
        + 'border-right:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.35));'
        + 'border-bottom:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.35));'
        + 'background:var(--dsw-alias-bg-layer-2,rgba(32,32,38,.95));transform:rotate(45deg)}',
      '.dsh-pet-chip{width:28px;height:28px;margin:0 3px;border-radius:50%;cursor:pointer;font-size:14px;'
        + 'line-height:1;display:inline-flex;align-items:center;justify-content:center;'
        + 'border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.35));'
        + 'background:var(--dsw-alias-bg-layer-1,rgba(60,60,68,.92));color:inherit;opacity:.55;'
        + 'transition:opacity .15s ease,transform .15s ease}',
      '.dsh-pet-chip:hover{transform:translateY(-2px)}',
      '.dsh-pet-chip.is-on{opacity:1;border-color:' + ACCENT + ';box-shadow:0 0 0 1px ' + ACCENT + '55}',
      '.dsh-pet-unlock{position:absolute;padding:6px 12px;border-radius:999px;cursor:pointer;font-size:12px;'
        + 'background:var(--dsw-alias-bg-layer-2,rgba(32,32,38,.95));color:inherit;'
        + 'border:1px solid ' + ACCENT + ';box-shadow:0 4px 14px rgba(0,0,0,.25);white-space:nowrap}',
      '.dsh-pet-fx{position:absolute;pointer-events:none;font-size:18px;line-height:1;'
        + 'will-change:transform,opacity;animation:dsh-pet-fx-rise 1.4s ease-out forwards;'
        + 'filter:drop-shadow(0 2px 3px rgba(0,0,0,.25))}',
      '.dsh-pet-fx[data-kind="zzz"]{animation:dsh-pet-fx-drift 2.2s ease-out forwards;font-size:20px}',
      '.dsh-pet-fx[data-kind="rice"]{animation:dsh-pet-fx-fall 1.4s ease-in forwards}',
      '.dsh-pet-fx[data-kind="anger"]{animation:dsh-pet-fx-pop 1.1s ease-out forwards;font-size:22px}',
      '.dsh-pet-wrap{display:flex;flex-direction:column;gap:12px;max-width:640px}',
      '.dsh-pet-preview{display:flex;gap:14px;align-items:center}',
      '.dsh-pet-preview img{width:88px;height:88px;object-fit:contain;'
        + 'background:var(--dsw-alias-bg-layer-1,rgba(127,127,127,.08));border-radius:12px}',
      '.dsh-pet-preview p{margin:4px 0 0;font-size:12px;opacity:.7;max-width:420px;line-height:1.5}',
      '.dsh-pet-row{display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:30px}',
      '.dsh-pet-label{display:flex;flex-direction:column;gap:2px}',
      '.dsh-pet-hint{font-size:12px;opacity:.65}',
      '.dsh-pet-inline{display:flex;align-items:center;gap:8px}',
      '.dsh-pet-value{font-size:12px;opacity:.75;min-width:48px;text-align:right;font-variant-numeric:tabular-nums}',
      '.dsh-pet-range{width:190px;accent-color:' + ACCENT + '}',
      '.dsh-pet-divider{margin-top:6px;padding-top:10px;font-size:12px;font-weight:600;opacity:.6;'
        + 'border-top:1px solid var(--dsw-alias-border-l3,rgba(127,127,127,.2))}',
      '.dsh-pet-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:6px}',
      '.dsh-pet-btn{border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.35));'
        + 'background:var(--dsw-alias-bg-layer-1,rgba(127,127,127,.1));border-radius:8px;'
        + 'padding:6px 14px;cursor:pointer;font:inherit;color:inherit}',
      '.dsh-pet-btn-primary{background:' + ACCENT + ';border-color:' + ACCENT + ';color:#fff}',
      '.dsh-pet-status{font-size:12px;opacity:.8}',
      '@keyframes dsh-pet-breathe{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-3px) scaleY(1.015)}}',
      '@keyframes dsh-pet-step{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}',
      '@keyframes dsh-pet-talk{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-2px) scaleY(1.012)}}',
      '@keyframes dsh-pet-hop{0%,100%{transform:translateY(0)}40%{transform:translateY(-11px)}}',
      '@keyframes dsh-pet-sway{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}',
      '@keyframes dsh-pet-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}',
      '@keyframes dsh-pet-nod{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(3px) rotate(-2deg)}}',
      '@keyframes dsh-pet-pop{from{opacity:0;transform:translateX(-50%) scale(.9)}to{opacity:1;transform:translateX(-50%) scale(1)}}',
      '@keyframes dsh-pet-fx-rise{0%{opacity:0;transform:translate(-50%,0) scale(.5)}'
        + '22%{opacity:1;transform:translate(-50%,-12px) scale(1.1)}'
        + '100%{opacity:0;transform:translate(-50%,-72px) scale(.85)}}',
      '@keyframes dsh-pet-fx-drift{0%{opacity:0;transform:translate(-50%,0) scale(.6)}'
        + '25%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + 26px),-64px) scale(1)}}',
      '@keyframes dsh-pet-fx-fall{0%{opacity:0;transform:translate(-50%,-18px) scale(.7)}'
        + '20%{opacity:1}100%{opacity:0;transform:translate(-50%,34px) scale(1)}}',
      '@keyframes dsh-pet-fx-pop{0%{opacity:0;transform:translate(-50%,0) scale(.4) rotate(-12deg)}'
        + '30%{opacity:1;transform:translate(-50%,-6px) scale(1.25) rotate(6deg)}'
        + '100%{opacity:0;transform:translate(-50%,-26px) scale(.9) rotate(-4deg)}}',
      '@media (prefers-reduced-motion:reduce){.dsh-pet-bob,.dsh-pet-bubble,.dsh-pet-fx{animation:none!important}}',
    ].join('')

    /** The shape of a config on the wire: every field is a string. */
    function blank() {
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

    const KEYS = Object.keys(blank())

    /** Keep only known string fields; the Host clamps them. */
    function clean(input) {
      const out = blank()
      if (input === null || typeof input !== 'object') return out
      for (const key of KEYS) {
        const value = input[key]
        if (typeof value === 'string') out[key] = value
      }
      return out
    }

    function clampNum(value, min, max, fallback) {
      const parsed = Number.parseInt(value, 10)
      if (!Number.isFinite(parsed)) return fallback
      return Math.min(max, Math.max(min, parsed))
    }

    function pick(list, avoid) {
      if (!Array.isArray(list) || list.length === 0) return undefined
      if (list.length === 1) return list[0]
      for (let i = 0; i < 8; i += 1) {
        const candidate = list[Math.floor(Math.random() * list.length)]
        if (candidate !== avoid) return candidate
      }
      return list[0]
    }

    function has(pose) {
      return POSES.indexOf(pose) !== -1
    }

    /** Clamp a cue list; a malformed scene must never break the pet. */
    function normaliseJoint(raw) {
      const out = {}
      if (raw === null || typeof raw !== 'object') return out
      for (const key of Object.keys(raw)) {
        const entry = raw[key]
        if (entry === null || typeof entry !== 'object') continue
        const cues = Array.isArray(entry.cues) ? entry.cues : []
        out[key] = {
          duration: clampNum(entry.duration, 500, 600000, 12000),
          cues: cues
            .filter((cue) => cue !== null && typeof cue === 'object' && typeof cue.text === 'string')
            .map((cue) => ({
              start: clampNum(cue.start, 0, 600000, 0),
              end: clampNum(cue.end, 0, 600000, 0),
              text: cue.text,
              mine: cue.mine === true,
            })),
        }
      }
      return out
    }

    const JOINTS = normaliseJoint(JOINT)

    /**
     * Create the family bus, or join the one already on the page.
     *
     * @param descriptor - this pet's public face for its partner.
     * @returns `{ bus, partner, leave }`.
     */
    function joinFamily(descriptor) {
      const scope = typeof window === 'object' && window !== null ? window : null
      if (scope === null) return { bus: null, partner: undefined, leave: () => {} }
      let bus = scope[FAMILY_KEY]
      if (bus === null || typeof bus !== 'object' || bus.protocol !== FAMILY_PROTOCOL) {
        const listeners = new Map()
        bus = {
          protocol: FAMILY_PROTOCOL,
          pets: new Map(),
          on(type, handler) {
            if (!listeners.has(type)) listeners.set(type, new Set())
            listeners.get(type).add(handler)
            return () => {
              const set = listeners.get(type)
              if (set !== undefined) set.delete(handler)
            }
          },
          emit(type, detail) {
            const set = listeners.get(type)
            if (set === undefined) return
            for (const handler of Array.from(set)) {
              try {
                handler(detail)
              } catch (error) {
                console.error('[' + PET_ID + '] family listener failed:', error)
              }
            }
          },
        }
        scope[FAMILY_KEY] = bus
      }
      const partner = bus.pets.get(SIBLING_ID)
      bus.pets.set(PET_ID, descriptor)
      return {
        bus,
        partner,
        leave() {
          if (bus.pets.get(PET_ID) === descriptor) bus.pets.delete(PET_ID)
          bus.emit('pet/leave', descriptor)
        },
      }
    }

    /**
     * The audio engine: one reused <audio> per channel.
     *
     * Browsers refuse playback before the user has interacted with the page, so
     * every play() rejection is caught and flips `unlocked`; the layer then
     * offers a chip whose click unlocks audio for the session.
     */
    function createAudio() {
      let unlocked = false
      const channels = { voice: null, sfx: null, bgm: null }
      let bgmWanted = null

      function channel(name) {
        if (channels[name] === null) {
          const el = new Audio()
          el.preload = 'auto'
          channels[name] = el
        }
        return channels[name]
      }

      function srcFor(kind, key) {
        if (kind === 'voice') return ASSET + 'voice/' + key + '.mp3'
        if (kind === 'joint') return ASSET + 'joint/' + key + '.mp3'
        if (kind === 'bgm') return ASSET + 'bgm/' + key + '.mp3'
        return ASSET + 'sfx/' + key + '.mp3'
      }

      /** Play one clip. Resolves to the element, or null if it was blocked. */
      function play(kind, key, volume) {
        return new Promise((resolve) => {
          try {
            const name = kind === 'voice' || kind === 'joint' ? 'voice' : kind
            const el = channel(name)
            el.loop = kind === 'bgm'
            el.volume = Math.min(1, Math.max(0, volume))
            const src = srcFor(kind, key)
            if (!el.src || el.src.indexOf(src) === -1) el.src = src
            try {
              el.currentTime = 0
            } catch {
              /* not seekable yet — harmless */
            }
            const started = el.play()
            if (started === undefined || started === null) {
              unlocked = true
              resolve(el)
              return
            }
            started.then(
              () => {
                unlocked = true
                resolve(el)
              },
              () => {
                unlocked = false
                resolve(null)
              },
            )
          } catch (error) {
            console.error('[' + PET_ID + '] audio failed:', error)
            resolve(null)
          }
        })
      }

      function stop(name) {
        const el = channels[name]
        if (el !== null) {
          try {
            el.pause()
          } catch {
            /* already stopped */
          }
        }
      }

      return {
        play,
        stop,
        get unlocked() {
          return unlocked
        },
        set unlocked(value) {
          unlocked = value === true
        },
        /** Remember the wanted BGM track; re-applied on unlock and config change. */
        setBgm(key, volume) {
          if (key === null) {
            bgmWanted = null
            stop('bgm')
            return
          }
          bgmWanted = { key, volume }
          if (unlocked) play('bgm', key, volume)
        },
        resume() {
          if (bgmWanted !== null && unlocked) play('bgm', bgmWanted.key, bgmWanted.volume)
        },
        /** Background music pauses while the tab is hidden. */
        setPageVisible(visible) {
          if (bgmWanted === null) return
          if (visible && unlocked) play('bgm', bgmWanted.key, bgmWanted.volume)
          else stop('bgm')
        },
      }
    }

    /**
     * The pet's brain: physics, the animation state machine, the speech queue,
     * the particle bursts and the family link.
     *
     * Kept outside React so the animation-frame loop never re-renders the tree;
     * the React layer subscribes to whole-state snapshots instead.
     */
    function createPets(cfgIn) {
      const audio = createAudio()
      let cfg = clean(cfgIn)
      const view = {
        ready: false, x: 0, y: FLOOR, facing: 1, pose: 'idle', bubble: null,
        linked: false, locked: false, partnerName: '',
        width: 220, height: 190, vw: 1280, vh: 800,
        fx: [], tilt: 0, squash: 1, lift: 0, dragging: false,
      }
      let state = { ...view }
      const listeners = new Set()
      let speechTimer = null
      let sleepTimer = null
      let chatterTimer = null
      let wanderTimer = null
      let actTimer = null
      let blinkTimer = null
      let stepTimer = null
      let fxSeq = 0
      let raf = null
      let fallRaf = null
      let fallVy = 0
      let lastFall = 0
      let sleeping = false
      let busyUntil = 0
      let annoyedUntil = 0
      let lastLine = ''
      let family = null
      let disposed = false
      let started = false
      let clickTimes = []

      function snapshot() {
        view.locked = audio.unlocked === false
        state = { ...view }
        return state
      }

      function notify() {
        const next = snapshot()
        for (const listener of Array.from(listeners)) {
          try {
            listener(next)
          } catch (error) {
            console.error('[' + PET_ID + '] subscriber failed:', error)
          }
        }
      }

      function subscribe(listener) {
        listeners.add(listener)
        return () => listeners.delete(listener)
      }

      /** Measure the viewport so clamping and clamping-on-resize stay honest. */
      function measure() {
        if (typeof window === 'object' && window !== null) {
          view.vw = window.innerWidth || view.vw
          view.vh = window.innerHeight || view.vh
        }
        const height = clampNum(cfg.size, 90, 460, Number(blank().size))
        view.height = height
        view.width = Math.round(height * 0.74)
      }

      function maxX() {
        return Math.max(0, view.vw - view.width)
      }

      function maxY() {
        return Math.max(FLOOR, Math.round(view.vh * 0.62))
      }

      function clampPosition() {
        view.x = Math.min(maxX(), Math.max(0, view.x))
        view.y = Math.min(maxY(), Math.max(-40, view.y))
      }

      /** The default spot: the lower right of the window */
      function defaultX() {
        return Math.min(maxX(), Math.round(view.vw * 0.80) - Math.round(view.width / 2))
      }

      function setPose(pose) {
        if (view.pose !== pose) {
          view.pose = pose
          notify()
        }
      }

      function restPose() {
        return sleeping ? 'sleep' : 'idle'
      }

      /** True while a scripted pose owns the character. */
      function busy() {
        return Date.now() < busyUntil
      }

      // ---- particles ------------------------------------------------------

      function burst(kind, count) {
        if (typeof FX_LIFE[kind] !== 'number') return
        const now = Date.now()
        const total = count === undefined ? 1 : count
        for (let i = 0; i < total; i += 1) {
          fxSeq += 1
          view.fx.push({
            id: fxSeq,
            kind,
            // Jitter is a fraction of the pet's own width, so a burst scales
            // with the character rather than with the window.
            dx: (Math.random() - 0.5) * 1.1,
            dy: Math.random() * 0.35,
            delay: i * 110,
            until: now + FX_LIFE[kind] + i * 110 + 200,
          })
        }
        notify()
      }

      function reapFx() {
        const now = Date.now()
        if (view.fx.length === 0) return
        view.fx = view.fx.filter((item) => item.until > now)
        notify()
      }

      // ---- speech ---------------------------------------------------------

      /** Say one line: bubble, voice and a mouth animation on the same cue. */
      function say(key, hold) {
        const text = LINES[key]
        if (typeof text !== 'string') return
        lastLine = key
        view.bubble = cfg.bubble === 'true' ? { text } : null
        setPose('talk')
        if (cfg.voice === 'true') {
          audio.play('voice', key, clampNum(cfg.voiceVolume, 0, 100, 80) / 100)
        }
        const ms = hold === undefined ? Math.max(1600, 700 + text.length * 190) : hold
        busyUntil = Date.now() + ms
        window.clearTimeout(speechTimer)
        speechTimer = window.setTimeout(() => {
          if (disposed) return
          view.bubble = null
          setPose(restPose())
          notify()
        }, ms)
      }

      function sayFrom(groupKey) {
        const key = pick(GROUPS[groupKey], lastLine)
        if (key !== undefined) say(key)
      }

      function sfx(key) {
        if (cfg.sfx !== 'true') return
        audio.play('sfx', key, clampNum(cfg.sfxVolume, 0, 100, 60) / 100)
      }

      // ---- idle life ------------------------------------------------------

      /** Blink once if the current pose allows it, else come back shortly. */
      function blinkNow() {
        if (disposed) return
        const open = has('blink') && BLINKABLE.indexOf(view.pose) !== -1
          && !view.dragging && !busy()
        if (open) {
          setPose('blink')
          window.setTimeout(() => {
            if (!disposed && view.pose === 'blink') setPose(restPose())
          }, 120 + Math.random() * 90)
          scheduleBlink()
          return
        }
        // Blocked by a speech or a scene. Retrying the *check* — rather than
        // re-entering the scheduler — is what keeps a chatty pet blinking; a
        // full cycle here would push the next attempt seconds out every time.
        window.clearTimeout(blinkTimer)
        blinkTimer = window.setTimeout(blinkNow, 400 + Math.random() * 400)
      }

      /** Blink on an irregular cadence whenever the pose allows it. */
      function scheduleBlink() {
        window.clearTimeout(blinkTimer)
        if (disposed) return
        blinkTimer = window.setTimeout(blinkNow, 2200 + Math.random() * 4200)
      }

      /** Do something on its own now and then instead of only standing there. */
      function scheduleAct() {
        window.clearTimeout(actTimer)
        if (disposed) return
        actTimer = window.setTimeout(() => {
          if (disposed) return
          const free = cfg.acts === 'true' && !sleeping && !view.dragging
            && !busy() && raf === null
          if (free && IDLE_ACTS.length > 0 && Math.random() < 0.62) {
            const act = IDLE_ACTS[Math.floor(Math.random() * IDLE_ACTS.length)]
            if (act !== null && typeof act === 'object' && has(act.pose)) {
              setPose(act.pose)
              if (typeof act.fx === 'string') burst(act.fx, act.fx === 'sparkle' ? 4 : 2)
              if (typeof act.line === 'string') {
                say(act.line, act.ms)
                setPose(act.pose)
              } else {
                busyUntil = Date.now() + act.ms
                window.setTimeout(() => {
                  if (!disposed && !busy()) setPose(restPose())
                }, act.ms)
              }
            }
          }
          scheduleAct()
        }, 7000 + Math.random() * 12000)
      }

      /** Idle chatter on a slow, irregular cadence so it never feels metronomic. */
      function scheduleChatter() {
        window.clearTimeout(chatterTimer)
        if (cfg.chatter !== 'true' || disposed) return
        chatterTimer = window.setTimeout(() => {
          if (disposed) return
          if (!sleeping && !busy() && !view.dragging && raf === null) {
            if (cfg.link === 'true' && partnerPresent() && Math.random() < 0.45) {
              sayFrom('family')
              emitSay(lastLine)
            } else {
              sayFrom('idle')
            }
          }
          scheduleChatter()
        }, 30000 + Math.random() * 40000)
      }

      /** Doze off after a long quiet spell; the next interaction wakes it. */
      function scheduleSleep() {
        window.clearTimeout(sleepTimer)
        if (disposed) return
        sleepTimer = window.setTimeout(() => {
          if (disposed) return
          if (view.dragging || busy()) {
            scheduleSleep()
            return
          }
          sleeping = true
          view.bubble = cfg.bubble === 'true' ? { text: LINES.sleep1 } : null
          setPose('sleep')
          burst('zzz', 2)
          if (cfg.voice === 'true') audio.play('voice', 'sleep1', clampNum(cfg.voiceVolume, 0, 100, 80) / 100)
          window.clearTimeout(speechTimer)
          speechTimer = window.setTimeout(() => {
            if (disposed) return
            view.bubble = null
            notify()
          }, 2800)
          notify()
        }, 150000)
      }

      function wake() {
        const wasAsleep = sleeping
        sleeping = false
        scheduleSleep()
        if (wasAsleep) {
          setPose(has('wave') ? 'wave' : 'idle')
          window.setTimeout(() => {
            if (!disposed) say('wake1')
          }, 300)
        }
        return wasAsleep
      }

      // ---- movement -------------------------------------------------------

      /** Drive the two-frame step cycle for as long as the walk lasts. */
      function startSteps(stepMs) {
        window.clearInterval(stepTimer)
        stepTimer = null
        if (!has('walk1') || !has('walk2')) return
        let frame = 0
        stepTimer = window.setInterval(() => {
          if (disposed || raf === null) {
            window.clearInterval(stepTimer)
            stepTimer = null
            return
          }
          frame = 1 - frame
          setPose(frame === 0 ? 'walk1' : 'walk2')
        }, stepMs)
      }

      /** Walk to a new spot along the floor, with a step cycle and a facing flip. */
      function wanderTo(targetX, duration) {
        const startedAt = performance.now()
        const fromX = view.x
        const span = targetX - fromX
        view.facing = span >= 0 ? 1 : -1
        busyUntil = Math.max(busyUntil, startedAt + duration)
        notify()
        startSteps(Math.max(140, Math.min(300, Math.round(duration / Math.max(2, Math.abs(span) / 46)))))
        if (raf !== null) cancelAnimationFrame(raf)
        const step = (now) => {
          if (disposed) return
          const t = Math.min(1, (now - startedAt) / duration)
          const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
          view.x = fromX + span * eased
          notify()
          if (t < 1) raf = requestAnimationFrame(step)
          else {
            raf = null
            window.clearInterval(stepTimer)
            stepTimer = null
            setPose(restPose())
          }
        }
        raf = requestAnimationFrame(step)
      }

      function scheduleWander() {
        window.clearTimeout(wanderTimer)
        if (cfg.wander !== 'true' || disposed) return
        wanderTimer = window.setTimeout(() => {
          if (disposed) return
          if (!sleeping && !view.dragging && !busy() && raf === null) {
            const target = Math.random() * maxX()
            wanderTo(target, Math.max(900, Math.abs(target - view.x) * 9))
          }
          scheduleWander()
        }, 8000 + Math.random() * 13000)
      }

      /** Fall back to the floor under gravity, then squash on landing. */
      function startFall() {
        if (fallRaf !== null) cancelAnimationFrame(fallRaf)
        fallVy = 0
        lastFall = performance.now()
        const step = (now) => {
          if (disposed) return
          const dt = Math.min(0.05, (now - lastFall) / 1000)
          lastFall = now
          fallVy += GRAVITY * dt
          view.y -= fallVy * dt
          view.lift = Math.max(0, view.y - FLOOR)
          if (view.y <= FLOOR) {
            const hard = fallVy > 900
            view.y = FLOOR
            view.lift = 0
            view.tilt = 0
            fallRaf = null
            notify()
            // Landing squash, then a spring back to shape.
            view.squash = 0.84
            notify()
            window.setTimeout(() => {
              if (disposed) return
              view.squash = 1.06
              notify()
              window.setTimeout(() => {
                if (disposed) return
                view.squash = 1
                notify()
              }, 110)
            }, 90)
            sfx('pop')
            if (hard) burst('sparkle', 2)
            return
          }
          notify()
          fallRaf = requestAnimationFrame(step)
        }
        fallRaf = requestAnimationFrame(step)
      }

      // ---- reactions ------------------------------------------------------

      function react(kind) {
        if (disposed) return
        const back = () => {
          if (!disposed && !busy()) setPose(restPose())
        }
        if (kind === 'happy') {
          setPose(has('cheer') ? 'cheer' : 'happy')
          sfx('sparkle')
          burst('sparkle', 3)
          window.setTimeout(back, 1500)
        } else if (kind === 'surprise') {
          setPose('surprise')
          sfx('pop')
          burst('sweat', 1)
          window.setTimeout(back, 1100)
        } else if (kind === 'wave') {
          setPose(has('wave') ? 'wave' : 'idle')
          window.setTimeout(back, 1600)
        } else if (kind === 'heart') {
          setPose(has('love') ? 'love' : 'happy')
          sfx('heart')
          burst('heart', 4)
          window.setTimeout(back, 1800)
        } else if (kind === 'angry') {
          setPose(has('angry') ? 'angry' : 'surprise')
          sfx('pop')
          burst('anger', 2)
          window.setTimeout(back, 1400)
        }
      }

      /** Play a shared two-hander: one mixed track, both pets animated. */
      function playJoint(name) {
        const scene = JOINTS[name]
        if (scene === undefined || disposed) return
        window.clearTimeout(speechTimer)
        setPose('talk')
        busyUntil = Date.now() + scene.duration + 700
        if (cfg.bubble === 'true' && scene.cues.length > 0) {
          view.bubble = { text: '' }
          notify()
        }
        const cueTimers = scene.cues.map((cue) => window.setTimeout(() => {
          if (disposed) return
          if (cfg.bubble === 'true') view.bubble = { text: cue.mine ? cue.text : SIBLING_NAME + '：' + cue.text }
          setPose(cue.mine ? 'talk' : (has('happy') ? 'happy' : 'idle'))
          if (!cue.mine) burst('note', 1)
          notify()
        }, cue.start))
        if (cfg.voice === 'true') audio.play('joint', name, clampNum(cfg.voiceVolume, 0, 100, 80) / 100)
        speechTimer = window.setTimeout(() => {
          if (disposed) return
          for (const id of cueTimers) window.clearTimeout(id)
          view.bubble = null
          setPose(restPose())
          notify()
        }, Math.max(1200, scene.duration + 600))
      }

      function partnerPresent() {
        return family !== null && family.bus !== null && family.bus.pets.has(SIBLING_ID)
      }

      function emitSay(key) {
        if (family !== null && family.bus !== null) family.bus.emit('pet/say', { id: PET_ID, key })
      }

      /** Turn to face the pointer when it comes near, the way a pet would.
       *
       * Talking does not stop it looking at you, so this is deliberately not
       * gated on `busy()` — only on being asleep, held, or mid-stride.
       */
      function notePointer(x) {
        if (typeof x !== 'number') return
        if (view.dragging || sleeping || raf !== null) return
        const gap = x - (view.x + view.width / 2)
        if (Math.abs(gap) < 40 || Math.abs(gap) > 420) return
        const facing = gap > 0 ? 1 : -1
        if (facing !== view.facing) {
          view.facing = facing
          notify()
        }
      }

      // ---- config ---------------------------------------------------------

      /** Apply a new config; every channel reacts immediately, no reload. */
      function applyConfig(next) {
        const previous = cfg
        cfg = clean(next)
        measure()
        clampPosition()
        if (view.y < FLOOR) view.y = FLOOR
        if (cfg.bgm === 'true' && cfg.enabled === 'true') {
          audio.setBgm(BGM_TRACK, clampNum(cfg.bgmVolume, 0, 100, 35) / 100)
        } else {
          audio.setBgm(null, 0)
        }
        if (cfg.sfx !== 'true') audio.stop('sfx')
        if (cfg.voice !== 'true') audio.stop('voice')
        if (previous.chatter !== cfg.chatter) scheduleChatter()
        if (previous.wander !== cfg.wander) scheduleWander()
        notify()
      }

      const api = {
        subscribe,
        getState: () => state,
        applyConfig,
        playJoint,
        burst,

        /** The public face the sibling plugin sees over the family bus. */
        descriptor() {
          return {
            id: PET_ID,
            name: PET_NAME,
            role: 'father',
            api: {
              say(key) {
                if (typeof LINES[key] === 'string') say(key)
              },
              react,
              playJoint,
              burst,
              bounds: () => ({ x: view.x, y: view.y, width: view.width, height: view.height }),
              state: () => ({ pose: view.pose, sleeping }),
            },
          }
        },

        start() {
          if (started) return
          started = true
          measure()
          const raw = String(cfg.posX || '').trim()
          view.x = raw === '' ? defaultX() : clampNum(raw, 0, 20000, defaultX())
          view.y = Math.max(FLOOR, clampNum(cfg.posY, 0, 20000, FLOOR))
          clampPosition()
          view.ready = true
          notify()
          window.setTimeout(() => {
            if (disposed) return
            say('greet1')
            setPose(has('wave') ? 'wave' : 'idle')
            burst('sparkle', 4)
          }, 700)
          scheduleBlink()
          scheduleAct()
          scheduleChatter()
          scheduleSleep()
          scheduleWander()
        },

        click() {
          // A tap is a pointerdown/pointerup pair that never moved, so the drag
          // has to be released here as well. Leaving it set would strand the
          // pet as "held" for the rest of the session — no blinking, no
          // strolling, no idle acts — which is exactly the kind of silent
          // breakage that is invisible until you watch it for a minute.
          view.dragging = false
          view.tilt = 0
          const wasAsleep = wake()
          const now = Date.now()
          // Being poked while it is already cross does not make it more cross;
          // it just holds the sulk, which is what a real pet does.
          if (!wasAsleep && now < annoyedUntil) return
          clickTimes = clickTimes.filter((t) => now - t < 2600)
          clickTimes.push(now)
          if (!wasAsleep && clickTimes.length >= 3) {
            clickTimes = []
            annoyedUntil = now + 1800
            busyUntil = annoyedUntil
            react('angry')
            window.setTimeout(() => {
              if (!disposed) sayFrom('click')
            }, 620)
            return
          }
          setPose('surprise')
          sfx('click')
          burst('sweat', 1)
          window.setTimeout(() => {
            if (!disposed) sayFrom('click')
          }, 240)
        },

        dragStart() {
          wake()
          if (raf !== null) {
            cancelAnimationFrame(raf)
            raf = null
          }
          window.clearInterval(stepTimer)
          stepTimer = null
          if (fallRaf !== null) {
            cancelAnimationFrame(fallRaf)
            fallRaf = null
          }
          view.dragging = true
          view.bubble = null
          setPose('surprise')
          sfx('click')
        },

        dragMove(x, y) {
          const dx = x - view.x
          view.x = x
          view.y = y
          view.lift = Math.max(0, view.y - FLOOR)
          // Dangle against the direction of travel, the way a held toy would.
          view.tilt = Math.max(-14, Math.min(14, -dx * 1.6))
          clampPosition()
          notify()
        },

        dragEnd() {
          view.dragging = false
          sleeping = false
          scheduleSleep()
          clampPosition()
          if (view.y > FLOOR + 2) startFall()
          else {
            view.tilt = 0
            view.lift = 0
            notify()
          }
          sayFrom('drag')
        },

        position: () => ({ x: view.x, y: view.y }),
        notePointer,
        reapFx,

        unlock() {
          if (audio.unlocked) return
          audio.unlocked = true
          if (cfg.bgm === 'true') audio.setBgm(BGM_TRACK, clampNum(cfg.bgmVolume, 0, 100, 35) / 100)
          audio.resume()
          if (cfg.sfx === 'true') audio.play('sfx', 'link', clampNum(cfg.sfxVolume, 0, 100, 60) / 100)
          notify()
        },

        setPageVisible(visible) {
          audio.setPageVisible(visible)
        },

        /** Announce arrival and wire up the sibling if it is already here. */
        joinFamily() {
          family = joinFamily(api.descriptor())
          if (family.bus === null) return
          const adopt = (other) => {
            if (other === null || other === undefined || other.id !== SIBLING_ID || disposed) return
            view.linked = cfg.link === 'true'
            view.partnerName = other.name
            notify()
          }
          family.bus.on('pet/join', (other) => {
            const fresh = view.linked === false
            adopt(other)
            if (fresh && cfg.link === 'true' && other !== null && other.id === SIBLING_ID) {
              window.setTimeout(() => {
                if (disposed) return
                react('heart')
                playJoint(pick(Object.keys(JOINTS), null))
              }, 900)
            }
          })
          family.bus.on('pet/leave', (other) => {
            if (other === null || other === undefined || other.id !== SIBLING_ID) return
            view.linked = false
            view.partnerName = ''
            notify()
          })
          family.bus.on('pet/say', (detail) => {
            if (detail === null || detail === undefined || detail.id !== SIBLING_ID || disposed) return
            if (cfg.link === 'true') react('happy')
          })
          family.bus.on('family/sequence', (detail) => {
            if (detail === null || detail === undefined || typeof detail.name !== 'string') return
            if (cfg.link === 'true') playJoint(detail.name)
          })
          adopt(family.partner)
          family.bus.emit('pet/join', api.descriptor())
        },

        partnerPresent,
        emitSay,

        /** Start a shared scene for both pets. */
        startSequence() {
          const names = Object.keys(JOINTS)
          if (names.length === 0) return null
          const name = pick(names, null)
          api.unlock()
          playJoint(name)
          if (family !== null && family.bus !== null) family.bus.emit('family/sequence', { name })
          return name
        },

        dispose() {
          disposed = true
          window.clearTimeout(speechTimer)
          window.clearTimeout(sleepTimer)
          window.clearTimeout(chatterTimer)
          window.clearTimeout(wanderTimer)
          window.clearTimeout(actTimer)
          window.clearTimeout(blinkTimer)
          window.clearInterval(stepTimer)
          if (raf !== null) cancelAnimationFrame(raf)
          if (fallRaf !== null) cancelAnimationFrame(fallRaf)
          if (family !== null) family.leave()
          audio.stop('voice')
          audio.stop('sfx')
          audio.stop('bgm')
          listeners.clear()
        },
      }

      return api
    }

    /** Persist a config; resolves with the Host's sanitized echo, or null. */
    function saveConfig(next) {
      return fetch(API, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(next),
      })
        .then((res) => res.json())
        .then((raw) => clean(raw))
        .catch(() => null)
    }

    /** Tell the Host what the page actually did, so support needs no screenshot. */
    function reportDiag(payload) {
      try {
        fetch(DIAG_API, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {})
      } catch {
        /* diagnostics never break the plugin */
      }
    }

    function apply(ctx) {
      let controller = null
      const disposers = []

      /**
       * The overlay: a full-viewport, click-through root holding the character,
       * its speech bubble, its particle bursts, the hover toolbar and — while
       * linked — this pet's half of the bond line to its partner.
       */
      function PetLayer() {
        const [cfg, setCfg] = React.useState(() => {
          const boot = typeof window === 'object' && window !== null ? window.DshPetLiangzi : undefined
          return clean(boot !== null && boot !== undefined ? boot.config : null)
        })
        const [state, setState] = React.useState(null)
        const [hover, setHover] = React.useState(false)
        const dragRef = React.useRef(null)
        const rootRef = React.useRef(null)

        if (controller === null) controller = createPets(cfg)
        const ctl = controller

        React.useEffect(() => {
          const unsubscribe = ctl.subscribe(setState)
          ctl.applyConfig(cfg)
          ctl.start()
          ctl.joinFamily()
          reportDiag({ at: Date.now(), pet: PET_ID, mounted: true, client: 'v2' })
          return unsubscribe
        }, [ctl])

        React.useEffect(() => {
          ctl.applyConfig(cfg)
        }, [ctl, cfg])

        // Reconcile with the live file, then follow saves made elsewhere.
        React.useEffect(() => {
          let alive = true
          fetch(API)
            .then((res) => res.json())
            .then((raw) => {
              if (alive) setCfg(clean(raw))
            })
            .catch(() => {})
          const onSaved = (event) => {
            const detail = event === null || event === undefined ? null : event.detail
            if (detail !== null && typeof detail === 'object') setCfg(clean(detail))
          }
          window.addEventListener('dsh-pet-config:' + PKG, onSaved)
          return () => {
            alive = false
            window.removeEventListener('dsh-pet-config:' + PKG, onSaved)
          }
        }, [])

        // Preload every sprite so a state change never flashes an empty frame.
        React.useEffect(() => {
          for (const pose of POSES) {
            const img = new Image()
            img.src = ASSET + 'sprites/' + PET_ID + '-' + pose + '.png'
          }
        }, [])

        // Unlock audio on the first real gesture anywhere in the page.
        React.useEffect(() => {
          const unlock = () => ctl.unlock()
          window.addEventListener('pointerdown', unlock, { once: true, capture: true })
          window.addEventListener('keydown', unlock, { once: true, capture: true })
          return () => {
            window.removeEventListener('pointerdown', unlock, { capture: true })
            window.removeEventListener('keydown', unlock, { capture: true })
          }
        }, [ctl])

        // The pet turns towards a pointer that comes near it.
        React.useEffect(() => {
          const onMove = (event) => ctl.notePointer(event.clientX)
          window.addEventListener('pointermove', onMove, { passive: true })
          return () => window.removeEventListener('pointermove', onMove)
        }, [ctl])

        // Reap finished particles; the CSS animation has already faded them.
        React.useEffect(() => {
          const tick = window.setInterval(() => ctl.reapFx(), 400)
          return () => window.clearInterval(tick)
        }, [ctl])

        React.useEffect(() => {
          const onVisibility = () => ctl.setPageVisible(document.visibilityState === 'visible')
          document.addEventListener('visibilitychange', onVisibility)
          return () => document.removeEventListener('visibilitychange', onVisibility)
        }, [ctl])

        // Keep the pet inside the window when it is resized.
        React.useEffect(() => {
          const onResize = () => ctl.applyConfig(cfg)
          window.addEventListener('resize', onResize)
          return () => window.removeEventListener('resize', onResize)
        }, [ctl, cfg])

        const onPointerDown = React.useCallback((event) => {
          if (event.button !== undefined && event.button !== 0) return
          const at = ctl.position()
          dragRef.current = {
            id: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            originX: at.x,
            originY: at.y,
            moved: false,
          }
          ctl.dragStart()
          try {
            event.currentTarget.setPointerCapture(event.pointerId)
          } catch {
            /* capture is a nicety, not a requirement */
          }
        }, [ctl])

        const onPointerMove = React.useCallback((event) => {
          const drag = dragRef.current
          if (drag === null || drag.id !== event.pointerId) return
          const dx = event.clientX - drag.startX
          const dy = event.clientY - drag.startY
          if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true
          if (!drag.moved) return
          ctl.dragMove(drag.originX + dx, drag.originY - dy)
        }, [ctl])

        const onPointerUp = React.useCallback((event) => {
          const drag = dragRef.current
          if (drag === null || drag.id !== event.pointerId) return
          dragRef.current = null
          if (!drag.moved) {
            ctl.click()
            return
          }
          ctl.dragEnd()
          const at = ctl.position()
          setCfg((previous) => {
            const next = { ...previous, posX: String(Math.round(at.x)), posY: String(Math.round(at.y)) }
            saveConfig(next)
            return next
          })
        }, [ctl])

        if (state === null || cfg.enabled !== 'true') return null

        const width = state.width
        const height = state.height
        const flip = state.facing < 0 ? -1 : 1
        const petCenterX = Math.round(state.x + width / 2)
        const bottom = Math.round(state.y)
        const lift = Math.max(0, state.lift)
        const linked = state.linked && cfg.link === 'true'
        // An airborne pet casts a smaller, fainter shadow.
        const shadow = Math.max(0.35, 1 - lift / 320)

        return h('div', {
          ref: rootRef,
          'data-dsh-pet': PET_ID,
          style: { position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: 1 },
        },
        h('style', null, PET_CSS),

        // This pet's half of the bond line to its partner.
        linked ? h('svg', {
          'aria-hidden': 'true',
          width: '100%',
          height: '100%',
          style: { position: 'absolute', inset: '0', pointerEvents: 'none', overflow: 'visible' },
        },
        h('line', {
          x1: petCenterX,
          y1: Math.round(state.vh - bottom - height * 0.45),
          x2: Math.round(state.vw / 2),
          y2: Math.round(state.vh - 90),
          stroke: ACCENT,
          strokeWidth: 2,
          strokeDasharray: '6 8',
          strokeLinecap: 'round',
          opacity: 0.3,
        })) : null,

        // The character.
        h('div', {
          role: 'button',
          tabIndex: 0,
          'aria-label': LABEL,
          title: LABEL + '（可拖动，单击互动，连点三下会生气）',
          onPointerDown,
          onPointerMove,
          onPointerUp,
          onPointerCancel: onPointerUp,
          onMouseEnter: () => setHover(true),
          onMouseLeave: () => setHover(false),
          onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              ctl.click()
            }
          },
          style: {
            position: 'absolute',
            left: String(Math.round(state.x)) + 'px',
            bottom: String(bottom) + 'px',
            width: String(width) + 'px',
            height: String(height) + 'px',
            pointerEvents: 'auto',
            cursor: hover ? 'grab' : 'pointer',
            opacity: String(clampNum(cfg.opacity, 20, 100, 100) / 100),
            transform: 'scaleX(' + String(flip) + ') rotate(' + String(-state.tilt) + 'deg) '
              + 'scaleY(' + String(state.squash) + ')',
            transformOrigin: '50% 100%',
            transition: state.dragging ? 'none' : 'opacity .25s ease, transform .16s ease-out',
            touchAction: 'none',
            userSelect: 'none',
            outline: 'none',
          },
        },
        h('div', { className: 'dsh-pet-bob', 'data-pose': state.pose },
          h('img', {
            src: ASSET + 'sprites/' + PET_ID + '-' + state.pose + '.png',
            alt: PET_NAME,
            draggable: false,
            className: 'dsh-pet-img',
            style: {
              width: '100%', height: '100%', objectFit: 'contain', display: 'block',
              filter: 'drop-shadow(0 6px 12px rgba(0,0,0,.22))',
            },
          })),
        h('div', {
          className: 'dsh-pet-ground',
          'aria-hidden': 'true',
          style: {
            opacity: String(shadow.toFixed(2)),
            transform: 'translateX(-50%) scale(' + shadow.toFixed(2) + ')',
          },
        })),

        // Particle bursts, positioned over the character's head.
        ...state.fx.map((item) => h('span', {
          key: 'fx' + String(item.id),
          className: 'dsh-pet-fx',
          'data-kind': item.kind,
          'data-dsh-pet-fx': PET_ID,
          'aria-hidden': 'true',
          style: {
            left: String(Math.round(petCenterX + item.dx * width)) + 'px',
            bottom: String(Math.round(bottom + height * (0.72 + item.dy))) + 'px',
            animationDelay: String(item.delay) + 'ms',
          },
        }, FX_GLYPH[item.kind])),

        // Speech bubble.
        state.bubble !== null && state.bubble.text !== '' ? h('div', {
          className: 'dsh-pet-bubble',
          'data-dsh-pet-bubble': PET_ID,
          style: {
            left: String(petCenterX) + 'px',
            bottom: String(Math.round(bottom + height - 4)) + 'px',
            maxWidth: '260px',
          },
        }, h('span', null, state.bubble.text),
        h('i', { className: 'dsh-pet-tail', 'aria-hidden': 'true' })) : null,

        // Hover toolbar: the four switches people actually reach for.
        hover ? h('div', {
          'data-dsh-pet-bar': PET_ID,
          style: {
            position: 'absolute',
            left: String(petCenterX) + 'px',
            bottom: String(Math.round(bottom + height + 10)) + 'px',
            transform: 'translateX(-50%)',
            pointerEvents: 'auto',
            whiteSpace: 'nowrap',
          },
        }, ...[
          ['voice', '🔊', '对话语音'],
          ['sfx', '🎵', '音效'],
          ['bgm', '🎼', '背景音乐'],
          ['bubble', '💬', '对话气泡'],
        ].map(([key, icon, label]) => h('button', {
          key,
          type: 'button',
          title: label + (cfg[key] === 'true' ? '：开' : '：关'),
          'aria-pressed': cfg[key] === 'true',
          'aria-label': label,
          className: 'dsh-pet-chip' + (cfg[key] === 'true' ? ' is-on' : ''),
          onPointerDown: (event) => event.stopPropagation(),
          onClick: (event) => {
            event.stopPropagation()
            setCfg((previous) => {
              const next = { ...previous, [key]: previous[key] === 'true' ? 'false' : 'true' }
              saveConfig(next).then((saved) => {
                if (saved !== null) {
                  window.dispatchEvent(new CustomEvent('dsh-pet-config:' + PKG, { detail: saved }))
                }
              })
              return next
            })
          },
        }, icon))) : null,

        // First-gesture hint for the browser autoplay policy.
        state.locked && (cfg.voice === 'true' || cfg.sfx === 'true' || cfg.bgm === 'true')
          ? h('button', {
            type: 'button',
            className: 'dsh-pet-unlock',
            onClick: () => ctl.unlock(),
            style: {
              left: String(Math.max(8, Math.min(petCenterX - 70, state.vw - 180))) + 'px',
              bottom: String(Math.round(bottom + height + 48)) + 'px',
              pointerEvents: 'auto',
            },
          }, '🔈 点一下开启声音') : null)
      }

      /** Settings → 桌宠 · 梁子: every switch, applied instantly. */
      function SettingsSection() {
        const [form, setForm] = React.useState(null)
        const [status, setStatus] = React.useState('')

        React.useEffect(() => {
          let alive = true
          fetch(API)
            .then((res) => res.json())
            .then((raw) => {
              if (alive) setForm(clean(raw))
            })
            .catch(() => {
              if (alive) setForm(blank())
            })
          return () => {
            alive = false
          }
        }, [])

        if (form === null) return h('div', { className: 'dsh-pet-wrap' }, '加载中…')

        const update = (key, value) => setForm(Object.assign({}, form, { [key]: value }))
        const commit = (next, message) => {
          setForm(next)
          saveConfig(next).then((saved) => {
            if (saved === null) {
              setStatus('保存失败，请重试')
              return
            }
            window.dispatchEvent(new CustomEvent('dsh-pet-config:' + PKG, { detail: saved }))
            setStatus(message)
          })
        }

        const boolRow = (key, label, hint) =>
          h('div', { className: 'dsh-pet-row', key },
            h('label', { className: 'dsh-pet-label' },
              h('span', null, label),
              h('span', { className: 'dsh-pet-hint' }, hint)),
            h('input', {
              type: 'checkbox',
              role: 'switch',
              'aria-checked': form[key] === 'true',
              'aria-label': label,
              checked: form[key] === 'true',
              onChange: (event) => update(key, event.target.checked ? 'true' : 'false'),
            }))

        const rangeRow = (key, label, hint, min, max, suffix) =>
          h('div', { className: 'dsh-pet-row', key },
            h('label', { className: 'dsh-pet-label' },
              h('span', null, label),
              h('span', { className: 'dsh-pet-hint' }, hint)),
            h('div', { className: 'dsh-pet-inline' },
              h('input', {
                className: 'dsh-pet-range',
                type: 'range',
                min: String(min),
                max: String(max),
                'aria-label': label,
                value: String(clampNum(form[key], min, max, min)),
                onChange: (event) => update(key, event.target.value),
              }),
              h('span', { className: 'dsh-pet-value' },
                String(clampNum(form[key], min, max, min)) + suffix)))

        return h('div', { className: 'dsh-pet-wrap' },
          h('style', null, PET_CSS),
          h('div', { className: 'dsh-pet-preview' },
            h('img', { src: ASSET + 'sprites/' + PET_ID + '-idle.png', alt: PET_NAME }),
            h('div', null,
              h('strong', null, PET_NAME + ' · 桌宠 · 梁子'),
              h('p', { className: 'dsh-pet-hint' }, 'DeepSeek 创始人的动漫化身，沉稳可靠的父亲。会走动、会说话、能拖动；和「大肥鱼」同时安装时，父女俩会打招呼、搭话，还能演一段小剧场。'))),

          boolRow('enabled', '显示桌宠', '关掉后角色从界面上消失，其它设置保留'),
          rangeRow('size', '角色大小', '角色在屏幕上的高度', 90, 460, 'px'),
          rangeRow('opacity', '不透明度', '调低可以让角色更含蓄', 30, 100, '%'),
          boolRow('wander', '自动走动', '会自己在窗口底部散步，走路是两帧的迈步动作'),
          boolRow('acts', '小动作', '会自己发呆、思考、比心、欢呼、耍脾气，还有这一角色专属的动作'),
          boolRow('bubble', '对话气泡', '说话的时候在头顶显示字幕'),
          boolRow('chatter', '主动搭话', '每隔一段时间自己说一句话'),

          h('div', { className: 'dsh-pet-divider', key: 'sound' }, '声音'),
          boolRow('voice', '对话语音', '每句台词都有配音'),
          rangeRow('voiceVolume', '语音音量', '', 0, 100, '%'),
          boolRow('sfx', '音效', '点击、拖动、落地、互动时的短音效'),
          rangeRow('sfxVolume', '音效音量', '', 0, 100, '%'),
          boolRow('bgm', '背景音乐', '循环播放的纯音乐，切到后台自动暂停'),
          rangeRow('bgmVolume', '音乐音量', '', 0, 100, '%'),

          h('div', { className: 'dsh-pet-divider', key: 'family' }, '联动'),
          boolRow('link', '与' + SIBLING_NAME + '联动',
            '同时安装两个桌宠时，它们会打招呼、互相搭话，还能一起演一段小剧场'),

          h('div', { className: 'dsh-pet-actions' },
            h('button', {
              type: 'button',
              className: 'dsh-pet-btn dsh-pet-btn-primary',
              onClick: () => commit(form, '已保存并应用 ✔'),
            }, '保存并应用'),
            h('button', {
              type: 'button',
              className: 'dsh-pet-btn',
              onClick: () => {
                if (controller === null) {
                  setStatus('桌宠还没加载完成')
                  return
                }
                const name = controller.startSequence()
                setStatus(name === null ? '暂无可演出的小剧场' : '正在演出：' + name)
              },
            }, '演一段父女小剧场'),
            h('button', {
              type: 'button',
              className: 'dsh-pet-btn',
              onClick: () => commit(blank(), '已恢复默认 ✔'),
            }, '恢复默认'),
            status !== '' ? h('span', { className: 'dsh-pet-status' }, status) : null))
      }

      try {
        disposers.push(ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: PKG,
          order: 50,
        }, PetLayer)))
        disposers.push(ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: PKG,
          order: 93,
          label: '桌宠 · 梁子',
        }, SettingsSection)))
      } catch (error) {
        console.error('[' + PKG + '] registration failed:', error)
      }

      return () => {
        for (const dispose of disposers) {
          try {
            dispose()
          } catch {
            /* double dispose is harmless */
          }
        }
        if (controller !== null) controller.dispose()
        controller = null
      }
    }

    return { name: PKG, inject: ['slots'], apply }
  },
})
