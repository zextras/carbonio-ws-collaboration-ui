<!--
SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>

SPDX-License-Identifier: AGPL-3.0-only
-->

# Debug stream quality caps (console-driven)

- **Branch:** `feat/dynamic-streams-debug-caps` (off `feat/dynamic-streams-rtt-loss`)
- **Date:** 2026-09-10
- **Status:** design, pending implementation

## Goal

Give a developer a dead-simple way, from the browser JS console, to force a **hard
maximum tier** on the webcam streams during a meeting — one cap for the local
**upload** and one cap for all **downloads** — purely to *simulate* quality changes
(RTT/loss driven degradation) without a network shaper.

The caps are **ceilings**, not forced qualities: the real adaptive logic keeps running
underneath and may sit below the cap (real congestion) or, when the cap is raised,
climb back toward it following the normal rules.

## Non-goals / hard constraints

- **Do not modify the network adaptation logic.** `decideDownlink()` (the pure downlink
  state machine) and the connection-quality scoring stay byte-for-byte unchanged in
  behavior.
- **Zero effect when unused.** With no cap set (the default, and the only state a normal
  user is ever in), every new code path is gated off and behavior is identical to the
  current branch.
- **No protocol / store / signalling changes.** Caps live in an isolated module, not in
  the app store or the wire format.
- **Scope = webcam video** (the streams the dynamic-quality subsystem manages).
  Screen-share and audio are out of scope.

## Background — how quality moves today

### Download (inbound webcam feeds) — client-driven, one 2 s tick

`ConnectionQualityMonitor.evaluate()` (2 s interval) computes vote `signals` and calls
`VideoScreenInConnection.evaluateQualityTick(signals)`, which runs the pure state machine
`decideDownlink()` (`inboundQualityController.ts`):

- A single **global `targetRung` 0..5**. Per-feed effective rung = `min(targetRung, senderMax)`.
- `layersOf(rung)` → `{ substream: 0|1|2, temporal: 1|2 }`. Substream **0/1/2 = 144/360/720**.
- Changes are applied per feed via `requestVideoQuality(meetingId, userId, mid, substream, temporal)`;
  auto-off = `suppressFeed()` (removes the subscription).
- Changes are emitted **only on DOWN/UP** events; HOLD emits nothing.

### Upload (outbound webcam) — owned by GCC

