# Architecture Overview

`carbonio-ws-collaboration-ui` is a React/TypeScript module that is **loaded at runtime by the Carbonio Shell** (`@zextras/carbonio-shell-ui`) — it is not a standalone web app. The Shell provides routing, authentication, settings hosting, and a host-side API; this module registers feature surfaces, view components, and integrations into that Shell.

The codebase is organised as a small number of **macro components** that interact through a single Zustand store, a network façade, and a set of shared hooks/utilities. The two user-facing features — **Chats** and **Meetings** — are siblings that share infrastructure but own their own views, components, and transport handlers.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       Carbonio Shell (host)                              │
│  routing │ auth │ settings │ user account │ integrations │ snackbar     │
└──────────────────────────────────────────────────────────────────────────┘
                    ▲           ▲             ▲              ▲
          register routes    settings    integrations    auth/user info
                    │           │             │              │
┌──────────────────────────────────────────────────────────────────────────┐
│                          Module Bootstrap                                │
│           app.tsx → MainApp.tsx → init{Chats,Meetings,                   │
│                                       Integrations,Settings}             │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼──────────────────────────┐
        ▼                         ▼                          ▼
┌───────────────┐         ┌───────────────┐         ┌──────────────────┐
│   Chats UI    │         │  Meetings UI  │         │  Integrations &  │
│ (src/chats)   │         │ (src/meetings)│         │     Settings     │
└───────┬───────┘         └───────┬───────┘         └──────────────────┘
        │                         │
        ▼                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│            Shared Layer — hooks │ utils │ constants │ types              │
└──────────────────────────────────────────────────────────────────────────┘
        │                         │
        ▼                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│             Zustand Store  (src/store, 9 slices + selectors)             │
└──────────────────────────────────────────────────────────────────────────┘
        │                         │
        ▼                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│   Network Layer  (src/network)                                           │
│   REST (apis/) │ SOAP │ XMPP (Strophe) │ WebSocket │ WebRTC              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Module Bootstrap

Entry point and lifecycle glue between the Carbonio Shell and the module's feature code.

**Key files**
- [src/app.tsx](../src/app.tsx) — module root. Probes CE/license, then renders `MainApp` or `UnlicensedApp`.
- [src/MainApp.tsx](../src/MainApp.tsx) — bootstrap orchestrator. Reads the Shell user account, calls the four `init*` registrars, and brings up the network clients once auth is ready.
- [src/chats/initChats.tsx](../src/chats/initChats.tsx) — registers the Chats route, primary view, and secondary bar with `addRoute()`.
- [src/meetings/initMeetings.tsx](../src/meetings/initMeetings.tsx) — registers the Meetings route in `focusMode` (no secondary bar).
- [src/integrations/initIntegrations.tsx](../src/integrations/initIntegrations.tsx) — registers actions exported to other Carbonio modules (`SelectVirtualRoomWidget`, `CopyRoomWidget`) and a debounced quota-refresh listener.
- [src/settings/initSettings.ts](../src/settings/initSettings.ts) — registers the Chats settings view via `addSettingsView()`.

**Bootstrap order (MainApp)**
1. Capture user id/name from `useUserAccount()` and write to the Session slice.
2. Load supported API versions and set timezone/locale from user prefs.
3. On auth: `getToken()` → in parallel, `listRooms()` + `listMeetings()` to seed the store **before** opening real-time transports.
4. `getCapabilities()` (API ≥ 1.6.8), then flip `chatsBeStatus` to ready.
5. `xmppClient.connect(zmToken)` and `wsClient.connect()` to open the two event channels.
6. The four `init*` calls register UI surfaces with the Shell.

**How it interacts with everything else**
This layer is the *only* layer that talks directly to the Shell host APIs (`useUserAccount`, `addRoute`, `addSettingsView`, `getIntegratedFunction`). All other code reads from the store rather than calling the Shell, which keeps feature code testable in isolation.

---

## 2. Chats Feature Surface (`src/chats/`)

Text chat, rooms, attachments, search, and per-conversation info. Real-time transport is XMPP over WebSocket (Strophe.js); REST handles room/attachment CRUD.

