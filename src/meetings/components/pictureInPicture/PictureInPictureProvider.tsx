/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { createPortal } from 'react-dom';

type PiPContextType = {
	isSupported: boolean;
	pipWindow: Window | null;
	requestPipWindow: (width: number, height: number) => Promise<void>;
	closePipWindow: () => void;
};

const PiPContext = createContext<PiPContextType | undefined>(undefined);

type PiPProviderProps = {
	children: React.ReactNode;
};

export const PiPProvider = ({ children }: PiPProviderProps) => {
	// Detect if the feature is available.
	const isSupported = 'documentPictureInPicture' in window;

	// Expose pipWindow that is currently active
	const [pipWindow, setPipWindow] = useState<Window | null>(null);

	// Close pipWindow programmatically
	const closePipWindow = useCallback(() => {
		if (pipWindow != null) {
			pipWindow.close();
			setPipWindow(null);
		}
	}, [pipWindow]);

	const styleSheet = useCallback((pip: Window) => {
		[...document.styleSheets].forEach((styleSheet) => {
			try {
				const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
				const style = document.createElement('style');
				style.textContent = cssRules;
				pip.document.head.appendChild(style);
			} catch (e) {
				const link = document.createElement('link');
				link.rel = 'stylesheet';
				link.type = styleSheet.type;
				link.media = styleSheet.media.toString();
				link.href = styleSheet.href ?? '';
			}
		});
	}, []);

	// Copy styles only when pipWindow is available and already mounted
	useEffect(() => {
		if (pipWindow) styleSheet(pipWindow);
	}, [pipWindow, styleSheet]);

	// Open new pipWindow
	const requestPipWindow = useCallback(
		async (width: number, height: number) => {
			// We don't want to allow multiple requests.
			if (pipWindow != null) return;

			const pip = await window.documentPictureInPicture.requestWindow({
				width,
				height
			});

			// Detect when window is closed by user
			pip.addEventListener('pagehide', () => {
				setPipWindow(null);
			});

			setPipWindow(pip);
		},
		[pipWindow]
	);

	const value = useMemo(
		() => ({
			isSupported,
			pipWindow,
			requestPipWindow,
			closePipWindow
		}),
		[closePipWindow, isSupported, pipWindow, requestPipWindow]
	);

	return <PiPContext.Provider value={value}>{children}</PiPContext.Provider>;
};

export function usePiPWindow(): PiPContextType {
	const context = useContext(PiPContext);

	if (context === undefined) {
		throw new Error('usePiPWindow must be used within a PiPContext');
	}

	return context;
}

type PiPWindowProps = {
	pipWindow: Window;
	children: React.ReactNode;
};

export const PiPWindow = ({ pipWindow, children }: PiPWindowProps) =>
	createPortal(children, pipWindow.document.body);
