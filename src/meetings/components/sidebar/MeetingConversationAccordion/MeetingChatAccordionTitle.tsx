/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useEffect, useState } from 'react';

import styled from '@emotion/styled';
import { Row, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { useIsWritingLabel } from '../../../../hooks/useIsWritingLabel';
import { getRoomNameSelector } from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';

const ChatLabelText = styled(Text)<{ $showEffect: boolean }>`
	@keyframes fadeEffect {
		0% {
			opacity: 0.2;
		}
		100% {
			opacity: 1;
		}
	}

	${({ $showEffect }): string =>
		$showEffect ? `animation: fadeEffect 0.4s ease-in;` : `animation: none;`}
`;

type MeetingChatAccordionTitleProps = {
	roomId: string;
};

const MeetingChatAccordionTitle: FC<MeetingChatAccordionTitleProps> = ({ roomId }) => {
	const [t] = useTranslation();
	const chatLabel = t('chat', 'Chat');

	const roomName = useStore((store) => getRoomNameSelector(store, roomId));

	const isWritingLabel = useIsWritingLabel(roomId, true);
	const [writingLabel, setWritingLabel] = useState<false | string>(false);
	const [showEffect, setShowEffect] = useState(false);

	useEffect(() => {
		setShowEffect(true);
		setTimeout(() => {
			setShowEffect(false);
		}, 400);
		if (isWritingLabel) {
			setWritingLabel(isWritingLabel);
		} else {
			setWritingLabel(false);
		}
	}, [isWritingLabel]);

	return (
		<Row takeAvailableSpace mainAlignment="flex-start">
			<ChatLabelText overflow="ellipsis" $showEffect={showEffect}>
				{!writingLabel ? `${chatLabel} - ${roomName}` : writingLabel}
			</ChatLabelText>
		</Row>
	);
};

export default MeetingChatAccordionTitle;
