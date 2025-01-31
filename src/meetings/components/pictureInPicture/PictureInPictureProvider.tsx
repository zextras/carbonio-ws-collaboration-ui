/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

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

	// Close pipWidnow programmatically
	const closePipWindow = useCallback(() => {
		if (pipWindow != null) {
			pipWindow.close();
			setPipWindow(null);
		}
	}, [pipWindow]);

	const styleSheet = useCallback((pip) => {
		[...document.styleSheets].forEach((styleSheet) => {
			try {
				const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
				console.log(cssRules);
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

	// Open new pipWindow
	const requestPipWindow = useCallback(
		async (width: number, height: number) => {
			// We don't want to allow multiple requests.
			if (pipWindow != null) {
				return;
			}

			const pip = await window.documentPictureInPicture.requestWindow({
				width,
				height
			});

			// Detect when window is closed by user
			pip.addEventListener('pagehide', () => {
				setPipWindow(null);
			});

			// It is important to copy all parent widnow styles. Otherwise, there would be no CSS available at all
			// https://developer.chrome.com/docs/web-platform/document-picture-in-picture/#copy-style-sheets-to-the-picture-in-picture-window

			if (document.readyState === 'complete') {
				styleSheet(pip);
				setPipWindow(pip);
			}

			const forceRepaint = () => {
				pip.document.body.style.display = 'none';
				requestAnimationFrame(() => {
					pip.document.body.style.display = 'block';
				});
			};

			setTimeout(forceRepaint, 1000); // Forza il repaint dopo 1s
		},
		[pipWindow, styleSheet]
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
