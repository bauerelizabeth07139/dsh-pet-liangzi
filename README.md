# {{PET_NAME}} · Desktop Pet · Liangzi Desktop Pet

[![dsh.so risk](https://www.dsh.so/badge/dsh-pet-liangzi.svg)](https://www.dsh.so/artifact/dsh-pet-liangzi/)

A chibi **父亲** (father) that lives inside the DeepSeek Harness Web GUI. It stands on the
bottom edge of the window, breathes, wanders about, can be picked up and dropped anywhere, says
things out loud in Chinese with subtitles, and plays its own sound effects and background music.

Every sound it makes is on its own switch, and **every asset ships inside this package** — no
network calls, no CDN, no build step, no external service.

> DeepSeek 创始人的动漫化身，沉稳可靠的父亲。会走动、会说话、能拖动；和「大肥鱼」同时安装时，父女俩会打招呼、搭话，还能演一段小剧场。

![{{PET_NAME}} — six drawn states](docs/states.png)

![{{PET_NAME}} and 大肥鱼 together](docs/family.png)

---

## What it does

| | |
|---|---|
| **On-screen character** | Six hand-directed sprite states — idle, happy, talking, asleep, surprised, waving — drawn from the original {{PET_NAME}} artwork by image-to-image so the identity, outfit and palette stay exact. Idle breathing, talking mouth, hop, shake and a soft ground shadow are pure CSS. |
| **Walks and can be dragged** | It strolls along the bottom edge on its own schedule, turns to face the way it is going, and follows your pointer when you pick it up. Where you drop it is where it stays, across reloads. |
| **Voiced dialogue** | Every line is pre-rendered speech, not a beep. Speaking shows the subtitle in a bubble and switches the sprite to its talking state for exactly as long as the line runs. |
| **Sound effects** | Click, drag, greet, sparkle, heart, sleep and link cues, generated as one sound-effect group and picked per situation. |
| **Background music** | A calm instrumental loop written for this character. It starts only when you turn it on, and pauses automatically while the tab is in the background. |
| **Family link** | When [大肥鱼](https://github.com/bauerelizabeth07139/dsh-pet-dafeiyu) is installed too, the two pets notice each other: they greet, call out to each other while you work, draw a dashed bond line between them, and can perform a **three-scene father-and-daughter playlet** with directed, alternating turns. |

## The switches

Everything is a toggle in **Settings → 桌宠 · 梁子**, and the four you reach for most are also on
the little toolbar that appears when you hover the character.

| Switch | Default | What it does |
|---|---|---|
| 显示桌宠 | on | Hide the character without losing any setting |
| 角色大小 / 不透明度 | 190px / 100% | How big and how assertive it is |
| 自动走动 | on | Whether it strolls along the bottom edge |
| 对话气泡 | on | Subtitle bubble above its head |
| 主动搭话 | on | Whether it speaks up on its own every so often |
| **对话语音** + 音量 | on / 80% | The voiced lines |
| **音效** + 音量 | on / 60% | The short interaction cues |
| **背景音乐** + 音量 | **off** / 35% | The looping instrumental |
| 与大肥鱼联动 | on | The cross-plugin link |

> Browsers refuse to play audio before the page has been interacted with. Until your first click or
> keypress the pet shows a **🔈 点一下开启声音** chip; one click anywhere unlocks audio for the
> session. This is a browser rule, not a plugin setting.

## Install

The plugin is a standard DSH bundle: `package.json` declares `dsh.bundle.patch`, and
`cordis.patch.yml` inserts the loader row that mounts both halves.

**In the app** — *Plugins → Add plugin*, and paste this repository's URL:

```
https://github.com/bauerelizabeth07139/dsh-pet-liangzi
```

**From a command line** (the desktop build reads the `desktop` profile):

```sh
dsh plugin --profile desktop add bauerelizabeth07139/dsh-pet-liangzi
```

**Without `git` installed** — pnpm resolves `owner/repo` with `git ls-remote`, which fails on a
machine without git. Pin the tarball instead, which pnpm fetches over plain HTTPS:

```sh
cd "$HOME/.dsh/profiles/desktop"
node /path/to/dsh/runtime/pnpm.mjs add \
  "https://codeload.github.com/bauerelizabeth07139/dsh-pet-liangzi/tar.gz/<commit-sha>"
```

Then enable **dsh-pet-liangzi** on the Plugins page and open **Settings → 桌宠 · 梁子**.

## Using it

* **Click** it — it wakes up, reacts and says something.
* **Drag** it — pick it up and drop it anywhere; the position is remembered.
* **Hover** it — a small toolbar appears with the voice, sound-effect, music and bubble switches.
* **Leave it alone** — after a couple of quiet minutes it falls asleep; any interaction wakes it.
* **演一段父女小剧场** in its settings starts a shared scene. With both pets installed they perform
  it together; with only one installed, it still plays its own half.

## How it is put together

```
package.json          dsh.bundle.patch + dsh.client + the metadata cards read
cordis.patch.yml      the loader row that mounts both halves
lib/index.js          host half — config file, asset routes, HTML boot stamp
lib/client.js         browser half — the overlay slot, the pet, its audio
assets/sprites/*.png  six transparent states, palette PNGs
assets/voice/*.mp3    one file per spoken line
assets/sfx/*.mp3      one file per interaction cue
assets/bgm/*.mp3      the looping instrumental
assets/joint/*.mp3    the shared two-hander scenes
locale/{en,zh}.json   the plugin-card title and description
test/*.test.mjs       host and client checks, no browser needed
```

**Host half.** Serves `GET/PUT /api/dsh-pet-liangzi/config` (written to `$DSH_HOME/dsh-pet-liangzi.json` with an
atomic temp-and-rename), `GET /api/dsh-pet-liangzi/asset/<path>` for every sprite and sample — with byte
ranges, because `<audio>` seeks — and a `diag` route the browser posts to. It also stamps the config
into the served HTML as `window.DshPetLiangzi`, so the pet is already on screen at first paint.

**Browser half.** Registers into the `shell.overlay` slot, which the app frame renders as a
full-viewport `pointer-events:none` layer above the shell. The component renders one click-through
root and re-enables pointer events on the character alone, so every click that is not on the pet
still reaches the Harness. A single controller object owns position, the state machine, the speech
queue and the audio channels; React only subscribes to state snapshots, which keeps the
animation-frame loop off the render path.

**The family link** is a `window.__DSH_PET_FAMILY__` bus carrying a protocol number. The first pet
to load creates it, the second joins; a version mismatch degrades to "no partner" rather than
throwing. Neither package imports, requires or reads the other — the bus is the whole contract, so
either pet works perfectly alone. The playlets are a single mixed track generated with both voices
and both speakers' turns, and the per-sentence timings that came back with it drive each pet's
subtitle, so the two halves stay in sync without either one being in charge.

## Troubleshooting

| Symptom | Fix |
|---|---|
| No character appears | Check **Settings → 桌宠 · 梁子 → 显示桌宠** is on, and that the bundle is enabled on the Plugins page. |
| Character is there, silent | Click the **🔈 点一下开启声音** chip, or click anywhere in the page once. |
| It never speaks | 主动搭话 controls unprompted lines; clicking it always speaks. Check 对话语音 and its volume. |
| No music | 背景音乐 is **off** by default — turn it on in the settings page. |
| It vanished after a window resize | Drag it back; it is clamped into the window rather than lost. |
| Both pets overlap | Drag one aside. Each remembers where you put it. |
| Nothing in the settings page | The Host half is not mounted — reinstall or re-enable the bundle. |

If a pet fails to render at all, the browser half posts a report that you can read back with:

```sh
curl http://127.0.0.1:19387/api/dsh-pet-liangzi/diag
```

## Companion plugin

| Pet | Role | Repository |
|---|---|---|
| {{PET_NAME}} | 父亲 | this one |
| 大肥鱼 | 女儿 | [dsh-pet-dafeiyu](https://github.com/bauerelizabeth07139/dsh-pet-dafeiyu) |

Install both to get the family link. Each is complete and independent on its own.

## Credits and licence

The character art is derived from the original {{PET_NAME}} artwork by image-to-image, so the
design, outfit and palette are the source images' — this package only re-poses them. The voice,
sound effects and music were generated through the SenseAudio API for this plugin.

MIT — see [LICENSE](./LICENSE).
