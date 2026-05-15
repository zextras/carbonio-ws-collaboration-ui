# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository

`carbonio-ws-collaboration-ui` — the Chats and Meetings module of Zextras Carbonio. It is loaded at runtime by `@zextras/carbonio-shell-ui` and is **not** a standalone web app. The Shell provides routing, auth, settings, and host APIs; this module registers itself into that shell.

For a deeper, macro-component breakdown of the codebase (Chats, Meetings, Network, Store, Shared, Integrations/Settings, Tests) and how they interact, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Commands

Package manager is pinned: **pnpm 10.32.1** (declared in `packageManager`). Node version pinned in `.nvmrc` (v22).

| Task | Command |
|---|---|
| Install dependencies | `pnpm install` |
| Run dev / watch (Carbonio SDK) | `pnpm start` (= `sdk watch`) |
| Build module | `pnpm run build` (= `sdk build`) |
| Dev build with timestamped release | `pnpm run build:dev` |
| Deploy to local Carbonio container | `pnpm run deploy:local` |
| Type-check (no emit) | `pnpm run type-check` |
| Type-check watch | `pnpm run type-check:watch` |
| Lint | `pnpm run lint` |
| Lint, errors only | `pnpm run lint:noWarning` |
| Run all tests | `pnpm test` (= `vitest run`) |
| Watch tests | `pnpm run test:watch` |
| Tests with UI | `pnpm run test:ui` |
| Tests with coverage | `pnpm run test:coverage` |
| Run a single test file | `npx vitest run path/to/file.test.tsx` |
| Run tests matching a name | `npx vitest run -t "test name fragment"` |

Build is wrapped by the Carbonio UI SDK (`@zextras/carbonio-ui-sdk`); do not invoke webpack/vite directly. Webpack config extensions live in `carbonio.webpack.js`.

## Zustand v5 reference-stability gotcha

Default `useStore` selector uses `Object.is` for change detection. A selector that returns a **fresh array/object literal** on every call (e.g. `state.foo ?? []`) will appear to change every render and can trigger infinite re-renders for any component that mounts before the underlying slice is initialized.

Fix pattern (used in `MediaGallerySelectors.ts` and similar):
```ts
const EMPTY: ReadonlyArray<Attachment> = Object.freeze([]);
export const getX = (s, roomId) => s.foo[roomId]?.items ?? (EMPTY as Array<Attachment>);
```

## Attachment preview architecture

Preview overlay is from `@zextras/carbonio-ui-preview` (`PreviewsManagerContext`, `initPreview`, `currentIndex`). Two consumers — the media gallery panel and the chat-bubble preview — share a single generic controller and a single store slice:

- `useAttachmentPreviewController({ source, onAttachmentRemoved })` (`src/hooks/useAttachmentPreviewController.tsx`) owns navigation, the auto-loadMore effect, and the delete-edge-case logic. `source.prefetchAt: 'start' | 'end'` flips the prefetch trigger so callers can use either order.
- `useGalleryPreview(roomId)` is a thin adapter feeding the gallery's filtered list with `prefetchAt: 'end'` (newest→oldest, gallery's natural order).
- `useBubbleAttachmentPreview(roomId)` (called once in `Chat.tsx`) reverses the same underlying list and uses `prefetchAt: 'start'` (oldest→newest, chat order). `onPreviewClick(attachmentId)` first paginates until the clicked id is loaded, then opens it.
- The "All / My attachments" filter in the gallery is **client-side** — the API is always called unfiltered. Both flows share `MediaGalleryStoreSlice`, so pages loaded by either are reused by the other.
- The `DeleteAttachmentModal` is rendered once at the consumer level (`MediaGalleryTab` for the gallery, `Chat.tsx` for bubbles). The bubble-side `onPreviewClick` is exposed to `BubbleActions` and `AttachmentView` via `BubbleAttachmentPreviewContext`, provided once in `Chat.tsx` — the intermediate components (`MessagesList`, `MessageFactory`, `Bubble`) do not see it. Default context value is `undefined` so the same `AttachmentView` rendered outside a chat tree (e.g. `MeetingBubble`) falls back to single-item `usePreview`.

## Testing

Runner is **Vitest** with jsdom (not Jest, despite the presence of `babel.config.jest.js`).

### Setup file: `src/tests/setupTests.ts`
- **`failOnConsole` is enabled with `shouldFailOnError` and `shouldFailOnWarn`.** Any `console.error` or `console.warn` in a test will fail it. Either fix the cause, or silence with `vi.spyOn(console, 'error').mockImplementation(() => undefined)`.
- Global mocks: `zustand`, `@zextras/carbonio-shell-ui`, `@zextras/carbonio-ui-preview`, `darkreader`, `react-router-dom`. The corresponding mock implementations are under `__mocks__/`.
- The **zustand mock auto-resets every store back to its initial state before each test** (`__mocks__/zustand.ts`). This means you can mutate the store freely inside a test via `useStore.getState().someAction(...)` and the next test starts clean. It also means: do not rely on store state leaking across `test()` blocks.
- Fake timers are enabled globally (`vi.useFakeTimers({ shouldAdvanceTime: true })`).
- Many browser/WebRTC globals are stubbed: `RTCPeerConnection`, `MediaStream`, `AudioContext`, `IntersectionObserver`, `ResizeObserver`, `matchMedia`, `Worker`, `navigator.mediaDevices`.

### Render helper: `src/tests/test-utils.tsx`
- Use `setup(<Component />)` rather than `render` directly. It wraps with `I18nextProvider`, `ThemeProvider`, `ModalManager`, `PiPProvider`, `SnackbarManager`, and returns `{ user, ...renderResult }` where `user` is a `userEvent` instance already wired to the fake timers.
- `screen`, `within` re-exports include custom queries from `src/tests/custom-queries.ts`.
- `triggerObserver(element)` fires an `IntersectionObserver` callback for components that load on scroll (e.g. paginated lists).
- `routerContextSetup` wraps the meeting `RouterContext` for meeting-page tests.

### i18n in tests
Translations go through a test factory (`I18nTestFactory`). User-facing strings use `t('key', 'default')`; tests should assert against the default English string.

## Code style

- **Tabs** for indentation. Prettier config extends `@zextras/carbonio-ui-configs`.
- ESLint extends `@zextras/carbonio-ui-configs/rules/eslint.js`. `eqeqeq: smart`, `prefer-const` with destructuring, `react/jsx-no-useless-fragment: error`, `@typescript-eslint/no-explicit-any: warn`.
- **Every source file requires a SPDX header** (enforced by `notice/notice` against `notice.template.ts`). New files must start with the AGPL-3.0-only header.
- The `notice` rule is the most common autofix needed when creating new files — `eslint --fix` will add the header from the template.

## Carbonio module specifics
- Module metadata lives in `package.json` under the `carbonio` key (display name, priority, feature flag `carbonioFeatureWscEnabled`).
- `pnpm run deploy:local` uploads the built bundle to a local Carbonio container; container name defaults to `carbonio-advanced-carbonio-composed-ui-1` and can be overridden via `$CONTAINER`.
- `Jenkinsfile` and `Dockerfile` are infra; do not modify without coordination.
