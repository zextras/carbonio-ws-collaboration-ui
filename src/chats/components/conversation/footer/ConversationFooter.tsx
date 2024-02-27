/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { Container } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

import ForwardFooter from './ForwardFooter';
import MessageComposer from './MessageComposer';
import ReferenceMessageView from './ReferenceMessageView';
import UploadAttachmentManagerView from './UploadAttachmentManagerView';
import { getForwardList } from '../../../../store/selectors/ActiveConversationsSelectors';
import useStore from '../../../../store/Store';

const ConversationFooterWrapper = styled(Container)`
	border-top: 0.0625rem solid ${({ theme }): string => theme.palette.gray3.regular};
	position: relative;
`;

type ConversationFooterProps = {
	roomId: string;
	isInsideMeeting?: boolean;
};

const ConversationFooter: React.FC<ConversationFooterProps> = ({ roomId, isInsideMeeting }) => {
	const forwardMessageList = useStore((store) => getForwardList(store, roomId));

	return forwardMessageList === undefined ? (
		<ConversationFooterWrapper
			height="fit"
			background={isInsideMeeting ? 'gray0' : 'gray6'}
			borderRadius="none"
		>
			<ReferenceMessageView roomId={roomId} />
			<UploadAttachmentManagerView roomId={roomId} />
			<MessageComposer roomId={roomId} />
		</ConversationFooterWrapper>
	) : (
		<ForwardFooter roomId={roomId} />
	);
};

export default ConversationFooter;
