/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { RefObject, useCallback, useEffect, useState } from 'react';

import {
	getMeetingCarouselVisibility,
	getMeetingSidebarStatus
} from '../store/selectors/ActiveMeetingSelectors';
import useStore from '../store/Store';

type Dimensions = { height: string; width: string };
const useCentralTileDimensions = (
	meetingId: string,
	tileRef: RefObject<HTMLElement>
): Dimensions => {
	const sidebarStatus: boolean = useStore((store) => getMeetingSidebarStatus(store, meetingId));
	const isCarouselVisible = useStore((store) => getMeetingCarouselVisibility(store, meetingId));

	const [dimensions, setDimensions] = useState({ height: '0', width: '0' });

	const getSizeOfCentralTile = useCallback(() => {
		if (tileRef && tileRef.current) {
			let height;
			let width;
			height = (tileRef.current.offsetWidth / 16) * 9;
			width = tileRef.current.offsetWidth;
			if (height >= tileRef.current.offsetHeight) {
				height = tileRef.current.offsetHeight;
				width = (tileRef.current.offsetHeight / 9) * 16;
			}
			setDimensions({ height: `${height}px`, width: `${width}px` });
		}
	}, [tileRef]);

	useEffect(() => {
		window.parent.addEventListener('resize', getSizeOfCentralTile);
		return () => window.parent.removeEventListener('resize', getSizeOfCentralTile);
	}, [getSizeOfCentralTile]);

	useEffect(
		() => getSizeOfCentralTile(),
		[tileRef, getSizeOfCentralTile, sidebarStatus, isCarouselVisible]
	);

	return dimensions;
};

export default useCentralTileDimensions;
