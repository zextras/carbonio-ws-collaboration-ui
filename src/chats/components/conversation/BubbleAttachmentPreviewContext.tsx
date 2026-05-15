/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createContext } from 'react';

export type BubbleAttachmentPreviewContextValue = {
	onPreviewClick: (attachmentId: string) => void;
};

// undefined default signals "no provider in tree" — consumers (AttachmentView)
// fall back to single-item usePreview when rendered outside a chat, e.g. MeetingBubble.
export const BubbleAttachmentPreviewContext = createContext<
	BubbleAttachmentPreviewContextValue | undefined
>(undefined);
