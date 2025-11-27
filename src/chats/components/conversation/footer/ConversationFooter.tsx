/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect, useState } from 'react';

import styled from '@emotion/styled';
import { Container } from '@zextras/carbonio-design-system';

import ForwardFooter from './ForwardFooter';
import MessageComposer from './MessageComposer';
import ReferenceMessageView from './ReferenceMessageView';
import UploadAttachmentManagerView from './UploadAttachmentManagerView';
import {
	getDraftMessage,
	getFilesToUploadArray,
	getForwardList
} from '../../../../store/selectors/ActiveConversationsSelectors';
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
	const filesToUpload = useStore((store) => getFilesToUploadArray(store, roomId));
	const draftMessage = useStore((store) => getDraftMessage(store, roomId));

	const [textMessage, setTextMessage] = useState(draftMessage ?? '');

	useEffect(() => {
		setTextMessage(draftMessage ?? '');
	}, [draftMessage, roomId]);

	if (forwardMessageList) return <ForwardFooter roomId={roomId} />;
	return (
		<ConversationFooterWrapper
			height="fit"
			background={isInsideMeeting ? 'gray0' : 'gray6'}
			borderRadius="none"
		>
			<ReferenceMessageView roomId={roomId} />
			{filesToUpload && filesToUpload.length > 0 && (
				<UploadAttachmentManagerView
					roomId={roomId}
					textMessage={textMessage}
					setTextMessage={setTextMessage}
				/>
			)}
			<MessageComposer
				roomId={roomId}
				textMessage={textMessage}
				setTextMessage={setTextMessage}
				key={roomId}
			/>
		</ConversationFooterWrapper>
	);
};

export default ConversationFooter;
