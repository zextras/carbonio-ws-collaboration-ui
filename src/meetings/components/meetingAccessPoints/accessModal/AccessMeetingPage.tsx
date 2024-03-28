/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import {
	getRoomNameSelector,
	getRoomTypeSelector
} from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';
import { RoomType } from '../../../../types/store/RoomTypes';

type AccessMeetingPageProps = {
	hasUserDirectAccess: boolean | undefined;
	meetingId: string;
	roomId: string;
	meetingName: string;
};

const AccessMeetingPage: FC<AccessMeetingPageProps> = ({
	hasUserDirectAccess,
	roomId,
	meetingName,
	meetingId
}) => {
	const [t] = useTranslation();
	const conversationTitle = useStore((store) => getRoomNameSelector(store, roomId));

	const groupTitle = t(
		'meeting.startModal.enterRoomMeetingTitle',
		`Participate to ${conversationTitle} meeting`,
		{ meetingTitle: conversationTitle }
	);
	const oneToOneTitle = t(
		'meeting.startModal.enterOneToOneMeetingTitle',
		`Start meeting with ${conversationTitle}`,
		{ meetingTitle: conversationTitle }
	);
	const waitingRoomTitle = t(
		'meeting.waitingRoom.title',
		`How do you want to join ${meetingName} meeting?`,
		{ meetingName }
	);

	const [pageWidth, setPageWidth] = useState(window.innerWidth);

	useEffect(() => {
		setPageWidth(window.innerWidth);
	}, []);

	const updateWindowDimensions = useCallback(() => {
		setPageWidth(window.innerWidth);
	}, []);

	useEffect(() => {
		window.addEventListener('resize', updateWindowDimensions);

		return () => window.removeEventListener('resize', updateWindowDimensions);
	}, [updateWindowDimensions]);

	const roomType = useStore((store) => getRoomTypeSelector(store, roomId));

	const accessTitle = useMemo(
		() =>
			hasUserDirectAccess
				? roomType === RoomType.ONE_TO_ONE
					? oneToOneTitle
					: groupTitle
				: waitingRoomTitle,
		[groupTitle, hasUserDirectAccess, oneToOneTitle, roomType, waitingRoomTitle]
	);

	const handlePageOrientation = useMemo(
		() => (pageWidth <= 1024 ? 'vertical' : 'horizontal'),
		[pageWidth]
	);

	const meetingAccessRef = useRef<HTMLDivElement>(null);
	return (
		<Container mainAlignment="center" crossAlignment="center" ref={meetingAccessRef}>
			<Container width="fit" height="fit" gap="0.5rem">
				<Text size="extralarge" weight="bold">
					{accessTitle}
				</Text>
			</Container>
			<Container
				orientation={handlePageOrientation}
				height="fit"
				mainAlignment="center"
				crossAlignment="center"
			>
				<Text>Placeholder A</Text>
				<Text>Placeholder B</Text>
			</Container>
		</Container>
	);
};

export default AccessMeetingPage;
