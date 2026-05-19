/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createContext, useContext } from 'react';

export type PreviewItem = {
	id: string;
	[key: string]: any;
};

export interface PreviewManagerContextType {
	createPreview: (item: any) => void;
	initPreview: (items: any[]) => void;
	openPreview: (id: string) => void;
	emptyPreview: () => void;
	previews: PreviewItem[];
	currentIndex: number;
}

const defaultContextValue: PreviewManagerContextType = {
	createPreview: () => {},
	initPreview: () => {},
	openPreview: () => {},
	emptyPreview: () => {},
	previews: [],
	currentIndex: -1
};

export const PreviewsManagerContext = createContext<PreviewManagerContextType>(defaultContextValue);

export const usePreviewsManagerContext = (): PreviewManagerContextType =>
	useContext(PreviewsManagerContext);
