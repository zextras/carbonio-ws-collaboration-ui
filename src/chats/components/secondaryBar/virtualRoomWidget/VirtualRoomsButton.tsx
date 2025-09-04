/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useRef, useState } from 'react';

import styled from '@emotion/styled';
import { Button, Container, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import VirtualRoomsList from './VirtualRoomsList';
import { getIfThereAreActiveVirtualRooms } from '../../../../store/selectors/MeetingSelectors';
import useStore from '../../../../store/Store';

type virtualRoomsButtonProps = {
	expanded: boolean;
};

const ActiveMeetingDot = styled.div`
	position: absolute;
	width: 0.313rem;
	height: 0.313rem;
	background-color: ${({ theme }): string => theme.palette.error.regular};
	border: 0.0625rem solid ${(props): string => props.theme.palette.error.regular};
	border-radius: 50%;
	left: 6.78rem;
	bottom: 1.62rem;
	animation: blink 1.5s linear infinite;

	@keyframes blink {
		0% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
		100% {
			opacity: 1;
		}
	}
`;

const VirtualRoomsButton: FC<virtualRoomsButtonProps> = ({ expanded }) => {
	const [t] = useTranslation();
	const virtualRoomsLabel = t('meeting.virtual.buttonLabel', 'Your Virtual Rooms');

	const areThereActiveMeeting = useStore((store) => getIfThereAreActiveVirtualRooms(store));

	const [listVisibility, setListVisibility] = useState(false);

	const parentRef = useRef<HTMLDivElement>(null);

	const handleOnClick = useCallback(() => {
		setListVisibility((prevState: boolean) => !prevState);
	}, []);

	return expanded ? (
		<>
			<Container padding="0.5rem" height="fit" background={'gray5'}>
				<Button
					label={virtualRoomsLabel}
					color="primary"
					type={areThereActiveMeeting ? 'default' : 'outlined'}
					width="fill"
					onClick={handleOnClick}
					ref={parentRef}
					icon={areThereActiveMeeting ? 'Video' : undefined}
					iconPlacement="left"
				/>
				{areThereActiveMeeting && <ActiveMeetingDot />}
			</Container>
			{listVisibility && (
				<VirtualRoomsList setListVisibility={setListVisibility} parentRef={parentRef} />
			)}
		</>
	) : (
		<Container padding="0.5rem" height="fit" background={'gray5'}>
			<Tooltip label={virtualRoomsLabel}>
				<Button
					icon="VideoOutline"
					size="large"
					onClick={handleOnClick}
					type="outlined"
					labelColor="primary"
					backgroundColor="gray6"
				/>
			</Tooltip>
		</Container>
	);
};

export default VirtualRoomsButton;
