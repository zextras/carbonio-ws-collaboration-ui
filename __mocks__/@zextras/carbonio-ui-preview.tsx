/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createContext, useContext } from 'react';

export interface PreviewManagerContextType {
	createPreview: (item: any) => void;
	initPreview: (items: any[]) => void;
	openPreview: (id: string) => void;
	emptyPreview: () => void;
}

const defaultContextValue: PreviewManagerContextType = {
	createPreview: () => {},
	initPreview: () => {},
	openPreview: () => {},
	emptyPreview: () => {}
};

export const PreviewsManagerContext = createContext<PreviewManagerContextType>(defaultContextValue);

export const usePreviewsManagerContext = (): PreviewManagerContextType =>
	useContext(PreviewsManagerContext);
