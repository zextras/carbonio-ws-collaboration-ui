/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { RefObject, useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { MeetingRoutesParams } from './useRouting';
import {
	getMeetingCarouselVisibility,
	getMeetingSidebarStatus
} from '../store/selectors/ActiveMeetingSelectors';
import useStore from '../store/Store';

const useContainerDimensions = (
	elementRef: RefObject<HTMLDivElement>
): { width: number; height: number } => {
	const { meetingId }: MeetingRoutesParams = useParams();
	const sidebarStatus: boolean = useStore((store) => getMeetingSidebarStatus(store, meetingId));
	const carouselStatus = useStore((store) => getMeetingCarouselVisibility(store, meetingId));

	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

	const handleResize = useCallback(() => {
		if (elementRef.current) {
			setDimensions({
				width: elementRef.current.offsetWidth,
				height: elementRef.current.offsetHeight
			});
		}
	}, [elementRef]);

	useEffect(() => handleResize(), [handleResize, sidebarStatus, carouselStatus]);

	useEffect(() => {
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [handleResize]);

	return dimensions;
};

// TODO try ResizeObserver
// https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
// const useContainerDimensions = (
// 	elementRef: RefObject<HTMLDivElement>
// ): { width: number; height: number } => {
// 	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
//
// 	const handleResize = useCallback((entries: ResizeObserverEntry[]): void => {
// 		const { width, height } = entries[0].contentRect;
// 		setDimensions({ width, height });
// 	}, []);
//
// 	useEffect(() => {
// 		const observer = new ResizeObserver(handleResize);
// 		if (elementRef?.current) {
// 			observer.observe(elementRef.current);
// 		}
// 		return (): void => {
// 			observer?.disconnect();
// 		};
// 	}, [elementRef, handleResize]);
//
// 	return dimensions;
// };

export default useContainerDimensions;
