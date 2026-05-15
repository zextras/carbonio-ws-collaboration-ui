# Remove `onAttachmentPreviewClick` prop drilling via context

**Branch:** `CO-3582-Chats-FE-Navigate-between-attachments-in-preview`
**PR:** [#726](https://github.com/zextras/carbonio-ws-collaboration-ui/pull/726)
**Date:** 2026-05-13

## Problem

In PR #726 the `onAttachmentPreviewClick` callback (returned by `useBubbleAttachmentPreview` in `Chat.tsx`) is prop-drilled through four layers that don't conceptually care about attachment preview:

```
Chat → MessagesList → MessageFactory → Bubble → { BubbleActions, AttachmentView }
                                                       ↓
                                        useBubbleContextualMenuDropDown
```

This pollutes props, types, and test fixtures of `MessagesList`, `MessageFactory`, and `Bubble` for a concern none of them owns.

## Why not "just duplicate"

The state behind the callback is genuinely shared and must be singleton-per-room:
- one `PreviewsManagerContext` registration (the shell is a singleton — multiple registrations clobber each other)
- one carousel index / `openedId`
- one auto-prefetch loop over the chat's attachment list
- one `DeleteAttachmentModal`

Calling `useBubbleAttachmentPreview` per-bubble would break the carousel-navigation feature the PR is built around and collapse it back to the pre-PR single-item `usePreview`. Duplication here removes a feature, so we use the next-best tool for "producer and consumers are far apart, middle is uninterested": React context.

## Plan

### 1. New context

Create `src/chats/components/conversation/BubbleAttachmentPreviewContext.tsx`:

```tsx
import { createContext } from 'react';

export type BubbleAttachmentPreviewContextValue = {
	onPreviewClick: (attachmentId: string) => void;
};

const noop = (): void => undefined;

export const BubbleAttachmentPreviewContext =
	createContext<BubbleAttachmentPreviewContextValue>({ onPreviewClick: noop });
```

Default value is a no-op so `Bubble`/`AttachmentView` rendered outside a chat tree (search results, pinned-message reference views, isolated tests) keep working.

SPDX header required (notice/notice).

### 2. Provide in `Chat.tsx`

At [Chat.tsx:173](../../src/chats/components/conversation/Chat.tsx#L173), wrap `<MessagesList>` with the provider. Memoize the value so consumers don't re-render every parent render:

```tsx
const previewContextValue = useMemo(
	() => ({ onPreviewClick: onAttachmentPreviewClick }),
	[onAttachmentPreviewClick]
);

<BubbleAttachmentPreviewContext.Provider value={previewContextValue}>
	<MessagesList roomId={roomId} />
</BubbleAttachmentPreviewContext.Provider>
```

`Chat.tsx` keeps owning the `useBubbleAttachmentPreview` hook, `pendingDelete`, and the `DeleteAttachmentModal` render. Nothing about the shared-state architecture changes.

### 3. Consume where actually needed

**`useBubbleContextualMenuDropDown.tsx`** ([file](../../src/chats/components/conversation/messageBubbles/bubbleActions/useBubbleContextualMenuDropDown.tsx))
- Remove the third `onAttachmentPreviewClick` parameter (line 39).
- Inside the hook: `const { onPreviewClick: onAttachmentPreviewClick } = useContext(BubbleAttachmentPreviewContext);`
- The internal `onPreviewClick` callback (line 79) stays.

**`BubbleActions.tsx`** ([file](../../src/chats/components/conversation/messageBubbles/bubbleActions/BubbleActions.tsx))
- Drop the `onPreviewClick` prop (line 59).
- Drop it from the `useBubbleContextualMenuDropDown(...)` call (line 63).

**`AttachmentView.tsx`** ([file](../../src/chats/components/conversation/messageBubbles/AttachmentView.tsx))
- Drop the optional `onPreviewClick` prop (line 135).
- Read from context: `const { onPreviewClick: externalOnPreviewClick } = useContext(BubbleAttachmentPreviewContext);`
- The `usePreview` fallback at lines 206–213 currently kicks in when the prop is undefined. With context the default is now a no-op, so the fallback path is unreachable from inside a chat. **Before deleting the fallback, grep for non-chat usages of `AttachmentView`** (e.g. reference-message views, search results). If any render `AttachmentView` outside a `BubbleAttachmentPreviewContext.Provider`, either:
  - (a) wrap those callers in their own provider with a `usePreview`-derived value, or
  - (b) keep the fallback and detect "no provider" by exporting a sentinel value from the context module (e.g. compare identity to the exported default `noop`), falling back to `usePreview` in that case.

  Decision can be made during implementation after greping. The previous commit `2c79178 refactor: remove useless preview fallback logic` already removed some of this — verify what's left.

### 4. Strip prop from couriers

- **`Bubble.tsx`** ([file](../../src/chats/components/conversation/messageBubbles/Bubble.tsx)): remove `onAttachmentPreviewClick` from `BubbleProps` (line 48), destructure (line 108), and the two passes at lines 240 and 263.
- **`MessageFactory.tsx`** ([file](../../src/chats/components/conversation/messageBubbles/MessageFactory.tsx)): remove from `MessageProps` (line 28), destructure (line 54), and the pass to `<Bubble>` (line 91).
- **`MessagesList.tsx`** ([file](../../src/chats/components/conversation/MessagesList.tsx)): remove from `ConversationProps` (line 52), destructure (line 55), the pass to `<MessageFactory>` (line 232), and the `useMemo` deps list (line 248).
- **`Chat.tsx`** ([file](../../src/chats/components/conversation/Chat.tsx)): remove the `onAttachmentPreviewClick={...}` attribute at line 173 (replaced by provider wrapping per step 2).

### 5. Tests

Touched test files (from current grep):
- `src/chats/components/conversation/MessagesList.test.tsx`
- `src/chats/components/conversation/messageBubbles/MessageFactory.test.tsx`
- `src/chats/components/conversation/messageBubbles/Bubble.test.tsx`
- `src/chats/components/conversation/footer/ReferenceMessageView.test.tsx`
- `src/chats/components/conversation/messageBubbles/bubbleActions/...` (any that pass `onPreviewClick` directly)

For each:
- Stop passing the now-removed prop.
- Tests that exercise "click preview from bubble" must wrap the tree in `<BubbleAttachmentPreviewContext.Provider value={{ onPreviewClick: spy }}>`. Consider adding a small helper in `src/tests/test-utils.tsx` (e.g. `setupWithPreviewContext(ui, { onPreviewClick })`) if more than ~3 tests need it.
- Tests that don't care about preview can rely on the default no-op.

Reminder: `failOnConsole` is on in `setupTests.ts` — any new warning will fail the test.

### 6. Type-check & lint sweep

After the edits, run:
```
pnpm run type-check
pnpm run lint
pnpm test
```

Expect the type-checker to surface any caller of `MessagesList` / `MessageFactory` / `Bubble` / `BubbleActions` / `AttachmentView` we missed.

### 7. CLAUDE.md update

Replace the paragraph in the "Attachment preview architecture" section that currently reads:

> The `DeleteAttachmentModal` is rendered once at the consumer level (`MediaGalleryTab` for the gallery, `Chat.tsx` for bubbles). `onPreviewClick` is prop-drilled from `Chat.tsx → MessagesList → MessageFactory → Bubble → AttachmentView/BubbleActions`. No React context is used for this.

with:

> The `DeleteAttachmentModal` is rendered once at the consumer level (`MediaGalleryTab` for the gallery, `Chat.tsx` for bubbles). The bubble-side `onPreviewClick` is exposed to `BubbleActions` and `AttachmentView` via `BubbleAttachmentPreviewContext`, provided once in `Chat.tsx` — the intermediate components (`MessagesList`, `MessageFactory`, `Bubble`) do not see it. Default context value is a no-op so the same components rendered outside a chat tree (e.g. reference views) still work.

## Out of scope

- The media gallery side (`MediaGalleryTab` + `useGalleryPreview`) — already self-contained, no drilling there.
- Refactoring the controller hook itself.
- Renaming `onPreviewClick` vs `onAttachmentPreviewClick` inconsistency (worth a separate small cleanup pass).

## Risk / rollback

- Single-PR-scoped change, no API surface, no store changes. Pure refactor.
- Rollback = `git revert`.
- Main risk: missing a test fixture that asserts `onPreviewClick` was called via the prop. Mitigation: step 6 type-check + grep for `onAttachmentPreviewClick` and `onPreviewClick` after edits.

## Order of operations (suggested)

1. Add the context file (step 1).
2. Wire the provider in `Chat.tsx` (step 2) — at this point old prop still works, both paths active.
3. Switch consumers to context (step 3).
4. Strip props from couriers (step 4) — type errors guide what's left.
5. Fix tests (step 5).
6. Type-check + lint + tests green (step 6).
7. CLAUDE.md (step 7).
8. Self-review the diff: `MessagesList`/`MessageFactory`/`Bubble` should have zero references to attachment preview after.
