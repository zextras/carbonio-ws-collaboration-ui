/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Avatar, Container, Row, Text } from '@zextras/carbonio-design-system';
import React, { FC, useCallback, useMemo } from 'react';
import styled from 'styled-components';

import { AttachmentsApi } from '../../../network';
import { getUserName } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { AttachmentMessageType } from '../../../types/store/MessageTypes';
import { getPreviewURL } from '../../../utils/attachmentUtils';
import { calculateAvatarColor } from '../../../utils/styleUtils';

const AttachmentImg = styled.img`
	max-width: 100%;
`;

const FileContainer = styled(Container)`
	border-left: ${({ userBorderColor, theme }): string =>
		`0.25rem solid ${theme.avatarColors[userBorderColor]}`};
	border-radius: 0 0.25rem 0.25rem 0;
	cursor: pointer;
`;

type AttachmentViewProps = {
	attachment: AttachmentMessageType;
	isMyMessage?: boolean;
	from: string;
};

const AttachmentView: FC<AttachmentViewProps> = ({ attachment, from, isMyMessage = false }) => {
	const senderIdentifier = useStore((store) => getUserName(store, from));
	const userColor = useMemo(() => calculateAvatarColor(senderIdentifier || ''), [senderIdentifier]);

	const previewURL = useMemo(
		() => getPreviewURL(attachment.id, attachment.mimeType),
		[attachment.id, attachment.mimeType]
	);

	const download = useCallback(() => {
		const downloadUrl = AttachmentsApi.getURLAttachment(attachment.id);
		const linkTag: HTMLAnchorElement = document.createElement('a');
		document.body.appendChild(linkTag);
		linkTag.href = downloadUrl;
		linkTag.download = attachment.name;
		linkTag.target = '_blank';
		linkTag.click();
		linkTag.remove();
	}, [attachment.id, attachment.name]);

	if (previewURL) {
		// TODO image style
		return <AttachmentImg src={previewURL} />;
	}
	return (
		<FileContainer
			background={isMyMessage ? '#C4D5EF' : 'gray5'}
			padding={{ horizontal: 'small', vertical: 'small' }}
			orientation="horizontal"
			crossAlignment="flex-start"
			userBorderColor={userColor}
			onClick={download}
		>
			<Row>
				<Avatar
					size="large"
					icon="FileTextOutline"
					label={attachment.name}
					shape="square"
					background="gray0"
				/>
			</Row>
			<Row takeAvailableSpace wrap="nowrap" height="100%">
				<Container padding={{ all: 'small' }} wrap="wrap">
					<Text size="small" color="secondary">
						{attachment.name}
					</Text>
				</Container>
			</Row>
		</FileContainer>
	);
};

export default AttachmentView;