**Folder layout** (~199 files)
- [src/chats/initChats.tsx](../src/chats/initChats.tsx) — registers route `CHATS_ROUTE`, the lazy `MainView`, and a `SecondaryBar`.
- [src/chats/views/](../src/chats/views/) — top-level pages: `MainView` (routes), `RoomView` (Chat + ConversationInfoPanel split), `DefaultView` / `DefaultUserView` (empty/onboarding states), shimmer placeholders.
- [src/chats/components/](../src/chats/components/) — feature components grouped by sub-surface.

**Detail components (component groupings)**
| Subfolder | Purpose |
|---|---|
| `conversation/` | Message list, bubbles, bubble actions, read receipts, pinned messages, history loader, composer (input/upload/emoji), forward modal. |
| `infoPanel/` | Right-side panel: room metadata, participants accordion, **media gallery** (images/files), conversation actions (mute, leave, delete). |
| `secondaryBar/` | Left navigation: conversation list, filters, virtual-room widget, search/gallery list. |
| `creationModal/` | Modal flow for creating 1:1 and group chats. |
| `searchPanel/` | Full-text message search UI. |
| `contactSelector/` | Participant picker used by group creation. |
| `userPopoverList/` | User avatar/status popovers used in several places. |

**How it interacts with the rest**
- Reads/writes rooms, messages, fastenings, markers, and the media gallery through Zustand selectors and slice actions.
- Sends/receives messages exclusively through `XMPPClient`; uses REST (`RoomsApi`, `AttachmentsApi`) for non-real-time operations.
- Shares the attachment-preview controller (`useAttachmentPreviewController`) and the `MediaGalleryStoreSlice` with the info-panel gallery — see the "Attachment preview architecture" section in [CLAUDE.md](../CLAUDE.md).

---

## 3. Meetings Feature Surface (`src/meetings/`)

Video meetings, screen share, picture-in-picture, sidebar. Transport is WebRTC + Janus-style selective forwarding, with control events arriving over WebSocket.

**Folder layout** (~119 files)
- [src/meetings/initMeetings.tsx](../src/meetings/initMeetings.tsx) — registers route `MEETINGS_ROUTE` with `visible: false` and `focusMode: true`.
- [src/meetings/views/](../src/meetings/views/) — `MeetingMainView` (RouterContext dispatcher), `MeetingSkeleton` (in-meeting layout), `MeetingAccessPage` (pre-join media check), `AccessPage` (idle), `InfoPage` (post-meeting screens), plus mobile and shimmer variants.
- [src/meetings/contexts/routerContext.ts](../src/meetings/contexts/routerContext.ts) — `RouterContext` + an enum of routes (`MAIN`, `MEETING`, `MEETING_ACCESS_PAGE`, `EXTERNAL_ACCESS_PAGE`, `INFO`) and info-page sub-types (`hang_up`, `room_empty`, `unauthenticated`, …).
- [src/meetings/components/](../src/meetings/components/) — UI components grouped by sub-surface.

**Detail components**
| Subfolder | Purpose |
|---|---|
| `sidebar/` | Collapsible right panel — Participants, Meeting Chat, Recording, Raise Hand, Visual Effects, Waiting List. |
| `meetingActionsBar/` | Bottom toolbar — camera / mic / screen-share toggles, hang up, settings. |
| `meetingAccessPoint/` | Pre-join media device selection and preview. |
| `cinemaMode/`, `gridMode/`, `faceToFaceMode/` | Three layouts for the main video stage; the active layout is chosen based on participant count. |
| `tile/` | Reusable participant tile (video / avatar + name + speaking indicator). |
| `pictureInPicture/` | PiP provider and floating view (`PiPProvider` is also installed in test helpers). |
| `virtualBackground/` | Blur / image background applied to the local video track. |
| `whoIsSpeaking/`, `bubblesWrapper/`, `headerMeetingButton/`, `mobile/` | Active-speaker indicator, in-meeting chat bubbles, "join meeting" shortcut, mobile-specific variants. |

**How it interacts with the rest**
- Navigates via the local `RouterContext`, **not** React Router — meetings have a state-machine flow (access → meeting → info) rather than URL-driven routing.
- Drives WebRTC through the connection wrappers in `src/network/webRTC/` and observes server-side events via `WebSocketClient`.
- All meeting state (tiles, layout, recording, waiting list, audio/video toggles) lives in `ActiveMeetingSlice`; the meeting list itself lives in `MeetingsStoreSlice`.

