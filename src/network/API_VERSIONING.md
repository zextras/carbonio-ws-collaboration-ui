# API & WebSocket Versioning Log

This document tracks internal changes related to API versioning, renamed events, and modified files.

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
