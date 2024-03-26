/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useEffect, useState } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { useIsWritingLabel } from '../../../../hooks/useIsWritingLabel';

const IsWritingLabelText = styled(Text)<{
	$isWritingIsVisible: boolean;
}>`
	opacity: 0;
	transition: opacity 0.3s ease;
	${({ $isWritingIsVisible }: { $isWritingIsVisible: boolean }): string | false =>
		$isWritingIsVisible && 'opacity: 1;'}
`;

const ChatLabelText = styled(Text)<{
	$isWritingIsVisible: boolean;
}>`
	position: absolute;
	opacity: 1;
	transition: opacity 0.3s ease;
	${({ $isWritingIsVisible }: { $isWritingIsVisible: boolean }): string | false =>
		$isWritingIsVisible && 'opacity: 0;'}
`;

type MeetingChatAccordionTitleProps = {
	roomId: string;
};

const MeetingChatAccordionTitle: FC<MeetingChatAccordionTitleProps> = ({ roomId }) => {
	const [t] = useTranslation();
	const chatLabel = t('chat', 'Chat');

	const isWritingLabel = useIsWritingLabel(roomId, true);

	const [isWritingIsDefined, setIsWritingIsDefined] = useState(false);
	const [writingLabel, setWritingLabel] = useState('');

	useEffect(() => {
		if (isWritingLabel === undefined) {
			setIsWritingIsDefined(false);
			setTimeout(() => setWritingLabel(''), 400);
		} else {
			setIsWritingIsDefined(true);
			setWritingLabel(isWritingLabel);
		}
	}, [isWritingLabel]);

	return (
		<Container width="70%" crossAlignment="flex-start">
			<ChatLabelText
				overflow="ellipsis"
				$isWritingIsVisible={isWritingIsDefined}
				data-testid="chat_title"
			>
				{chatLabel}
			</ChatLabelText>
			<IsWritingLabelText
				overflow="ellipsis"
				$isWritingIsVisible={isWritingIsDefined}
				data-testid="is_writing_title"
			>
				{writingLabel}
			</IsWritingLabelText>
		</Container>
	);
};

export default MeetingChatAccordionTitle;
