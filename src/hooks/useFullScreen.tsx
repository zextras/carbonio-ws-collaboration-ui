/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect, useState } from 'react';

export type UseFullScreenHook = { isFullScreen: boolean; toggleFullScreen: () => void };

const useFullScreen = (): UseFullScreenHook => {
	const [isFullScreen, setIsFullScreen] = useState(false);

	const checkFullScreenStatus = (): void =>
		document.fullscreenElement /* || window.parent.document.webkitFullscreenElement */
			? setIsFullScreen(true)
			: setIsFullScreen(false);

	const toggleFullScreen = (): void => {
		!document.fullscreenElement && !isFullScreen
			? document.documentElement.requestFullscreen()
			: document.exitFullscreen();
	};

	useEffect(() => {
		window.addEventListener('fullscreenchange', checkFullScreenStatus);
		return (): void => {
			window.removeEventListener('fullscreenchange', checkFullScreenStatus);
		};
	}, []);

	return { isFullScreen, toggleFullScreen };
};

export default useFullScreen;
