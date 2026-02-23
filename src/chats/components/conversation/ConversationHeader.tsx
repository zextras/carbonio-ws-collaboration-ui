/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { Dispatch, ReactElement, SetStateAction, useEffect, useState } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Button, Container, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { ConversationView } from './Conversation';
import { PinMessage } from './PinMessage';
import { useIsWritingLabel } from '../../../hooks/useIsWritingLabel';
import useMediaQueryCheck from '../../../hooks/useMediaQueryCheck';
import ConversationHeaderMeetingButton from '../../../meetings/components/headerMeetingButton/ConversationHeaderMeetingButton';
import { getPinnedMessage } from '../../../store/selectors/ActiveConversationsSelectors';
import { getIsPlaceholderRoom, getRoomNameSelector } from '../../../store/selectors/RoomsSelectors';
import { getAttribute } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';

type ConversationHeaderProps = {
	roomId: string;
	conversationView: ConversationView;
	setConversationView: Dispatch<SetStateAction<ConversationView>>;
};

const RoomInfoHeader = styled(Container)`
	border-bottom: 0.0625rem solid ${({ theme }): string => theme.palette.gray3.regular};
	-webkit-user-select: none;
	user-select: none;
`;

const CustomText = styled(Text)<{
	$isWritingIsVisible: boolean;
}>`
	@keyframes slideUp {
		0% {
			transform: translateY(0.44rem);
		}

		100% {
			transform: translateY(0);
		}
	}

	@keyframes slideDown {
		0% {
			transform: translateY(-0.44rem);
		}

		100% {
			transform: translateY(0);
		}
	}

	${({ $isWritingIsVisible }): ReturnType<typeof css> =>
		$isWritingIsVisible
			? css`
					animation: slideUp 0.4s ease forwards;
				`
			: css`
					animation: slideDown 0.4s ease 0.3s;
				`};
`;

const CustomIsWritingText = styled(Text)<{ $isWritingIsVisible: boolean }>`
	opacity: 0;
	transition: opacity 0.2s ease;
	${({ $isWritingIsVisible }): string | false => $isWritingIsVisible && 'opacity: 1;'}
`;

const ConversationHeader = ({
	roomId,
	conversationView,
	setConversationView
}: ConversationHeaderProps): ReactElement => {
	const [t] = useTranslation();
	const pinnedMessage = useStore((store) => getPinnedMessage(store, roomId));
	const infoTooltip = t('conversationInfo.info', 'Info');
	const searchTooltip = t('conversationInfo.search', 'Search');
	const roomName = useStore((state) => getRoomNameSelector(state, roomId)) || '';
	const videoCallEnabled = useStore((store) => getAttribute(store, 'videoCallEnabled'));
	const isPlaceholderRoom = useStore((state) => getIsPlaceholderRoom(state, roomId));

	const isWritingLabel = useIsWritingLabel(roomId);
	const [isWritingIsDefined, setIsWritingIsDefined] = useState(false);
	const [writingLabel, setWritingLabel] = useState('');

	useEffect(() => {
		if (isWritingLabel === undefined) {
			setIsWritingIsDefined(false);
			setTimeout(() => setWritingLabel(''), 300);
		} else {
			setIsWritingIsDefined(true);
			setWritingLabel(isWritingLabel);
		}
	}, [isWritingLabel]);

	const isDesktopView = useMediaQueryCheck();

	return (
		<RoomInfoHeader height={'fit'}>
			<Container
				height="3rem"
				minHeight="3rem"
				background="gray5"
				orientation="horizontal"
				mainAlignment="space-between"
				padding="small"
			>
				<Row takeAvailableSpace mainAlignment="flex-start">
					<Container
						orientation="vertical"
						height="fit"
						crossAlignment="flex-start"
						padding={{ horizontal: 'small' }}
					>
						<Tooltip label={roomName} overflow="ellipsis" overflowTooltip>
							<CustomText $isWritingIsVisible={isWritingIsDefined}>{roomName}</CustomText>
						</Tooltip>
						<CustomIsWritingText
							size="small"
							color="secondary"
							$isWritingIsVisible={isWritingIsDefined}
							data-testid="is_writing_text"
						>
							{writingLabel}
						</CustomIsWritingText>
					</Container>
				</Row>
				<Container orientation="horizontal" width="fit" minWidth="fit" gap="0.25rem">
					{videoCallEnabled && !isPlaceholderRoom && (
						<ConversationHeaderMeetingButton roomId={roomId} />
					)}
					{conversationView !== ConversationView.SEARCH && (
						<Tooltip label={searchTooltip}>
							<Button
								type="ghost"
								onClick={() => setConversationView(ConversationView.SEARCH)}
								color="gray0"
								size="large"
								minWidth="large"
								icon="Search"
							/>
						</Tooltip>
					)}
					{(!isDesktopView || conversationView === ConversationView.SEARCH) && (
						<Tooltip label={infoTooltip}>
							<Button
								type="ghost"
								onClick={() =>
									setConversationView(isDesktopView ? ConversationView.CHAT : ConversationView.INFO)
								}
								color="gray0"
								size="large"
								minWidth="large"
								icon="InfoOutline"
							/>
						</Tooltip>
					)}
				</Container>
			</Container>
			{pinnedMessage && <PinMessage pinnedMessage={pinnedMessage} />}
		</RoomInfoHeader>
	);
};

export default ConversationHeader;
