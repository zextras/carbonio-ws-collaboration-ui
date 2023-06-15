/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React from 'react';
import styled from 'styled-components';

import MessageComposer from './MessageComposer';
import ReferenceMessageView from './ReferenceMessageView';
import UploadAttachmentManagerView from './UploadAttachmentManagerView';

const ConversationFooterWrapper = styled(Container)`
	border-top: 0.0625rem solid ${({ theme }): string => theme.palette.gray3.regular};
	position: relative;
`;

type ConversationFooterProps = {
	roomId: string;
};

const ConversationFooter: React.FC<ConversationFooterProps> = ({ roomId }) => (
	<ConversationFooterWrapper height="fit" background={'gray6'} borderRadius="none">
		<ReferenceMessageView roomId={roomId} />
		<UploadAttachmentManagerView roomId={roomId} />
		<MessageComposer roomId={roomId} />
	</ConversationFooterWrapper>
);

export default ConversationFooter;
