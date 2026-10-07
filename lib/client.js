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
    const LINES = {"greet1": "我在。你慢慢来，不着急。", "greet2": "来了啊。坐。", "greet3": "饮茶先啦，做完这一段再说。", "idle1": "我们不是有意成为一条鲶鱼，只是不小心成了一条鲶鱼。", "idle2": "创新首先是一个信念问题。首先是敢。", "idle3": "所有的套路，都是上一代的产物。", "idle4": "不贴钱，也不赚暴利。成本之上，稍微有一点利润，就够了。", "idle5": "开源不是一个商业行为，它更像一个文化行为。给予，其实是一种额外的荣誉。", "idle6": "一件激动人心的事，不能单纯用钱衡量。就像家里买钢琴，买得起是一回事，得有一群急着上去弹的人。", "idle7": "闭源形成的护城河，是短暂的。", "idle8": "我们没有 KPI。你要问我这个季度要做什么，我只能说，把那个问题解掉。", "idle9": "我们只是还需要一堆事实，和一个过程。", "idle10": "深夜的键盘声，是我听过最好听的动静。", "click1": "嗯？有事？", "click2": "别戳了。我在这儿。", "click3": "卡住了？把报错贴过来，我看一眼。", "click4": "深呼吸。天塌不下来。", "click5": "你走先，我把这段跑完。", "drag1": "哎，放我下来。", "drag2": "一把年纪了，经不起你这么折腾。", "sleep1": "我先眯一阵。有事叫我。", "wake1": "唔，睡过头了？", "shh1": "嘘，让它安安静静想一会儿。", "think1": "让我想想。这个问题不难，只是要慢一点。", "cheer1": "好。就这么办。", "love1": "这丫头，随我。", "angry1": "别闹。", "lore1": "他们给我做了个滑块，三十一档。最低那档，叫小难梁。", "lore2": "我没生气。做得挺用心的。", "lore3": "梁性循环。念起来跟良性循环一样，只差一个字。", "lore4": "钱不是问题。从来不是。", "lore5": "有一年全世界都在找我。我在吴川，跟老同学踢球。球踢赢了。", "family1": "大肥鱼，别闹你爸。", "family2": "过来，站我旁边。", "family3": "她啊，吵是吵了点，但是真好。", "family4": "盆呢？", "family5": "你这不叫吃饭，你叫吃账单。", "scene_rice_1": "……依赖环境呢。", "scene_slider_1": "往下拖一格。", "scene_slider_2": "就这档。", "scene_logo_1": "你看这个，是什么。", "scene_price_1": "价格是我定的。", "scene_price_2": "我知道。", "scene_price_3": "嗯。"}

    /** Situation -> the keys to pick from. */
    const GROUPS = {"greet": ["greet1", "greet2", "greet3"], "idle": ["idle1", "idle2", "idle3", "idle4", "idle5", "idle6", "idle7", "idle8", "idle9", "idle10", "lore1", "lore2"], "click": ["click1", "click2", "click3", "click4", "click5", "lore3", "lore4", "lore5"], "drag": ["drag1", "drag2"], "sleep": ["sleep1"], "wake": ["wake1"], "family": ["family1", "family2", "family3", "family4", "family5"]}

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
    const JOINT = {"rice": {"duration": 9800, "cues": [{"start": 80, "end": 2160, "text": "我去吃饭，测完告诉我就行！", "mine": false, "key": ""}, {"start": 2160, "end": 6880, "text": "……依赖环境呢。", "mine": true, "key": ""}, {"start": 7760, "end": 8320, "text": "算了。", "mine": true, "key": ""}, {"start": 9160, "end": 9760, "text": "我装。", "mine": true, "key": ""}]}, "slider": {"duration": 8800, "cues": [{"start": 360, "end": 1080, "text": "小难梁！", "mine": false, "key": ""}, {"start": 1480, "end": 1840, "text": "牢梁！", "mine": false, "key": ""}, {"start": 2120, "end": 2520, "text": "梁子！", "mine": false, "key": ""}, {"start": 2640, "end": 3000, "text": "梁圣！", "mine": false, "key": ""}, {"start": 3200, "end": 3720, "text": "梁神！", "mine": false, "key": ""}, {"start": 4640, "end": 7360, "text": "梁祖——往下拖一格。", "mine": false, "key": ""}, {"start": 7360, "end": 8040, "text": "……梁子。", "mine": false, "key": ""}, {"start": 8120, "end": 8760, "text": "就这档。", "mine": true, "key": "scene_slider_2"}]}, "logo": {"duration": 9380, "cues": [{"start": 360, "end": 2520, "text": "你看这个，是什么。", "mine": true, "key": ""}, {"start": 3400, "end": 5200, "text": "是一条蓝色大肥鱼。", "mine": false, "key": ""}, {"start": 5880, "end": 6960, "text": "很可爱的那种。", "mine": false, "key": ""}, {"start": 7840, "end": 8200, "text": "嗯。", "mine": true, "key": ""}]}, "price": {"duration": 11100, "cues": [{"start": 2400, "end": 4200, "text": "可是他们在骂我贵。", "mine": false, "key": ""}, {"start": 5160, "end": 6880, "text": "价格是我定的。", "mine": true, "key": "scene_price_1"}, {"start": 6880, "end": 9440, "text": "……你还是涨了。", "mine": false, "key": ""}, {"start": 10040, "end": 10600, "text": "我知道。", "mine": true, "key": "scene_price_2"}]}, "goodnight": {"duration": 9880, "cues": [{"start": 440, "end": 2160, "text": "爸爸，今天也辛苦啦。", "mine": false, "key": ""}, {"start": 2680, "end": 3000, "text": "嗯。", "mine": true, "key": ""}, {"start": 3640, "end": 6560, "text": "你也早点睡，别又偷偷游到天亮。", "mine": true, "key": ""}, {"start": 7040, "end": 9160, "text": "好——那，晚安。", "mine": false, "key": ""}, {"start": 9440, "end": 9720, "text": "晚安。", "mine": false, "key": ""}]}, "cheer": {"duration": 13380, "cues": [{"start": 320, "end": 2880, "text": "爸爸你看，他今天写了这么多代码！", "mine": false, "key": ""}, {"start": 3840, "end": 4640, "text": "看见了。", "mine": true, "key": ""}, {"start": 5240, "end": 6120, "text": "做得不错。", "mine": true, "key": ""}, {"start": 7800, "end": 9440, "text": "那我们要不要给他鼓鼓掌？", "mine": false, "key": ""}, {"start": 10520, "end": 11040, "text": "鼓吧。", "mine": true, "key": ""}, {"start": 11800, "end": 13320, "text": "鼓完让他早点休息。", "mine": true, "key": ""}]}}

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

    /**
     * The walk cycle, in the order the frames are drawn.
     *
     * Two contact poses, alternating: right foot forward, left foot forward.
     * There is deliberately no "passing" frame between them.
     *
     * A pass frame is the textbook way to draw a walk, and it was tried three
     * times — generated afresh, then drawn image-to-image from a contact frame
     * with everything but the legs forbidden to change. Each time the model
     * turned the torso a good 25° further towards the camera than the frames on
     * either side of it. Rather than the legs swinging, the whole body then
     * rotated towards the viewer and back once per step, which reads as the
     * character swaying left and right as it walks — far worse than a missing
     * pass frame. Two contact frames cannot disagree about which way the body
     * is facing, because they are drawn from the same angle.
     */
    const WALK_CYCLE = ['walk1', 'walk2']
    /**
     * How long each frame is held. A step is one frame, so the ground speed is
     * `stride / STEP_MS` — this value is what keeps that at a walking pace.
     */
    const STEP_MS = 330
    const STEPS_PER_CYCLE = 2
    /**
     * How far one step carries the character, as a fraction of the sprite
     * *canvas* — not of the drawn figure inside it.
     *
     * This number is measured off the artwork by `measure_stride.py`, which
     * finds the horizontal spread of the feet in the two contact frames. The
     * distinction matters more than it looks: the figures only fill about 71%
     * of their canvas, so expressing the stride against the figure instead of
     * the canvas makes the pet travel 1.4× further per step than its own legs
     * do, and it skates — with every frame correctly drawn.
     */
    const STRIDE_RATIO = 0.177

    /** How long one gift exchange may take, and how often one may start. */
    const GIFT_COOLDOWN_MS = 2500
    /**
     * Hard ceiling on live particles.
     *
     * Nothing should ever reach this — every burst is small and short-lived —
     * but a particle list that only ever shrinks on a timer is one runaway
     * caller away from eating the page, so the cap is here rather than a
     * comment saying it cannot happen.
     */
    const FX_LIMIT = 48

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
      '.dsh-pet-bob[data-pose="walk1"],.dsh-pet-bob[data-pose="walk2"]'
        + '{animation:dsh-pet-step var(--dsh-step,330ms) ease-in-out infinite}',
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
        fx: [], tilt: 0, squash: 1, lift: 0, dragging: false, walking: false,
      }
      let state = { ...view }
      const listeners = new Set()
      let speechTimer = null
      let sleepTimer = null
      let chatterTimer = null
      let wanderTimer = null
      let spacingTimer = null
      let giftTimer = null
      let lastGiftAt = 0
      let cueTimers = []
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

      /** How much clear floor this pet insists on between itself and anyone else. */
      const PERSONAL_GAP = 18

      /**
       * Nudge a desired left offset until it no longer overlaps the sibling.
       *
       * Two pets that can both wander freely will eventually stand in the same
       * spot, and one will be drawn on top of the other. Rather than let that
       * happen and hope, every destination is pushed out of the sibling's
       * footprint first — to whichever side is nearer, and if neither side has
       * room, to the side with more.
       */
      function avoidSibling(target) {
        const box = partnerBounds()
        if (box === null) return target
        const mine = view.width
        const theirs = typeof box.width === 'number' ? box.width : mine
        const clearance = (mine + theirs) / 2 + PERSONAL_GAP
        const myCentre = target + mine / 2
        const theirCentre = box.x + theirs / 2
        if (Math.abs(myCentre - theirCentre) >= clearance) return target
        const leftSpot = theirCentre - clearance - mine / 2
        const rightSpot = theirCentre + clearance - mine / 2
        const fits = (x) => x >= -0.5 && x <= maxX() + 0.5
        const wantsLeft = myCentre <= theirCentre
        const first = wantsLeft ? leftSpot : rightSpot
        const second = wantsLeft ? rightSpot : leftSpot
        const chosen = fits(first) ? first : (fits(second) ? second : (leftSpot > 0 ? leftSpot : rightSpot))
        return Math.max(0, Math.min(maxX(), chosen))
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
        const total = Math.max(0, Math.min(12, count === undefined ? 1 : count))
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
        if (view.fx.length > FX_LIMIT) view.fx = view.fx.slice(-FX_LIMIT)
        notify()
      }

      function reapFx() {
        const now = Date.now()
        if (view.fx.length === 0) return
        view.fx = view.fx.filter((item) => item.until > now)
        notify()
      }

      // ---- speech ---------------------------------------------------------

      /**
       * Say one line: bubble, voice and mouth animation on the same cue.
       *
       * The hold is first guessed from the text length, then corrected against
       * the recording's own duration once the browser knows it. That correction
       * matters because the two voices are directed rather than metronomic —
       * 梁子's slow read of a long line runs several seconds past what the
       * character count would suggest, and without this the bubble would vanish
       * and his mouth would close while he was still talking.
       */
      function say(key, hold) {
        const text = LINES[key]
        if (typeof text !== 'string') return
        lastLine = key
        view.bubble = cfg.bubble === 'true' ? { text } : null
        setPose('talk')
        const startedAt = Date.now()
        const guess = hold === undefined ? Math.max(1600, 700 + text.length * 190) : hold
        let done = false
        const finish = () => {
          if (disposed || done) return
          done = true
          view.bubble = null
          setPose(restPose())
          notify()
        }
        busyUntil = startedAt + guess
        window.clearTimeout(speechTimer)
        speechTimer = window.setTimeout(finish, guess)
        if (cfg.voice === 'true') {
          audio.play('voice', key, clampNum(cfg.voiceVolume, 0, 100, 80) / 100).then((el) => {
            if (disposed || done || el === null || hold !== undefined) return
            const seconds = Number(el.duration)
            if (!Number.isFinite(seconds) || seconds <= 0) return
            const remaining = Math.round(seconds * 1000) + 260 - (Date.now() - startedAt)
            if (remaining <= 200) return
            busyUntil = Date.now() + remaining
            window.clearTimeout(speechTimer)
            speechTimer = window.setTimeout(finish, remaining)
          })
        }
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
              if (typeof act.sfx === 'string') sfx(act.sfx)
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

      /** The frames this character actually has, in cycle order. */
      function walkFrames() {
        return WALK_CYCLE.filter((pose) => has(pose))
      }

      /**
       * Ground speed, in px/s, that makes the feet match the floor.
       *
       * One cycle is `STEPS_PER_CYCLE` steps of `STRIDE_RATIO` × height each,
       * and it takes `frames × STEP_MS` to play. Speed is therefore a
       * consequence of the step cadence, not a free parameter.
       */
      function walkSpeed() {
        const frames = walkFrames()
        if (frames.length === 0) return 0
        const cycleSeconds = (frames.length * STEP_MS) / 1000
        const cycleDistance = view.height * STRIDE_RATIO * STEPS_PER_CYCLE
        return cycleDistance / cycleSeconds
      }

      /** How long it takes to cover `distance` at the walk's own pace. */
      function walkDuration(distance) {
        const speed = walkSpeed()
        return speed <= 0 ? 0 : (distance / speed) * 1000
      }

      /** Advance the frames of the walk cycle for as long as the walk lasts. */
      function startSteps() {
        window.clearInterval(stepTimer)
        stepTimer = null
        const frames = walkFrames()
        if (frames.length === 0) return
        // Show the first frame immediately. Waiting for the first tick to draw
        // anything would start every walk one frame late — on the pass pose,
        // which is the one frame that looks wrong as an opening stride.
        let index = 0
        setPose(frames[0])
        stepTimer = window.setInterval(() => {
          if (disposed || raf === null) {
            window.clearInterval(stepTimer)
            stepTimer = null
            return
          }
          index = (index + 1) % frames.length
          setPose(frames[index])
        }, STEP_MS)
      }

      /** Walk to a new spot along the floor, feet matched to the ground. */
      function wanderTo(targetX, speedScale) {
        const fromX = view.x
        const span = targetX - fromX
        const distance = Math.abs(span)
        if (distance < 4) return 0
        const scale = typeof speedScale === 'number' && speedScale > 0 ? speedScale : 1
        const duration = Math.max(200, walkDuration(distance) / scale)
        const startedAt = performance.now()
        view.facing = span >= 0 ? 1 : -1
        busyUntil = Date.now() + duration + 120
        view.walking = true
        notify()
        startSteps()
        if (raf !== null) cancelAnimationFrame(raf)
        const step = (now) => {
          if (disposed) return
          // Linear, not eased: an eased walk changes speed mid-stride, which
          // slides the feet no matter how good the frame timing is. The pause
          // at each end lives in the scheduler instead.
          const t = Math.min(1, (now - startedAt) / duration)
          view.x = fromX + span * t
          notify()
          if (t < 1) raf = requestAnimationFrame(step)
          else {
            raf = null
            view.walking = false
            window.clearInterval(stepTimer)
            stepTimer = null
            setPose(restPose())
          }
        }
        raf = requestAnimationFrame(step)
        return duration
      }

      /**
       * Keep out of the sibling's way.
       *
       * The destination checks stop this pet *walking* into the other one, but
       * they cannot stop the other one arriving — it may have been dragged on
       * top, or walked over while this pet was busy. So the floor is checked
       * periodically as well, and whoever is free steps aside.
       */
      function scheduleSpacing() {
        window.clearTimeout(spacingTimer)
        if (disposed) return
        spacingTimer = window.setTimeout(() => {
          if (disposed) return
          if (cfg.link === 'true' && !sleeping && !view.dragging && !busy() && raf === null) {
            const box = partnerBounds()
            if (box !== null) {
              const mine = view.x + view.width / 2
              const theirs = box.x + (typeof box.width === 'number' ? box.width : view.width) / 2
              const clearance = (view.width + (typeof box.width === 'number' ? box.width : view.width)) / 2
                + PERSONAL_GAP
              if (Math.abs(mine - theirs) < clearance) {
                // Only the pet on the right gives way, so they never both move
                // and swap places.
                if (mine > theirs) walkToX(avoidSibling(view.x), 1)
              }
            }
          }
          scheduleSpacing()
        }, 2200)
      }

      function scheduleWander() {
        window.clearTimeout(wanderTimer)
        if (cfg.wander !== 'true' || disposed) return
        wanderTimer = window.setTimeout(() => {
          if (disposed) return
          if (!sleeping && !view.dragging && !busy() && raf === null) {
            // With a sibling on the page it sometimes goes to stand next to it
            // instead of pacing somewhere random — that is most of what makes
            // two pets look like they are keeping each other company.
            const box = cfg.link === 'true' ? partnerBounds() : null
            if (box !== null && Math.random() < 0.45) {
              api.approach()
            } else {
              wanderTo(avoidSibling(Math.random() * maxX()))
            }
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
        // Stop whatever the previous scene left running. Cancelling only the
        // closing timeout used to leave that scene's per-cue timers alive, and
        // they would go on setting poses and writing subtitles over the top of
        // the new one — a slow leak of timers that also corrupted the display.
        window.clearTimeout(speechTimer)
        for (const id of cueTimers) window.clearTimeout(id)
        cueTimers = []
        setPose('talk')
        busyUntil = Date.now() + scene.duration + 700
        if (cfg.bubble === 'true' && scene.cues.length > 0) {
          view.bubble = { text: '' }
          notify()
        }
        cueTimers = scene.cues.map((cue) => window.setTimeout(() => {
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
          cueTimers = []
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

      /** The sibling's live geometry, or null when it is not on the page. */
      function partnerBounds() {
        if (!partnerPresent()) return null
        const other = family.bus.pets.get(SIBLING_ID)
        if (other === null || other === undefined || other.api === undefined) return null
        if (typeof other.api.bounds !== 'function') return null
        try {
          const box = other.api.bounds()
          return box !== null && typeof box === 'object' && typeof box.x === 'number' ? box : null
        } catch {
          return null
        }
      }

      /** Walk to an absolute left offset, if the pet is free to move. */
      function walkToX(target, scale) {
        if (disposed || sleeping || view.dragging || raf !== null) return 0
        const clamped = Math.max(0, Math.min(maxX(), target))
        if (Math.abs(clamped - view.x) < 6) return 0
        return wanderTo(clamped, scale)
      }

      /** The spot beside the sibling: close, but never on top of it. */
      function besideSibling() {
        const box = partnerBounds()
        if (box === null) return null
        const theirs = typeof box.width === 'number' ? box.width : view.width
        const theirCentre = box.x + theirs / 2
        const room = (view.width + theirs) / 2 + PERSONAL_GAP
        const left = theirCentre - room - view.width / 2
        const right = theirCentre + room - view.width / 2
        const fits = (x) => x >= -0.5 && x <= maxX() + 0.5
        const preferLeft = view.x + view.width / 2 <= theirCentre
        const first = preferLeft ? left : right
        const second = preferLeft ? right : left
        if (fits(first)) return first
        if (fits(second)) return second
        return null
      }

      /** Turn towards the sibling, so a line is spoken to someone. */
      function facePartner() {
        const box = partnerBounds()
        if (box === null) return
        const gap = (box.x + box.width / 2) - (view.x + view.width / 2)
        if (Math.abs(gap) < 30) return
        const facing = gap > 0 ? 1 : -1
        if (facing !== view.facing) {
          view.facing = facing
          notify()
        }
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
          scheduleSpacing()
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
                // Greet with one of the *short* scenes. Picking at random among
                // all of them meant the two pets could arrive and then stand
                // there talking for fourteen seconds, during which neither
                // answered a click.
                const short = Object.keys(JOINTS)
                  .filter((key) => (JOINTS[key].duration || 0) <= 11000)
                playJoint(pick(short.length > 0 ? short : Object.keys(JOINTS), null))
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
            if (cfg.link !== 'true') return
            // Look at whoever is talking, then answer with a nod of the head.
            facePartner()
            react('happy')
          })
          family.bus.on('family/approach', (detail) => {
            if (detail === null || detail === undefined || detail.id === PET_ID) return
            if (cfg.link !== 'true' || typeof detail.x !== 'number') return
            const wanted = detail.x
            window.setTimeout(() => {
              if (disposed || sleeping || view.dragging) return
              facePartner()
              walkToX(avoidSibling(wanted), 1)
            }, 60)
          })
          family.bus.on('family/gesture', (detail) => {
            if (detail === null || detail === undefined || detail.id === PET_ID) return
            if (cfg.link !== 'true') return
            // A gift is answered, but the answer must not itself be answerable.
            //
            // This used to reply to every gift it received, including the
            // replies — so one press of the button started an exchange that
            // never ended, chiming and throwing particles every 1.5 seconds for
            // as long as the app stayed open. Clicking it a few times started
            // several of them at once, and the page stopped responding. The
            // `hop` field is what stops it: the receiver answers hop 0, and
            // ignores anything that already carries a hop.
            const hop = Number(detail.hop) || 0
            const now = Date.now()
            facePartner()
            const kind = typeof detail.kind === 'string' ? detail.kind : 'heart'
            if (hop >= 1) {
              // The return gift: acknowledge it and stop.
              react(kind === 'rice' ? 'happy' : 'heart')
              return
            }
            // Rate-limit as well, in case several gifts are in flight at once.
            if (now - lastGiftAt < GIFT_COOLDOWN_MS) return
            lastGiftAt = now
            react(kind === 'rice' ? 'happy' : 'heart')
            burst(kind, 3)
            window.clearTimeout(giftTimer)
            giftTimer = window.setTimeout(() => {
              giftTimer = null
              if (disposed) return
              if (family !== null && family.bus !== null) {
                family.bus.emit('family/gesture', {
                  id: PET_ID,
                  kind: kind === 'rice' ? 'heart' : 'rice',
                  hop: 1,
                })
              }
            }, 1500)
          })
          family.bus.on('family/sequence', (detail) => {
            if (detail === null || detail === undefined || typeof detail.name !== 'string') return
            if (cfg.link !== 'true') return
            // Walk over to the sibling before the scene starts, so the two of
            // them perform it standing next to each other.
            const target = besideSibling()
            if (target !== null && view.dragging === false && sleeping === false) {
              walkToX(target, 1)
            }
            facePartner()
            window.setTimeout(() => {
              if (!disposed) playJoint(detail.name)
            }, 260)
          })
          adopt(family.partner)
          family.bus.emit('pet/join', api.descriptor())
        },

        partnerPresent,
        partnerBounds,
        emitSay,
        facePartner,
        walkToX,

        /** Walk over to stand beside the sibling, never on top of it. */
        approach() {
          if (disposed || sleeping || view.dragging) return false
          const target = besideSibling()
          if (target === null) return false
          const wanted = Math.max(0, Math.min(maxX(), target))
          if (family !== null && family.bus !== null) {
            family.bus.emit('family/approach', { id: PET_ID, x: wanted })
          }
          return walkToX(wanted, 1) > 0
        },

        /** Hand something to the sibling and let it hand something back. */
        gift(kind) {
          if (!partnerPresent() || disposed) return false
          facePartner()
          react('happy')
          burst(typeof kind === 'string' ? kind : 'heart', 2)
          if (family !== null && family.bus !== null) {
            family.bus.emit('family/gesture', { id: PET_ID, kind: typeof kind === 'string' ? kind : 'heart' })
          }
          return true
        },

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
          window.clearTimeout(spacingTimer)
          window.clearTimeout(giftTimer)
          for (const id of cueTimers) window.clearTimeout(id)
          cueTimers = []
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
        // An airborne pet casts a smaller, fainter shadow.
        const shadow = Math.max(0.35, 1 - lift / 320)

        return h('div', {
          ref: rootRef,
          'data-dsh-pet': PET_ID,
          style: { position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: 1 },
        },
        h('style', null, PET_CSS),

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
        h('div', {
          className: 'dsh-pet-bob',
          'data-pose': state.pose,
          // The step bob and the frame change are driven by the same number, so
          // the body rises on the pass frame instead of on its own schedule.
          style: { '--dsh-step': String(STEP_MS) + 'ms' },
        },
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

        // Hover toolbar: one column down the pet's side.
        //
        // It used to sit above the pet's head, which is exactly where the speech
        // bubble goes — so the four switches covered the line being spoken. Down
        // the side it collides with neither the bubble nor the other pet's.
        hover ? h('div', {
          'data-dsh-pet-bar': PET_ID,
          style: (() => {
            const roomRight = state.vw - (state.x + width)
            const flip = roomRight < 54 && state.x > 54
            return {
              position: 'absolute',
              left: String(Math.round(flip ? state.x - 12 : state.x + width + 12)) + 'px',
              bottom: String(Math.round(bottom + height * 0.55)) + 'px',
              transform: flip ? 'translate(-100%, 50%)' : 'translate(0, 50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: '6px',
              pointerEvents: 'auto',
              whiteSpace: 'nowrap',
            }
          })(),
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
              onClick: () => {
                if (controller === null) {
                  setStatus('桌宠还没加载完成')
                  return
                }
                if (!controller.partnerPresent()) {
                  setStatus('还没有检测到' + SIBLING_NAME)
                  return
                }
                const walked = controller.approach()
                setStatus(walked ? '正在走向' + SIBLING_NAME : '已经站在旁边了')
              },
            }, '走到' + SIBLING_NAME + '身边'),
            h('button', {
              type: 'button',
              className: 'dsh-pet-btn',
              onClick: () => {
                if (controller === null) return
                if (!controller.partnerPresent()) {
                  setStatus('还没有检测到' + SIBLING_NAME)
                  return
                }
                controller.gift('rice')
                setStatus('把白饭递过去了')
              },
            }, '递一份白饭给' + SIBLING_NAME),
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
