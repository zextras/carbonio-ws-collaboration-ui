/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useEffect, useMemo } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { last, map, size } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { MEETINGS_PATH } from '../../../../constants/appConstants';
import { getMeetingActive } from '../../../../store/selectors/MeetingSelectors';
import useStore from '../../../../store/Store';
import { scrollToEnd } from '../../../../utils/scrollUtils';

type WritingBubbleProps = {
	roomId: string;
	writingListNames: string[];
	MessageListWrapperRef: React.RefObject<HTMLDivElement>;
};

const BubbleWritingContainer = styled(Container)`
	@keyframes showBubble {
		0% {
			transform: translateX(-3.125rem);
			opacity: 0;
		}
		100% {
			transform: translateX(0);
			opacity: 1;
		}
	}
	margin-top: 0.25rem;
	margin-bottom: 0.25rem;
	box-shadow: 0 0 0.25rem rgba(166, 166, 166, 0.5);
	border-radius: 0.25rem 0.25rem 0.25rem 0;
	animation: showBubble 0.2s ease-in 0s forwards;
`;

const CustomText = styled(Text)`
	font-style: italic;
	padding-right: 0.1875rem;
`;

const WritingBubble: FC<WritingBubbleProps> = ({
	writingListNames,
	MessageListWrapperRef,
	roomId
}) => {
	const [t] = useTranslation();
	const isWritingLabel = t('status.isTyping', 'is typing...');
	const areWritingLabel = t('status.areTyping', 'are typing...');

	const meetingIsActive: boolean = useStore((store) => getMeetingActive(store, roomId));
	const isInsideMeeting = useMemo(() => window.location.pathname.includes(MEETINGS_PATH), []);

	const writingListLabel = useMemo(() => {
		if (writingListNames.length === 1) {
			return `${writingListNames.toString()} ${isWritingLabel}`;
		}
		if (meetingIsActive && isInsideMeeting) {
			const usersWritingListNames: string[] = [];
			map(writingListNames, (user) => {
				usersWritingListNames.push(user.split(/(\s+)/)[0]);
			});
			return `${usersWritingListNames.join(', ')} ${areWritingLabel}`;
		}
		return `${writingListNames.join(', ')} ${areWritingLabel}`;
	}, [areWritingLabel, isInsideMeeting, isWritingLabel, meetingIsActive, writingListNames]);

	const writingUsersLabel =
		// eslint-disable-next-line no-nested-ternary
		writingListNames.length > 0 ? writingListLabel : null;

	useEffect(() => {
		const roomMessages = useStore.getState().messages[roomId];
		const actualScrollPosition =
			useStore.getState().activeConversations[roomId]?.scrollPositionMessageId;
		if (
			(size(roomMessages) > 0 && actualScrollPosition === last(roomMessages)?.id) ||
			!actualScrollPosition
		) {
			scrollToEnd(MessageListWrapperRef);
		}
	}, [MessageListWrapperRef, roomId]);

	return writingListNames.length > 0 ? (
		<BubbleWritingContainer
			key="isWritingBubble"
			height="fit"
			width="fit"
			padding={{ all: 'medium' }}
			background={'gray6'}
		>
			<CustomText color="secondary">{writingUsersLabel}</CustomText>
		</BubbleWritingContainer>
	) : null;
};

export default WritingBubble;
