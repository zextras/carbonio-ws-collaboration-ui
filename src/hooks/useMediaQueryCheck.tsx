/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useState, useEffect } from 'react';

const useMediaQueryCheck = (): boolean => {
	const [matches, setMatches] = useState(false);
	const mediaQuery = '(min-width: 64rem)';

	useEffect(() => {
		const media = window.matchMedia(mediaQuery);
		if (media.matches !== matches) {
			setMatches(media.matches);
		}
		const listener = (): void => setMatches(media.matches);
		window.addEventListener('resize', listener);
		return () => window.removeEventListener('resize', listener);
	}, [matches, mediaQuery]);

	return matches;
};

export default useMediaQueryCheck;
