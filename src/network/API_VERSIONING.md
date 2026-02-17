# API & WebSocket Versioning Log

This document tracks internal changes related to API versioning, renamed events, and modified files.

## Version 1.6.7
### Changes
- **XMPP**: Added `roomHistoryCleared` configuration message

### Affected Files
- 'src/meetings/components/sidebar/MeetingConversationAccordion/MeetingConversationAccordion.tsx'

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
