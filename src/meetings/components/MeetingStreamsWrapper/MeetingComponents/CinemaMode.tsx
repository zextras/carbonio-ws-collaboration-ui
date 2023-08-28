/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import StreamsCarousel from './StreamsCarousel';
import {
	getLocalVideoSteam,
	getMeetingCarouselVisibility,
	getMeetingSidebarStatus
} from '../../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../../store/Store';

const MainStreamWrapper = styled(Container)`
	border-radius: 0.5rem;
`;

const MainVideo = styled.video`
	border-radius: 0.5rem;
	background: ${({ theme }): string => theme.palette.text};
	min-width: 100%;
	max-width: 100%;
	max-height: 100%;
`;

const CinemaMode = (): ReactElement => {
	const { meetingId }: Record<string, string> = useParams();

	const localVideoStream = useStore((store) => getLocalVideoSteam(store, meetingId));
	const isCarouselVisible = useStore((store) => getMeetingCarouselVisibility(store, meetingId));
	const sidebarStatus: boolean | undefined = useStore((store) =>
		getMeetingSidebarStatus(store, meetingId)
	);

	const [mainStreamHeight, setMainStreamHeight] = useState('0');
	const [mainStreamWidth, setMainStreamWidth] = useState('0');

	const mainStreamRef = useRef<HTMLDivElement>(null);
	const streamRef = useRef<null | HTMLVideoElement>(null);

	const calcMainStreamSize = useCallback(() => {
		if (mainStreamRef && mainStreamRef.current) {
			let idealHeight;
			let idealWidth;
			idealHeight = (mainStreamRef.current.offsetWidth / 16) * 9;
			idealWidth = mainStreamRef.current.offsetWidth;
			if (idealHeight > mainStreamRef.current.offsetHeight) {
				idealHeight = mainStreamRef.current.offsetHeight;
				idealWidth = (mainStreamRef.current.offsetHeight / 9) * 16;
			}
			setMainStreamHeight(`${idealHeight}px`);
			setMainStreamWidth(`${idealWidth}px`);
		}
	}, [mainStreamRef]);

	useEffect(() => {
		window.parent.addEventListener('resize', calcMainStreamSize);
		return () => window.parent.removeEventListener('resize', calcMainStreamSize);
	}, [calcMainStreamSize]);

	useEffect(
		() => calcMainStreamSize(),
		[mainStreamRef, calcMainStreamSize, sidebarStatus, isCarouselVisible]
	);

	useEffect(() => {
		if (streamRef != null && streamRef.current != null && localVideoStream != null) {
			streamRef.current.srcObject = localVideoStream;
		}
	}, [localVideoStream]);

	return (
		<Container data-testid="cinemaModeView" orientation="horizontal">
			<Container ref={mainStreamRef}>
				<MainStreamWrapper height="fit" width="fit" background="text">
					<MainVideo
						height={mainStreamHeight}
						width={mainStreamWidth}
						playsInline
						autoPlay
						controls={false}
						ref={streamRef}
					/>
				</MainStreamWrapper>
			</Container>
			<StreamsCarousel />
		</Container>
	);
};

export default CinemaMode;
