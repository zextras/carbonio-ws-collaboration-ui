/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, {
	createContext,
	JSX,
	ReactPortal,
	useCallback,
	useEffect,
	useMemo,
	useState
} from 'react';

import { createPortal } from 'react-dom';

import { PiPContextType, PiPProviderProps, PiPWindowProps } from '../../../types/pipTypes';

export const PiPContext = createContext<PiPContextType | undefined>(undefined);

export const PiPProvider = ({ children }: PiPProviderProps): JSX.Element => {
	const isSupported = 'documentPictureInPicture' in window;
	const [pipWindow, setPipWindow] = useState<Window | null>(null);

	const closePipWindow = useCallback(() => {
		if (pipWindow != null) {
			pipWindow.close();
			setPipWindow(null);
		}
	}, [pipWindow]);

	const handleClose = useCallback(() => {
		setPipWindow(null);
	}, []);

	useEffect(() => {
		if (!pipWindow) {
			return (): void => {};
		}

		pipWindow.addEventListener('pagehide', handleClose);

		return (): void => pipWindow.removeEventListener('pagehide', handleClose);
	}, [handleClose, pipWindow]);

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

	useEffect(() => {
		if (pipWindow) styleSheet(pipWindow);
	}, [pipWindow, styleSheet]);

	const requestPipWindow = useCallback(
		async (width: number, height: number) => {
			if (pipWindow != null) return;
			// @ts-expect-error this api is an advanced one that is not supported in every browser
			const pip = await window.documentPictureInPicture.requestWindow({ width, height });

			setPipWindow(pip);
		},
		[pipWindow]
	);

	// ExternalLink

	const value = useMemo(
		() => ({
			isSupported,
			pipWindow,
			requestPipWindow,
			closePipWindow
		}),
		[isSupported, pipWindow, requestPipWindow, closePipWindow]
	);

	return <PiPContext.Provider value={value}>{children}</PiPContext.Provider>;
};

export const PiPWindow = ({ pipWindow, children }: PiPWindowProps): ReactPortal =>
	createPortal(children, pipWindow.document.body);
