# API & WebSocket Versioning Log

This document tracks internal changes related to API versioning, renamed events, and modified files.

## Version 2.0.0

2.0.0 is a breaking change: a 2.0.0 backend requires 2.0.0-capable clients. Older web and mobile clients do not work against it, and there are no compatibility shims or "update the app" screens.

### Changes

- **Protocol**: WSC-pure backend (MongooseIM replacement): REST writes plus a single push WebSocket. The XMPP connection is skipped when the negotiated version is `>= 2.0.0` (`isWscPure()` / `getIsWscPure`); every v2 branch is gated on it, so the 1.x path is unchanged; the one 1.x-visible change is the renegotiation fallback below (a 1.6.x server newer than 1.6.15 now runs on 1.6.15 instead of failing).
- **Version negotiation**: `2.0.0` is the first entry of `SUPPORTED_API_VERSIONS` (`src/constants/appConstants.tsx`), which also lists every 1.6.x up to `1.6.15`. REST calls send the newest supported version in `X-WSC-API-VERSION`. On a `422` the client reads the server version from the same header and renegotiates (`src/utils/FetchUtils.ts`): the server version is used if supported, otherwise the highest supported version not above it; if there is none, or it equals the version just sent, the call fails. Renegotiation retries are bounded (`MAX_VERSION_MISMATCH_RETRIES`). The events WebSocket offers the supported versions as sub-protocols.
- **Client architecture**: chat call sites go through the version-gated `chatClient` façade (`src/network/chatClient/ChatClient.ts`), backed by the SDK (`src/network/sdk/wscSdk.ts`). Chat writes (send, edit, delete, reactions, read markers, pin/unpin, forward) are REST calls that go through the SDK; the attachment upload is `sendAttachmentFetchAPI` and the SDK confirms its placeholder. Chat events (`MessageReceived`, `MessageEdited`, `MessageDeleted`, `MessageForwarded`, `MessagePinned`, `MessageUnpinned`, `ReactionChanged`, `ReadUpdated`, `PresenceChanged`, `Typing`, `Error`) are routed by `wsChatEventsRouter` to the store (`Error` is only logged).
- **Pins**: the pin UI is available; the `zextras:iq:pin` feature is always on. A pin older than the user's `clearedAt` stays visible as text; its attachment thumbnail, preview and download are hidden because the attachment endpoints answer 404 below the visibility floor.
- **Attachments**: upload is one `POST /rooms/${roomId}/attachments` multipart (`file`, `contentLength`, `tempId`, `description`, `replyToId`, `area`) answered by the created `Message`; the description travels unescaped, as a `text/plain;charset=UTF-8` part (without a charset the backend reads it as US-ASCII), the file name keeps its unicode escaping. The 1.6.x variants (`PUT` multipart with `messageId` from 1.6.1, binary `POST` with headers before) are unchanged (`sendAttachmentFetchAPI`, `addRoomAttachment`). REST attachments carry `messageId` and no `stanzaId`: `getRoomAttachments` fills `stanzaId` from `messageId` so gallery and preview delete and forward work.
- **Recovery**: on every socket reconnection and on `MessageBrokerRestored` the volatile chat data is reset and re-requested from `GET /inbox` (`wsReconnectionHandler.ts`), serialized so an older response never lands last.

### Legacy XMPP boot sequence → 2.0.0

The XMPP connection handler (`XMPPClient.ts` constructor callback) ran four calls on every connect. On a WSC-pure backend the chat boots through `chatClient.connect` instead, and the sequence dissolves as follows:

| Legacy call | What it actually did | 2.0.0 |
|---|---|---|
| `setInbox()` (IQ inbox, XEP-0430) | last message + unread count per room | `GET /inbox` via the SDK (`wscSdk.fetchInbox()`), loaded after the first `WebsocketConnected` (the backend sends it once the events socket is subscribed, so no message can fall between the inbox and the subscription) with a 5 s timeout fallback; the same payload also carries read markers (replacing the smart-markers IQ) and member presence |
| `getContactList()` (IQ roster) | its only effect (`rosterCallback`): one `getLastActivity(jid)` IQ **per contact** to seed presence/last activity | roster removed by the backend, no replacement needed: `online`/`lastActivity` arrive in the same `GET /inbox` (`room.members[]`) |
| `setOnline()` (`<presence/>`) | announce presence to contacts | no outbound presence action exists in the protocol: opening the events WebSocket announces you, closing your last socket marks you offline (no grace period) |
| `getFeatures()` (disco#info) | populates `xmppClient.features`; its real consumer is the pin capability check (`features.includes('zextras:iq:pin')`) | `chatClient.features` returns `['zextras:iq:pin']` |

### Affected Files

- 'src/network/chatClient/ChatClient.ts' (new façade)
- 'src/network/sdk/wscSdk.ts' (SDK ports + StoreBridge adapter)
- 'src/network/websocket/wsChatEventsRouter.ts' (new)
- 'src/network/websocket/wsEventsHandler.ts', 'src/network/websocket/eventHandlersUtilities.ts'
- 'src/types/network/websocket/wsEvents.ts'
- 'src/MainApp.tsx' (supportedVersions + boot through the façade)
- 'src/network/chatClient/inboxRefresh.ts' (boot inbox after the first `WebsocketConnected`, serialized refreshes)
- 'src/utils/FetchUtils.ts' (version renegotiation fallback)
- ~20 UI call sites (mechanical `xmppClient` → `chatClient` rename)

---

## Version 1.6.15

### Changes

- **API**: New `PUT /meetings/${meetingId}/media/quality` endpoint to request the simulcast substream received for a participant's video feed
- **WebSocket**: New `UplinkStatusUpdate` client message to share the own connection quality (`networkScore`, `maxUplinkTier`, `maxHardwareTier`, `changedAt`, optional `to` recipient) and new `MeetingParticipantUplinkStatusChanged` event that relays it to the meeting participants
- **Attributes**: New `videoSimulcastTiers` session attribute with the simulcast tiers to publish. Without it the webcam is published with a single encoding
- Connection quality (indicator, status updates and downlink quality requests) is enabled only for api version >= 1.6.15

### Affected Files

- 'src/network/apis/MeetingsApi.ts' on function `requestVideoQuality`
- 'src/network/websocket/WebSocketClient.ts' on function `sendUplinkStatusUpdate`
- 'src/network/websocket/wsMeetingEventHandlers/MeetingParticipantUplinkStatusChangedEventHandler.ts'
- 'src/network/webRTC/connectionQualityScore.ts' on function `isConnectionQualitySupported`
- 'src/network/webRTC/ConnectionQualityMonitor.ts'
- 'src/network/webRTC/VideoScreenInConnection.ts'
- 'src/network/webRTC/VideoOutConnection.ts'
- 'src/meetings/components/tile/ConnectionQualityIndicator.tsx'

---

## Version 1.6.14

### Changes

- **API**: `GET /rooms/${roomId}/attachments` accepts the new `mimeTypeCategory` param (`IMAGES`, `VIDEOS`, `DOCUMENTS`), alternative to `mimeType`, and returns the `total` number of attachments. The media gallery requires api version >= 1.6.14
- **API**: New video thumbnail preview `GET /preview/video/${fileId}/${area}/thumbnail`

### Affected Files

- 'src/network/apis/RoomsApi.ts' on function `getRoomAttachments`
- 'src/network/apis/AttachmentsApi.ts' on function `getVideoThumbnailURL`
- 'src/hooks/useMediaGalleryAttachments.ts'
- 'src/chats/components/infoPanel/ConversationInfoPanel.tsx'

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
