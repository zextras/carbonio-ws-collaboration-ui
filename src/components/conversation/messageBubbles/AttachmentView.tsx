/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Avatar, Container, Icon, Row, Shimmer, Text } from '@zextras/carbonio-design-system';
import React, { FC, useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import { AttachmentsApi } from '../../../network';
import { getUserName } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { AttachmentMessageType } from '../../../types/store/MessageTypes';
import { getPreviewURL } from '../../../utils/attachmentUtils';
import { calculateAvatarColor } from '../../../utils/styleUtils';

const AttachmentImg = styled.img`
	max-width: 100%;
	mask-image: linear-gradient(
		180deg,
		rgba(0, 0, 0, 1) 0%,
		rgba(0, 0, 0, 1) 65%,
		rgba(0, 0, 0, 0) 100%
	);
`;

const PreviewContainer = styled(Container)`
	${({ isLoaded }): string => isLoaded && `background: black;`};
	position: relative;
	min-width: 100%;
`;

const TextContainer = styled(Container)`
	position: absolute;
`;

const FileContainer = styled(Container)`
	border-left: ${({ userBorderColor, theme }): string =>
		`0.25rem solid ${theme.avatarColors[userBorderColor]}`};
	border-radius: 0 0.25rem 0.25rem 0;
	cursor: pointer;
`;

const CustomAvatar = styled(Avatar)`
	svg {
		width: calc(2rem * 0.75);
		min-width: calc(2rem * 0.75);
		height: calc(2rem * 0.75);
		min-height: calc(2rem * 0.75);
	}
`;

type AttachmentViewProps = {
	attachment: AttachmentMessageType;
	isMyMessage?: boolean;
	from: string;
};

const AttachmentView: FC<AttachmentViewProps> = ({ attachment, from, isMyMessage = false }) => {
	const senderIdentifier = useStore((store) => getUserName(store, from));

	const [isPreviewLoaded, setPreviewLoaded] = useState(false);
	const [previewError, setPreviewError] = useState(false);
	const setLoaded = useCallback(() => setPreviewLoaded(true), []);
	const setError = useCallback(() => {
		setPreviewLoaded(true);
		setPreviewError(true);
	}, []);

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

	const imageLabel = useMemo(
		() => (
			<TextContainer
				padding={{ all: 'small' }}
				wrap="wrap"
				mainAlignment="flex-end"
				crossAlignment="flex-start"
			>
				<Text color={isPreviewLoaded && !previewError ? 'gray6' : 'gray1'} overflow="break-word">
					{attachment.name}
				</Text>
			</TextContainer>
		),
		[attachment.name, isPreviewLoaded, previewError]
	);

	// Previewer service can be used for generate a preview for this file
	if (previewURL) {
		return (
			<PreviewContainer width={'fit'} height={'fit'} borderRadius="half" isLoaded={isPreviewLoaded}>
				{!isPreviewLoaded && <Shimmer.Logo size="large" />}
				{previewError ? (
					<Container background="gray5" width="18.75rem" height="9.375rem" maxWidth="100%">
						<Icon size="large" icon="Image" color="gray2" />
					</Container>
				) : (
					<AttachmentImg
						src={previewURL}
						onLoad={setLoaded}
						onError={setError}
						data-testid="attachmentImg"
					/>
				)}
				{imageLabel}
			</PreviewContainer>
		);
	}
	// Generic file visualization
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
				<CustomAvatar
					size="large"
					icon="FileTextOutline"
					label={attachment.name}
					shape="square"
					background="gray0"
				/>
			</Row>
			<Row takeAvailableSpace wrap="nowrap" height="100%">
				<Container padding={{ all: 'small' }} wrap="wrap">
					<Text color="secondary">{attachment.name}</Text>
				</Container>
			</Row>
		</FileContainer>
	);
};

export default AttachmentView;