---

## 4. Network Layer (`src/network/`)

A façade over four transports plus a thin SOAP client. All call sites import from [src/network/index.ts](../src/network/index.ts).

**Detail components**
- **[src/network/apis/](../src/network/apis/)** — REST clients: `RoomsApi`, `MeetingsApi`, `AttachmentsApi`, `UsersApi`, `InfoApi`. All use `fetchAPI` from [src/utils/FetchUtils.ts](../src/utils/FetchUtils.ts).
- **[src/network/xmpp/](../src/network/xmpp/)** — `XMPPClient` singleton (Strophe.js) for chat/presence.
  - `handlers/` — inbound stanza dispatchers (`newMessageHandler`, `historyMessageHandler`, `presenceHandler`, `composingMessageHandler`, `smartMarkersHandler`, `inboxMessageHandler`).
  - `iqCallbacks/` — IQ response callbacks (`rosterCallback`, `requestHistoryCallback`, `requestHistoryWithBackfillCallback`, `fullHistoryCallback`, `lastActivityCallback`, `smartMarkersCallback`, `errorCallback`).
  - `utility/` — `HistoryAccumulator`, `decodeXMPPMessageStanza`, `decodeJid`, `sanitizeXmppMessage`, browser-notification helpers.
- **[src/network/websocket/](../src/network/websocket/)** — `WebSocketClient` singleton; primary backend event channel (separate from XMPP, used heavily by meetings). Includes a `wsMeetingEventHandlers/` sub-tree with one handler per server event.
- **[src/network/webRTC/](../src/network/webRTC/)** — `VideoOutConnection`, `VideoScreenInConnection`, `ScreenOutConnection`, `BidirectionalConnectionAudioInOut`, plus `SubscriptionsManager` and `PendingSubscriptionManager` for selective forwarding. Configuration in `PeerConnConfig` / `TurnCredentials`.
- **[src/network/soap/](../src/network/soap/)** — `SearchUsersByFeatureRequest` (user search via `@zextras/carbonio-ui-soap-lib`).

**How it interacts with the rest**
- Singletons (`xmppClient`, `wsClient`) are owned by the bootstrap layer and shared across the app.
- All handlers write into the Zustand store via slice actions — UI components react via selectors and never touch the network singletons directly.

---

## 5. State Layer (`src/store/`)

Single Zustand store composed of independent slice creators, with **immer** producers and devtools action labels. A subset is persisted to `localStorage` with a 2-day TTL — see `partialize` in [src/store/Store.ts](../src/store/Store.ts).

**Detail components — slices** (in [src/store/slices/](../src/store/slices/))
| Slice | Domain |
|---|---|
| `SessionStoreSlice` | Logged-in user, API version, capabilities, export status. |
| `UsersStoreSlice` | User directory (id, email, name, online, lastActivity). |
| `RoomsStoreSlice` | Rooms/groups: members, settings, room type, attached meeting id. |
| `ChatsRegistryStoreSlice` | Per-room: messages, unread, fastenings (reactions/replies), markers, search, backfill queue. |
| `ActiveConversationsSlice` | Currently open conversation, selected fastening, preview attachment. |
| `ConnectionsStoreSlice` | XMPP / WebSocket connection status. |
| `MeetingsStoreSlice` | Meeting list and metadata. |
| `ActiveMeetingSlice` | Live meeting state: local & remote participants, tiles, A/V toggles, recording, waiting list. |
| `MediaGalleryStoreSlice` | Paginated attachment gallery shared by the info panel and the bubble-preview flow. |

**Detail components — selectors** ([src/store/selectors/](../src/store/selectors/))
Pure `(store, …) => T` functions, one file per slice (`RoomsSelectors`, `ChatsRegistrySelectors`, `ActiveMeetingSelectors`, `MediaGallerySelectors`, …). Components use them as `useStore((s) => getX(s, …))`. The Zustand v5 reference-stability gotcha (frozen `EMPTY` fallback) is documented in [CLAUDE.md](../CLAUDE.md).

**How it interacts with the rest**
- Network handlers and feature components are the two main writers; selectors are the only read path.
- The Zustand mock in [__mocks__/zustand.ts](../__mocks__/zustand.ts) auto-resets each store to its initial state before every test, so tests can call `useStore.getState().someAction(...)` freely.

