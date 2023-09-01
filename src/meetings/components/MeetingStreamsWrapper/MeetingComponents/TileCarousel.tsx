/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Padding } from '@zextras/carbonio-design-system';
import React, { ReactElement, useEffect, useRef } from 'react';
import styled from 'styled-components';

import { getLocalVideoSteam } from '../../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../../store/Store';

const Stream = styled(Container)`
	border-radius: 0.5rem;
`;

const TileVideo = styled.video`
	width: 16rem;
	height: 9rem;
	border-radius: 0.5rem;
	background: ${({ theme }): string => theme.palette.text};
`;

type TileExamplePros = {
	meetingId: string;
	tileTitle: string;
};

const TileExample = ({ meetingId, tileTitle }: TileExamplePros): ReactElement => {
	const localVideoStream = useStore((store) => getLocalVideoSteam(store, meetingId));

	const streamRef = useRef<null | HTMLVideoElement>(null);

	useEffect(() => {
		if (streamRef != null && streamRef.current != null && localVideoStream != null) {
			streamRef.current.srcObject = localVideoStream;
		}
	}, [localVideoStream]);

	return (
		<>
			<Stream data-testid="myStreamContainer" height="fit" width="fit" background="text">
				<TileVideo playsInline autoPlay controls={false} ref={streamRef}>
					Your browser does not support the <code>video</code> element.
				</TileVideo>
				<span>{tileTitle}</span>
			</Stream>
			<Padding bottom="small" />
		</>
	);
};
export default TileExample;
