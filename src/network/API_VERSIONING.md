# API & WebSocket Versioning Log

This document tracks internal changes related to API versioning, renamed events, and modified files.

## Version 2.0.0 (in progress)

### Changes

- **Protocol**: WSC-pure backend (MongooseIM replacement) — REST writes + single push WebSocket. `2.0.0` added to `supportedVersions`; against a 1.6.x backend the whole v2 path stays dormant.
- **Client architecture**: chat call sites moved from `xmppClient` to the version-gated `chatClient` façade; XMPP connection is skipped when the negotiated version is `>= 2.0.0`. New chat WS events (`MessageReceived`, `MessageEdited`, `MessageDeleted`, `MessageForwarded`, `MessagePinned`, `MessageUnpinned`, `ReactionChanged`, `ReadUpdated`, `PresenceChanged`, `Typing`, `Error`) routed to `wsChatEventsRouter` (SDK wiring lands one API per step, see `wsc-both/PIANO-MIGRAZIONE-SDK.md`).

### Legacy XMPP boot sequence → 2.0.0

The XMPP connection handler (`XMPPClient.ts` constructor callback) ran four calls on every connect. On a WSC-pure backend the chat boots through `chatClient.connect` instead, and the sequence dissolves as follows:

| Legacy call | What it actually did | 2.0.0 |
|---|---|---|
| `setInbox()` (IQ inbox, XEP-0430) | last message + unread count per room | `GET /inbox` via the SDK (`wscSdk.fetchInbox()`); the same payload also carries read markers (replacing the smart-markers IQ) and member presence |
| `getContactList()` (IQ roster) | its only effect (`rosterCallback`): one `getLastActivity(jid)` IQ **per contact** to seed presence/last activity | roster removed by the backend, no replacement needed: `online`/`lastActivity` arrive in the same `GET /inbox` (`room.members[]`) — the N+1 queries become zero |
| `setOnline()` (`<presence/>`) | announce presence to contacts | no outbound presence action exists in the protocol: opening the events WebSocket announces you, closing it (after a grace period) marks you offline |
| `getFeatures()` (disco#info) | populates `xmppClient.features`; its real consumer is the pin capability check (`features.includes('zextras:iq:pin')`) | **deliberate gap**: no v2 equivalent wired yet, so `features` stays empty and the pin UI is hidden on 2.0.0 — will be resolved by the pin migration step |

State of the mapping after this change: `GET /inbox` is the only API routed end-to-end through the SDK. Every write method is version-gated in the façade but still no-ops on 2.0.0 (debug log); the twelve chat WS events are recognized and routed to `wsChatEventsRouter`, which only debug-logs them until their migration steps land.

### Affected Files

- 'src/network/chatClient/ChatClient.ts' (new façade)
- 'src/network/sdk/wscSdk.ts' (SDK ports + StoreBridge adapter)
- 'src/network/websocket/wsChatEventsRouter.ts' (new)
- 'src/network/websocket/wsEventsHandler.ts', 'src/network/websocket/eventHandlersUtilities.ts'
- 'src/types/network/websocket/wsEvents.ts'
- 'src/MainApp.tsx' (supportedVersions + boot through the façade)
- ~20 UI call sites (mechanical `xmppClient` → `chatClient` rename)

---

## Version 1.6.13

### Changes

- **API**: New `PUT /meetings/${meetingId}/screen/iceRestart` endpoint to trigger an ICE restart on screenshare connections after a TURN server interruption

### Affected Files
- 'src/network/webRTC/VideoScreenInConnection.ts'

---

## Version 1.6.12

### Changes

- **API**: New `GET /rooms/${roomId}/attachments` and `DELETE /rooms/${roomId}/attachments` endpoints powering the room media gallery (paginated list, filtering and bulk delete of room attachments). Used as feature flag to show/hide the Media Gallery tab in the info panel.

### Affected Files

- 'src/network/apis/RoomsApi.ts' on functions `getRoomAttachments` and `bulkDeleteRoomAttachments`
- 'src/chats/components/infoPanel/ConversationInfoPanel.tsx'
- 'src/MainApp.tsx'

---

## Version 1.6.10

### Changes

- **API**: New `POST /meetings/${meetingId}/decline` endpoint to allow users to decline meeting invitations

### Affected Files

- 'src/meetings/components/MeetingNotification.tsx' on function `handleDeclineMeeting`

---

## Version 1.6.9

### Changes

- **API**: New `GET /meetings/${meetingId}/turnCredentials` endpoint to retrieve TURN credentials for a meeting

---

## Version 1.6.8

### Changes

- **API**: New `GET /users/capabilities` endpoint to retrieve user capabilities directly from WSC (replaces LDAP/Mailbox lookup for clients >= 1.6.8)

### Affected Files

- 'src/network/apis/InfoApi.ts' on function `getCapabilities`
- 'src/store/slices/SessionStoreSlice.ts' on function `setCapabilities`
- 'src/MainApp.tsx'

---

## Version 1.6.7

### Changes

- **XMPP**: Added `roomHistoryCleared` configuration message

### Affected Files

- 'src/meetings/components/sidebar/MeetingConversationAccordion/MeetingConversationAccordion.tsx'

---

## Version 1.6.6

### Changes

- **API**: New `PUT /meetings/${meetingId}/audio/iceRestart` and `PUT /meetings/${meetingId}/video/iceRestart` endpoints to trigger an ICE restart on audio and video connections after a TURN server interruption

### Affected Files
- 'src/network/webRTC/BidirectionalConnectionAudioInOut.ts'
- 'src/network/webRTC/VideoOutConnection.ts'
- 'src/network/webRTC/VideoScreenInConnection.ts'

---

## Version 1.6.5 (2025-11-12 - Released with Carbonio 25.12.0)

### Changes

- **API**: new `/guest` endpoint to create meeting guests

### Affected Files

- 'src/network/apis/MeetingsApi.ts' on function `createGuestAccount`

---

## Version 1.6.4 (2025-11-04 - Released with Carbonio 25.12.0)

### Changes

- **API**:
  - `startRecording`: add `folderId` param
  - `stopRecording`: remove `folderId` and `name` params

### Affected Files

- 'src/network/apis/MeetingsApi.ts' on function `startRecording` and `stopRecording`

## Version 1.6.3 (2025-11-01 - Released with Carbonio 25.12.0)

### Changes

- **API**: Virtual meeting external users do not have to call `leaveConversation` after `leaveMeeting`

### Affected Files

- 'src/network/apis/MeetingsApi.ts' on function `leaveMeeting`

## Version 1.6.2 (2025-08-08 - Released with Carbonio 25.9.0)

### Changes

- **WebSocket**: Renamed events' type

### Affected Files

- 'src/network/websocket/WebSocketClient.ts' on function `_onOpen`
- 'src/network/websocket/normalizedEventType.ts'

## Version 1.6.1 (2025-07-07 - Released with Carbonio 25.9.0)

### Changes

- **API**: Added PUT `rooms/${roomId}/attachments` endpoint

### Affected Files

- 'src/network/apis/RoomsApi.ts' on function' on function `addRoomAttachment`