---

## 6. Shared Layer

Cross-cutting hooks, utilities, constants, and types used by both Chats and Meetings.

**Detail components**
- **[src/hooks/](../src/hooks/)** — ~44 hooks. Notable groups:
  - *Chat/message* — `useMessage`, `usePinMessage`, `useAttachmentPreviewController`, `useChatAttachmentsForPreview`, `useGalleryPreview`, `useBubbleAttachmentPreview`, `useConfigurationMessageLabel`, `useIsWritingLabel`.
  - *Meetings/media* — `useGeneralMeetingControls`, `useMuteForAll`, `useMediaDevices`, `useVirtualBackground`, `useTiles`, `usePinnedTile`, `usePipWindow`, `useFullScreen`.
  - *Generic UI* — `useEventListener`, `useContainerDimensions`, `useMediaQueryCheck`, `usePagination`, `useTimer`, `useLocalStorage`, `useFilterRoomsOnInput`, `useDarkReader`, `useRouting`.
- **[src/utils/](../src/utils/)** — ~27 modules. Key entries:
  - `FetchUtils` (HTTP wrapper + file upload), `dateUtils`, `textUtils`, `attachmentUtils`, `MeetingsUtils`, `UserMediaManager` (getUserMedia/permissions), `UserDataRetriever` (async user fetch + cache), `parseUrlOnMessage`, `calcReads`, `BrowserUtils`, `localStorageUtils`, `mediaGalleryUtils`.
- **[src/constants/](../src/constants/)** — `appConstants` (`CHATS_ROUTE`, `MEETINGS_ROUTE`, `LARGE_MEETING_THRESHOLD`, custom event names like `QUOTA_CHANGED_EVENT`).
- **[src/types/](../src/types/)** — ambient types (`custom.d.ts`, `i18next.d.ts`), domain types under `store/` and `network/`, plus `pipTypes`.

**How it interacts with the rest**
- Hooks are the canonical entry point from feature components into the store and network layers — components rarely import from `network/` directly.
- Utilities are pure and have no module-level state, which keeps them safe to import anywhere.

---

## 7. Integrations & Settings

Surfaces this module exposes to the rest of Carbonio.

- **[src/integrations/initIntegrations.tsx](../src/integrations/initIntegrations.tsx)** — registers `SelectVirtualRoomWidget` (when `videoCallEnabled`) and `CopyRoomWidget`, and attaches a 2-second debounced quota-refresh listener that calls the Shell's `storages-refresh-quota` action.
- **[src/settings/initSettings.ts](../src/settings/initSettings.ts)** — registers the lazy `SettingsView` under the Chats route via `addSettingsView()`.

---

## 8. Tests (`src/tests/`)

Vitest + jsdom. Worth knowing for anyone navigating the codebase:
- [src/tests/setupTests.ts](../src/tests/setupTests.ts) — enables `failOnConsole`, installs global mocks (zustand, shell, preview, darkreader, react-router-dom), stubs WebRTC / `MediaStream` / `IntersectionObserver` / `ResizeObserver` / `matchMedia` / `Worker` / `navigator.mediaDevices`, and turns on fake timers.
- [src/tests/test-utils.tsx](../src/tests/test-utils.tsx) — `setup(<Component/>)` helper that wraps with `I18nextProvider`, `ThemeProvider`, `ModalManager`, `PiPProvider`, `SnackbarManager` and a fake-timer-aware `userEvent` instance.

---

## Cross-cutting interaction patterns

1. **Server → store → UI is one-way.** Network handlers (XMPP, WebSocket) write into slices via Immer producers; components subscribe via selectors. Components never call network handlers directly — they invoke API functions from `src/network` or store actions.
2. **Two real-time channels.** XMPP carries chat/presence; WebSocket carries meeting events and other backend signals. Both must be connected before the UI is considered ready.
3. **Two navigation models.** Chats uses Shell routing (`addRoute` + React Router under `MainView`); Meetings uses a local `RouterContext` state machine because it needs to model pre-join / in-call / post-call as distinct phases.
4. **Shared store across features.** `MediaGalleryStoreSlice` is the canonical example — both the info-panel gallery and the in-bubble preview read from the same paginated list, with two different hook adapters on top.