`VideoOutConnection.addSimulcastTransceiver` publishes every producible simulcast
encoding (rids `h`/`m`/`l` = high/medium/low from `session.attributes.videoSimulcastTiers`,
filtered by capture height). The app never caps it: **GCC** inside libwebrtc decides which
layers to actually send under bandwidth pressure. `ConnectionQualityMonitor.trackWebcamUplink`
only *reads* the top active rid and broadcasts it as `maxTier` (feeding peers' `senderMax`).

Therefore capping upload requires actively telling the sender via
`RTCRtpSender.setParameters()` — this is the one place where the cap must push, not wait.

### Where the live connections live

`useStore.getState().activeMeeting.videoOutConn` and `.videoScreenIn` — reachable directly
from a console hook; no extra registration needed.

## Console API

A single, clearly-named debug global (nothing else exposed):

```js
wscStreamDebug.setUploadCap('MEDIUM')     // 'LOW' | 'MEDIUM' | 'HIGH'
wscStreamDebug.setDownloadCap('MEDIUM')   // 'LOW' | 'MEDIUM' | 'HIGH' | 'OFF'
wscStreamDebug.clear()                    // remove both caps -> fully automatic
wscStreamDebug.status()                   // console.table of caps + live effective tiers
```

- Tier argument is a **case-insensitive string**; invalid input logs a warning and is
  ignored. `'AUTO'` or `null` on a single setter clears that direction only.
- No enum/constant objects are added to the global scope (keeps the surface minimal).
- The global is **always installed** (like the existing `rtcDebug`), but inert until a
  setter is called. Installing it changes nothing on its own.

### Tier mapping

| Console tier | Upload (simulcast rid active set) | Download (max substream) |
|--------------|-----------------------------------|--------------------------|
| `LOW`        | `l` only                          | 0 (144p)                 |
| `MEDIUM`     | `l` + `m`                         | 1 (360p)                 |
| `HIGH`       | all producible (= uncapped)       | 2 (720p, = uncapped top) |
| `OFF`        | n/a (upload has 3 tiers)          | unsubscribe all feeds    |

## Design

### 1. `src/utils/debugStreamCaps.ts` — isolated cap store

Module-level singletons, default `null`:

```ts
export type UploadTier = 'LOW' | 'MEDIUM' | 'HIGH';
export type DownloadTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'OFF';

// substream index 0/1/2, or 'OFF', or null (= no cap / automatic)
let uploadCap: 0 | 1 | 2 | null = null;
let downloadCap: 0 | 1 | 2 | 'OFF' | null = null;

export const getUploadCapSubstream = (): 0 | 1 | 2 | null => uploadCap;
export const getDownloadCap = (): 0 | 1 | 2 | 'OFF' | null => downloadCap;
```

Setters store the parsed value, `rtcDebug(...)` a line, and — **upload only** — push
immediately to the live `videoOutConn` (the GCC exception). Download setters only store;
the next 2 s tick applies the cap (per the requirement that download need not be immediate).

`installStreamDebugHook()` attaches `window.wscStreamDebug` with the four methods above,
resolving the live connections from the store on each call. Called once at meeting-module
init (`initMeetings.tsx`). Idempotent.

### 2. Upload — `VideoOutConnection.applyDebugUploadCap(substream | null)`

```ts
// substream === null -> all encodings active (default). Otherwise: encoding active iff its
// rid index (l=0,m=1,h=2) <= cap.
```

Implementation: `const p = this.rtpSender.getParameters(); p.encodings.forEach(e => {
e.active = ridIndex(e.rid) <= cap; }); await this.rtpSender.setParameters(p);`
Applied immediately when the console setter runs, and re-asserted whenever a new sender is
created while a cap is active (`addSimulcastTransceiver`) so a mid-session camera restart
keeps the cap. `HIGH`/clear re-activates all encodings; GCC re-ramps on its own.

### 3. Download — request clamp in `VideoScreenInConnection.evaluateQualityTick`

`decideDownlink()` stays untouched and **always runs**: `centralState` keeps evolving on the
measured signals (which now reflect the capped quality — the point of the simulation), and
the controller's own DOWN/UP/auto-off decisions still happen. The debug cap only clamps the
**request actually sent to Janus**, and only when a download cap is (or was just) active:

- **No cap, and none last tick:** run the existing `changes.forEach(...)` apply path,
  byte-for-byte unchanged. This is the only path a normal user ever hits.
- **Cap active (a tier):**
  1. Apply the controller's `changes` as today, but **clamp the requested substream** to
     `min(change.changeSubstream, capSub)` on each `requestVideoQuality(...)`. `change.off`
     (controller auto-off) and the auto-off→re-subscribe path are honored unchanged, so the
     network logic's effects are preserved.
  2. **Reconcile untouched feeds:** for every active feed that had no change this tick,
     compute `desiredSub = min(layersOf(feedState.rung).substream, capSub)`; if it differs
     from a per-feed `lastAppliedSub`, send `requestVideoQuality(..., desiredSub, 2)` (full
     framerate at the capped resolution). This is what makes a cap set during a stable HOLD
     take effect without waiting for the next DOWN/UP.
- **Cap active = `OFF`:** suppress every active feed (`suppressFeed`), regardless of the
  controller — a debug-forced auto-off. Feeds stay in `centralState` at their rung so a
  later tier restore can re-subscribe them.
- **Cap just cleared (latch):** one reconcile pass re-requests each feed at its current
  `centralState` rung and re-subscribes any feed the debug `OFF` suppressed; then subsequent
  ticks fall back to the untouched path.

A `debugDownlinkWasActive` latch guarantees the normal path is byte-identical whenever the
cap has never been touched. `lastAppliedSub` is bookkeeping local to the cap-active path.

Restore semantics (matches the requirement): raising/clearing the cap lets feeds return
toward the controller's current rung; whether they actually climb depends on the real
vote-driven UP rules — they may stay low if the network is genuinely bad.

## Edge cases

- **New feed subscribes while a download cap is active:** it enters at `TOP_RUNG` in
  `onTrack`; the next tick's overlay immediately clamps its request to the cap.
- **`OFF` → tier:** suppressed feeds are re-subscribed via the existing auto-off→up path
  (`setAddSubscription` + clear `localVideoSuppressed`), then clamped.
- **Camera restart while upload cap active:** `addSimulcastTransceiver` re-asserts the cap
  on the new sender.
- **Meeting disconnect:** module caps persist across meetings (they are debug intent);
  `status()` shows them. `clear()` resets. (Acceptable for a debug tool; can be reset on
  disconnect if preferred.)

## Testing

- `debugStreamCaps.test.ts`: tier-string parsing (case-insensitive, invalid ignored),
  substream mapping, `clear`, setter side effects (upload pushes, download stores only).
- `VideoOutConnection`: `applyDebugUploadCap` toggles `encodings[].active` correctly for
  LOW/MEDIUM/HIGH/clear; re-asserts on new sender.
- `VideoScreenInConnection`: with a cap, feed requests are clamped to `min(rung, cap)`;
  `OFF` suppresses; clearing reconciles back; **with no cap the existing apply path and its
  emitted `requestVideoQuality` calls are unchanged** (regression guard).

## Files touched

- **new** `src/utils/debugStreamCaps.ts` (+ test)
- `src/network/webRTC/VideoOutConnection.ts` — `applyDebugUploadCap`, re-assert on new sender
- `src/network/webRTC/VideoScreenInConnection.ts` — cap-aware apply overlay + latch
- `src/meetings/initMeetings.tsx` — call `installStreamDebugHook()` once
- (types only, no runtime change) a `Window` augmentation for `wscStreamDebug`
