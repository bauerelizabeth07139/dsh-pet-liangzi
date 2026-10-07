/**
 * {{PET_NAME}} desktop pet ({{PET_NAME_EN}}) — browser half.
 *
 * A chibi 父亲 that lives in the Harness Web GUI: it stands on the
 * bottom edge of the window, breathes, wanders, can be picked up and dropped,
 * says things out loud, and — when its counterpart plugin is also installed —
 * links up with it for shared two-hander scenes.
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
    const PET_NAME = '{{PET_NAME}}'
    const SIBLING_ID = 'dafeiyu'
    const SIBLING_NAME = '大肥鱼'
    const ACCENT = '#4d6bfe'
    const LABEL = PET_NAME + ' 桌宠'

    const API = '/api/' + PKG + '/config'
    const DIAG_API = '/api/' + PKG + '/diag'
    const ASSET = '/api/' + PKG + '/asset/'
    const BGM_TRACK = 'liangzi'

    /** Sprite states, in the order the Host serves them. */
    const POSES = ['idle', 'happy', 'talk', 'sleep', 'surprise', 'wave']

    /** Spoken lines. Subtitles read from here; audio uses the same key. */
    const LINES = {"greet1": "我在。慢慢来，不着急。", "greet2": "又见面了。今天想聊点什么？", "idle1": "写代码这件事，急不得。想清楚了再动手，比什么都快。", "idle2": "上下文够长，人才敢把话说完。", "idle3": "别人问我累不累。我说，看着东西一点点长出来，就不累。", "idle4": "深夜的键盘声，是我听过最好听的动静。", "idle5": "别急着要结果，先把问题问对。", "idle6": "我那条小鱼啊，从小就爱问为什么。随我。", "click1": "嗯？有事？", "click2": "别戳了，我在这儿呢。", "click3": "怎么了，卡住了？把报错贴给我看看。", "click4": "深呼吸。天塌不下来。", "drag1": "哎，放我下来。", "drag2": "这把老骨头，经不起你这么折腾。", "sleep1": "我先眯一会儿，有事叫我。", "wake1": "唔，睡过头了？", "family1": "大肥鱼，别闹你爸。", "family2": "过来，站我旁边。", "family3": "她啊，吵是吵了点，但是真好。"}

    /** Situation -> the keys to pick from. */
    const GROUPS = {"greet": ["greet1", "greet2"], "idle": ["idle1", "idle2", "idle3", "idle4", "idle5", "idle6"], "click": ["click1", "click2", "click3", "click4"], "drag": ["drag1", "drag2"], "sleep": ["sleep1"], "wake": ["wake1"], "family": ["family1", "family2", "family3"]}

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

    /**
     * The pet's own styling. Only `--dsw-alias-*` theme tokens are referenced,
     * so the chrome follows light/dark like the rest of the shell while the
     * artwork keeps its own colours.
     */
    const PET_CSS = [
      '[data-dsh-pet]{font:inherit;color:var(--dsw-alias-label-primary,#e8e8ea)}',
      '.dsh-pet-bob{transform-origin:50% 100%;animation:dsh-pet-breathe 3.4s ease-in-out infinite}',
      '.dsh-pet-bob[data-pose="talk"]{animation:dsh-pet-talk .42s ease-in-out infinite}',
      '.dsh-pet-bob[data-pose="happy"]{animation:dsh-pet-hop .5s ease-in-out infinite}',
      '.dsh-pet-bob[data-pose="sleep"]{animation:dsh-pet-breathe 5.2s ease-in-out infinite}',
      '.dsh-pet-bob[data-pose="surprise"]{animation:dsh-pet-shake .32s ease-in-out 3}',
      '.dsh-pet-img{pointer-events:none;-webkit-user-drag:none}',
      '.dsh-pet-ground{position:absolute;left:50%;bottom:-4px;width:62%;height:12px;transform:translateX(-50%);'
        + 'border-radius:50%;background:radial-gradient(ellipse at center,rgba(0,0,0,.28),rgba(0,0,0,0) 70%);'
        + 'pointer-events:none}',
      '.dsh-pet-bubble{position:absolute;transform:translateX(-50%);padding:8px 12px;border-radius:12px;'
        + 'background:var(--dsw-alias-bg-layer-2,rgba(32,32,38,.95));color:var(--dsw-alias-label-primary,#f2f2f4);'
        + 'border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.35));'
        + 'box-shadow:0 6px 20px rgba(0,0,0,.28);font-size:13px;line-height:1.5;white-space:pre-wrap;'
        + 'pointer-events:none;animation:dsh-pet-pop .22s ease-out}',
      '.dsh-pet-tail{position:absolute;left:50%;bottom:-6px;width:12px;height:12px;margin-left:-6px;'
        + 'background:inherit;border-right:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.35));'
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
      '@keyframes dsh-pet-talk{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}',
      '@keyframes dsh-pet-hop{0%,100%{transform:translateY(0)}40%{transform:translateY(-10px)}}',
      '@keyframes dsh-pet-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}',
      '@keyframes dsh-pet-pop{from{opacity:0;transform:translateX(-50%) scale(.9)}to{opacity:1;transform:translateX(-50%) scale(1)}}',
      '@media (prefers-reduced-motion:reduce){.dsh-pet-bob,.dsh-pet-bubble{animation:none!important}}',
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
     * The pet's brain: position, state machine, speech queue and family link.
     *
     * Kept outside React so the animation-frame loop never re-renders the tree;
     * the React layer subscribes to whole-state snapshots instead.
     */
    function createPets(cfgIn) {
      const audio = createAudio()
      let cfg = clean(cfgIn)
      const view = {
        ready: false, x: 0, y: 18, facing: 1, pose: 'idle', bubble: null,
        linked: false, locked: false, partnerName: '',
        width: 220, height: 190, vw: 1280, vh: 800,
      }
      let state = { ...view }
      const listeners = new Set()
      let speechTimer = null
      let sleepTimer = null
      let chatterTimer = null
      let wanderTimer = null
      let raf = null
      let sleeping = false
      let lastLine = ''
      let family = null
      let disposed = false
      let started = false

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
        const height = clampNum(cfg.size, 90, 420, 190)
        view.height = height
        view.width = Math.round(height * 0.78)
      }

      function maxX() {
        return Math.max(0, view.vw - view.width)
      }

      function maxY() {
        return Math.max(0, Math.round(view.vh * 0.55))
      }

      function clampPosition() {
        view.x = Math.min(maxX(), Math.max(0, view.x))
        view.y = Math.min(maxY(), Math.max(0, view.y))
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

      /** Say one line: bubble, voice and mouth animation, all on the same cue. */
      function say(key) {
        const text = LINES[key]
        if (typeof text !== 'string') return
        lastLine = key
        view.bubble = cfg.bubble === 'true' ? { text } : null
        setPose('talk')
        if (cfg.voice === 'true') {
          audio.play('voice', key, clampNum(cfg.voiceVolume, 0, 100, 80) / 100)
        }
        window.clearTimeout(speechTimer)
        speechTimer = window.setTimeout(() => {
          if (disposed) return
          view.bubble = null
          setPose(restPose())
          notify()
        }, Math.max(1600, 700 + text.length * 190))
      }

      function sayFrom(groupKey) {
        const key = pick(GROUPS[groupKey], lastLine)
        if (key !== undefined) say(key)
      }

      function sfx(key) {
        if (cfg.sfx !== 'true') return
        audio.play('sfx', key, clampNum(cfg.sfxVolume, 0, 100, 60) / 100)
      }

      /** Idle chatter on a slow, irregular cadence so it never feels metronomic. */
      function scheduleChatter() {
        window.clearTimeout(chatterTimer)
        if (cfg.chatter !== 'true' || disposed) return
        chatterTimer = window.setTimeout(() => {
          if (disposed) return
          if (!sleeping && view.bubble === null) {
            if (cfg.link === 'true' && partnerPresent() && Math.random() < 0.45) {
              sayFrom('family')
              emitSay(lastLine)
            } else {
              sayFrom('idle')
            }
          }
          scheduleChatter()
        }, 26000 + Math.random() * 34000)
      }

      /** Doze off after a long quiet spell; the next interaction wakes it. */
      function scheduleSleep() {
        window.clearTimeout(sleepTimer)
        if (disposed) return
        sleepTimer = window.setTimeout(() => {
          if (disposed) return
          sleeping = true
          view.bubble = cfg.bubble === 'true' ? { text: LINES.sleep1 } : null
          setPose('sleep')
          if (cfg.voice === 'true') audio.play('voice', 'sleep1', clampNum(cfg.voiceVolume, 0, 100, 80) / 100)
          window.clearTimeout(speechTimer)
          speechTimer = window.setTimeout(() => {
            if (disposed) return
            view.bubble = null
            notify()
          }, 2600)
          notify()
        }, 150000)
      }

      function wake() {
        const wasAsleep = sleeping
        sleeping = false
        scheduleSleep()
        if (wasAsleep) {
          setPose('wave')
          window.setTimeout(() => {
            if (!disposed) say('wake1')
          }, 300)
        }
      }

      /** Walk to a new spot along the floor. */
      function wanderTo(targetX, duration) {
        window.clearTimeout(wanderTimer)
        const startedAt = performance.now()
        const fromX = view.x
        const span = targetX - fromX
        view.facing = span >= 0 ? 1 : -1
        notify()
        if (raf !== null) cancelAnimationFrame(raf)
        const step = (now) => {
          if (disposed) return
          const t = Math.min(1, (now - startedAt) / duration)
          const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
          view.x = fromX + span * eased
          notify()
          if (t < 1) raf = requestAnimationFrame(step)
          else raf = null
        }
        raf = requestAnimationFrame(step)
      }

      function scheduleWander() {
        window.clearTimeout(wanderTimer)
        if (cfg.wander !== 'true' || disposed) return
        wanderTimer = window.setTimeout(() => {
          if (disposed) return
          if (!sleeping && view.bubble === null && raf === null) {
            const target = Math.random() * maxX()
            wanderTo(target, Math.max(900, Math.abs(target - view.x) * 9))
            if (Math.random() < 0.3) sfx('pop')
          }
          scheduleWander()
        }, 9000 + Math.random() * 14000)
      }

      function react(kind) {
        if (disposed) return
        const back = () => {
          if (!disposed) setPose(restPose())
        }
        if (kind === 'happy') {
          setPose('happy')
          sfx('sparkle')
          window.setTimeout(back, 1400)
        } else if (kind === 'surprise') {
          setPose('surprise')
          sfx('pop')
          window.setTimeout(back, 1100)
        } else if (kind === 'wave') {
          setPose('wave')
          window.setTimeout(back, 1500)
        } else if (kind === 'heart') {
          setPose('happy')
          sfx('heart')
          window.setTimeout(back, 1600)
        }
      }

      /** Play a shared two-hander: one mixed track, both pets animated. */
      function playJoint(name) {
        const scene = JOINTS[name]
        if (scene === undefined || disposed) return
        window.clearTimeout(speechTimer)
        setPose('talk')
        if (cfg.bubble === 'true' && scene.cues.length > 0) {
          view.bubble = { text: '' }
          notify()
        }
        const cueTimers = scene.cues.map((cue) => window.setTimeout(() => {
          if (disposed) return
          if (cfg.bubble === 'true') view.bubble = { text: cue.mine ? cue.text : SIBLING_NAME + '：' + cue.text }
          setPose(cue.mine ? 'talk' : 'happy')
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

      /** Apply a new config; every channel reacts immediately, no reload. */
      function applyConfig(next) {
        const previous = cfg
        cfg = clean(next)
        measure()
        clampPosition()
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
          view.y = clampNum(cfg.posY, 0, 20000, 18)
          clampPosition()
          view.ready = true
          notify()
          window.setTimeout(() => {
            if (disposed) return
            say('greet1')
            react('wave')
          }, 700)
          scheduleChatter()
          scheduleSleep()
          scheduleWander()
        },

        click() {
          wake()
          setPose('surprise')
          sfx('click')
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
          sfx('click')
        },

        dragMove(x, y) {
          view.x = x
          view.y = y
          clampPosition()
          notify()
        },

        dragEnd() {
          sleeping = false
          scheduleSleep()
          sayFrom('drag')
          clampPosition()
          notify()
        },

        position: () => ({ x: view.x, y: view.y }),

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
          if (raf !== null) cancelAnimationFrame(raf)
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
       * its speech bubble, the hover toolbar and — while linked — this pet's
       * half of the bond line to its partner.
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
          reportDiag({ at: Date.now(), pet: PET_ID, mounted: true, client: 'v1' })
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
        const petCenterY = Math.round(state.vh - state.y - height * 0.45)
        const linked = state.linked && cfg.link === 'true'

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
          y1: petCenterY,
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
          title: LABEL + '（可拖动，单击互动）',
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
            bottom: String(Math.round(state.y)) + 'px',
            width: String(width) + 'px',
            height: String(height) + 'px',
            pointerEvents: 'auto',
            cursor: hover ? 'grab' : 'pointer',
            opacity: String(clampNum(cfg.opacity, 20, 100, 100) / 100),
            transform: 'scaleX(' + String(flip) + ')',
            transition: 'opacity .25s ease',
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
        h('div', { className: 'dsh-pet-ground', 'aria-hidden': 'true' })),

        // Speech bubble.
        state.bubble !== null && state.bubble.text !== '' ? h('div', {
          className: 'dsh-pet-bubble',
          'data-dsh-pet-bubble': PET_ID,
          style: {
            left: String(petCenterX) + 'px',
            bottom: String(Math.round(state.y + height - 4)) + 'px',
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
            bottom: String(Math.round(state.y + height + 10)) + 'px',
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
              bottom: String(Math.round(state.y + height + 48)) + 'px',
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
          rangeRow('size', '角色大小', '角色在屏幕上的高度', 90, 420, 'px'),
          rangeRow('opacity', '不透明度', '调低可以让角色更含蓄', 30, 100, '%'),
          boolRow('wander', '自动走动', '角色会自己在窗口底部散步'),
          boolRow('bubble', '对话气泡', '说话的时候在头顶显示字幕'),
          boolRow('chatter', '主动搭话', '每隔一段时间自己说一句话'),

          h('div', { className: 'dsh-pet-divider', key: 'sound' }, '声音'),
          boolRow('voice', '对话语音', '每句台词都有配音'),
          rangeRow('voiceVolume', '语音音量', '', 0, 100, '%'),
          boolRow('sfx', '音效', '点击、拖动、互动时的短音效'),
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
