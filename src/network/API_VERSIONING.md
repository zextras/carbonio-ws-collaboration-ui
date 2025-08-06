# API & WebSocket Versioning Log

This document tracks internal changes related to API versioning, renamed events, and modified files.

---

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
