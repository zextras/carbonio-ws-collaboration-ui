/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { RefObject, useCallback, useEffect, useState } from 'react';

const useContainerDimensions = (
	elementRef: RefObject<HTMLDivElement>
): { width: number; height: number } => {
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

	const handleResize = useCallback((entries: ResizeObserverEntry[]): void => {
		const { width, height } = entries[0].contentRect;
		setDimensions({ width, height });
	}, []);

	useEffect(() => {
		const observer = new ResizeObserver(handleResize);
		if (elementRef?.current) {
			observer.observe(elementRef.current);
		}
		return () => {
			observer?.disconnect();
		};
	}, [elementRef, handleResize]);

	return dimensions;
};
export default useContainerDimensions;
