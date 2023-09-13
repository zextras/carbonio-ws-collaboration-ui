/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { ReactElement, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import SidebarCarousel from './SidebarCarousel';
import useCentralTileDimensions from '../../../../../hooks/useCentralTileDimensions';
import { getLocalVideoSteam } from '../../../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../../../store/Store';

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
	const { meetingId }: { meetingId: string } = useParams();

	// TODO select stream to show
	const localVideoStream = useStore((store) => getLocalVideoSteam(store, meetingId));

	const mainTileRef = useRef<HTMLDivElement>(null);
	const streamRef = useRef<null | HTMLVideoElement>(null);

	const mainTileDimensions = useCentralTileDimensions(meetingId, mainTileRef);

	useEffect(() => {
		if (streamRef != null && streamRef.current != null) {
			if (localVideoStream) {
				streamRef.current.srcObject = localVideoStream;
			} else {
				streamRef.current.srcObject = null;
			}
		}
	}, [localVideoStream]);

	return (
		<Container data-testid="cinemaModeView" orientation="horizontal">
			<Container ref={mainTileRef}>
				<MainStreamWrapper height="fit" width="fit" background="text">
					<MainVideo
						height={mainTileDimensions.height}
						width={mainTileDimensions.width}
						playsInline
						autoPlay
						controls={false}
						ref={streamRef}
					/>
				</MainStreamWrapper>
			</Container>
			<SidebarCarousel />
		</Container>
	);
};

export default CinemaMode;
