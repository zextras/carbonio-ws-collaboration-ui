/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, {
	Dispatch,
	ReactElement,
	SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useState
} from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { find } from 'lodash';
import { useTranslation } from 'react-i18next';

import { MEETINGS_PATH } from '../../../constants/appConstants';
import useRouting, { PAGE_INFO_TYPE } from '../../../hooks/useRouting';
import { MeetingsApi } from '../../../network';
import { getRoomIdFromMeeting } from '../../../store/selectors/MeetingSelectors';
import { getRoomNameSelector, getRoomTypeSelector } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { MeetingType } from '../../../types/network/models/meetingBeTypes';
import { RoomType } from '../../../types/store/RoomTypes';

type UseAccessMeetingInformationReturnType = {
	meetingName: string;
	accessTitle: string;
	hasUserDirectAccess: boolean;
	ShowMeetingAccessPage: ({
		children
	}: {
		children: ReactElement | ReactElement[];
	}) => ReactElement;
	userIsReady: boolean;
	setUserIsReady: Dispatch<SetStateAction<boolean>>;
};

const useAccessMeetingInformation = (): UseAccessMeetingInformationReturnType => {
	const [userIsReady, setUserIsReady] = useState<boolean>(false);

	const meetingId = useMemo(() => document.location.pathname.split(MEETINGS_PATH)[1], []);
	const roomId = useStore((store) => getRoomIdFromMeeting(store, meetingId) ?? ``);
	const conversationTitle = useStore((store) => getRoomNameSelector(store, roomId));
	const roomType = useStore((store) => getRoomTypeSelector(store, roomId));

	const [t] = useTranslation();
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
	const clickOnReadyLabel = t(
		'meeting.waitingRoom.welcomeHint',
		'Click on “READY TO PARTICIPATE” to enter the meeting'
	);
	const enterInAFewMomentsLabel = t(
		'meeting.waitingRoom.readyHint',
		'You will enter the meeting in a few moments'
	);

	const chatsBeNetworkStatus = useStore(({ connections }) => connections.status.chats_be);
	const [hasUserDirectAccess, setHasUserDirectAccess] = useState<boolean | undefined>(undefined);
	const [meetingName, setMeetingName] = useState<string>('');

	const { goToInfoPage } = useRouting();

	useEffect(() => {
		if (chatsBeNetworkStatus) {
			MeetingsApi.getMeetingByMeetingId(meetingId)
				.then((meeting) => {
					const room = find(useStore.getState().rooms, (room) => room.meetingId === meetingId);
					const iAmOwner = find(
						room?.members,
						(member) => member.userId === useStore.getState().session.id && member.owner
					);
					// Modal access for permanent meeting and scheduled owners
					if (meeting.meetingType === MeetingType.PERMANENT || iAmOwner) {
						setHasUserDirectAccess(true);
					} else {
						// Waiting room access for scheduled member
						setHasUserDirectAccess(false);
						setMeetingName(meeting.name);
					}
				})
				.catch(() => {
					// Waiting room access for external
					MeetingsApi.getScheduledMeetingName(meetingId)
						.then((resp) => {
							setHasUserDirectAccess(false);
							setMeetingName(resp.name);
						})
						.catch(() => {
							goToInfoPage(PAGE_INFO_TYPE.MEETING_NOT_FOUND);
						});
				});
		}
	}, [chatsBeNetworkStatus, goToInfoPage, meetingId]);

	const ShowMeetingAccessPage = useCallback(
		({ children }) => (
			<Container
				background="gray0"
				padding={{ top: '4rem', bottom: '2rem', horizontal: '2rem' }}
				data-testid="meeting_access_page_view"
			>
				{chatsBeNetworkStatus && children}
			</Container>
		),
		[chatsBeNetworkStatus]
	);

	const accessTitle = useMemo(() => {
		const roomTypeTitle = roomType === RoomType.ONE_TO_ONE ? oneToOneTitle : groupTitle;
		if (hasUserDirectAccess === undefined) return '';
		if (hasUserDirectAccess) return roomTypeTitle;
		return userIsReady ? enterInAFewMomentsLabel : clickOnReadyLabel;
	}, [
		roomType,
		oneToOneTitle,
		groupTitle,
		hasUserDirectAccess,
		userIsReady,
		enterInAFewMomentsLabel,
		clickOnReadyLabel
	]);

	return {
		hasUserDirectAccess: !!hasUserDirectAccess,
		meetingName,
		ShowMeetingAccessPage,
		accessTitle,
		userIsReady,
		setUserIsReady
	};
};
export default useAccessMeetingInformation;
