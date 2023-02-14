/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Padding } from '@zextras/carbonio-design-system';
import moment from 'moment-timezone';
import React, { FC, useMemo } from 'react';
import styled from 'styled-components';

import { getPrefTimezoneSelector } from '../../../store/selectors/SessionSelectors';
import { getUserName } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { ForwardedMessage } from '../../../types/store/MessageTypes';
import { calculateAvatarColor } from '../../../utils/styleUtils';
import BubbleFooter from './BubbleFooter';
import BubbleHeader from './BubbleHeader';

const ForwardMessageContainer = styled(Container)`
	border-left: ${({ userBorderColor, theme }): string =>
		`0.25rem solid ${theme.avatarColors[userBorderColor]}`};
	border-radius: 0 0.25rem 0.25rem 0;
	cursor: pointer;
`;

type ForwardedMessageSectionViewProps = {
	forwardedMessage: ForwardedMessage;
	isMyMessage: boolean;
};
const ForwardedMessageSectionView: FC<ForwardedMessageSectionViewProps> = ({
	forwardedMessage,
	isMyMessage
}) => {
	const timezone = useStore(getPrefTimezoneSelector);
	const forwardUsername = useStore((store) => getUserName(store, forwardedMessage.from));

	const messageTime = useMemo(
		() => moment.tz(forwardedMessage.date, timezone).format('HH:MM'),
		[forwardedMessage.date, timezone]
	);

	const userColor = useMemo(() => calculateAvatarColor(forwardUsername || ''), [forwardUsername]);

	return (
		<>
			<ForwardMessageContainer
				background={isMyMessage ? '#C4D5EF' : 'gray5'}
				padding={{ horizontal: 'small', vertical: 'small' }}
				crossAlignment="flex-start"
				userBorderColor={userColor}
			>
				{forwardUsername && (
					<BubbleHeader senderId={forwardedMessage.from} notReplayedMessageHeader={false} />
				)}
				{forwardedMessage.text}
				{messageTime && <BubbleFooter isMyMessage={false} time={messageTime} />}
			</ForwardMessageContainer>
			<Padding top="small" />
		</>
	);
};

export default ForwardedMessageSectionView;
