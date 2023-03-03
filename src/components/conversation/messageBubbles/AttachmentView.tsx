/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	Avatar,
	Container,
	Icon,
	IconButton,
	Row,
	Shimmer,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import usePreview from '../../../hooks/usePreview';
import { AttachmentsApi } from '../../../network';
import { getUserName } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { AttachmentMessageType } from '../../../types/store/MessageTypes';
import { getPreviewURL } from '../../../utils/attachmentUtils';
import { calculateAvatarColor } from '../../../utils/styleUtils';

const HoverContainer = styled(Container)`
	z-index: 1;
	position: absolute;
	opacity: 0;
`;

const CustomContainer = styled(Container)`
	border-radius: 31.25rem;
	background-color: rgba(255, 255, 255, 0.2);
`;

const CustomIconButton = styled(IconButton)`
	background-color: rgba(255, 255, 255, 0);
`;

const PreviewContainer = styled(Container)`
	${({ isLoaded }): string => isLoaded && `background: black;`};
	position: relative;
	min-width: 100%;
	&:hover {
		${HoverContainer} {
			opacity: 1;
		}
	}
`;
const AttachmentImg = styled.img`
	max-width: 100%;
	mask-image: linear-gradient(
		180deg,
		rgba(0, 0, 0, 1) 0%,
		rgba(0, 0, 0, 1) 65%,
		rgba(0, 0, 0, 0) 100%
	);
	${PreviewContainer}:hover & {
		mask-image: linear-gradient(
			180deg,
			rgba(0, 0, 0, 0.5) 0%,
			rgba(0, 0, 0, 0.5) 65%,
			rgba(0, 0, 0, 0) 100%
		);
	}
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
	const [t] = useTranslation();

	const downloadActionLabel = t('action.download', 'Download');
	const previewActionLabel = t('action.preview', 'Preview');

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

	const { onPreviewClick } = usePreview(attachment);

	const imageLabel = useMemo(
		() => (
			<TextContainer
				padding={{ all: 'small' }}
				wrap="wrap"
				mainAlignment="flex-end"
				crossAlignment="flex-start"
			>
				<Text
					size="small"
					color={isPreviewLoaded && !previewError ? 'gray6' : 'gray1'}
					overflow="break-word"
				>
					{attachment.name}
				</Text>
			</TextContainer>
		),
		[attachment.name, isPreviewLoaded, previewError]
	);

	const actionButtons = useMemo(
		() => (
			<HoverContainer>
				<CustomContainer width="fit" height="fit" padding={{ all: 'small' }}>
					<Container orientation="horizontal" style={{ gap: '0.625rem' }}>
						<Tooltip label={previewActionLabel}>
							<CustomIconButton
								borderRadius="round"
								icon="EyeOutline"
								iconColor="gray6"
								customSize={{ iconSize: 'large', paddingSize: 'extrasmall' }}
								onClick={onPreviewClick}
							/>
						</Tooltip>
						<Tooltip label={downloadActionLabel}>
							<CustomIconButton
								borderRadius="round"
								iconColor="gray6"
								icon="DownloadOutline"
								customSize={{ iconSize: 'large', paddingSize: 'extrasmall' }}
								onClick={download}
							/>
						</Tooltip>
					</Container>
				</CustomContainer>
			</HoverContainer>
		),
		[download, downloadActionLabel, onPreviewClick, previewActionLabel]
	);

	// Previewer service can be used for generate a preview for this file
	if (previewURL) {
		return (
			// hover sul previewContainer, appare l'hover container che è semi trasparente
			// deve esserci l'immagine naturalmente
			<PreviewContainer width={'fit'} height={'fit'} borderRadius="half" isLoaded={isPreviewLoaded}>
				{!isPreviewLoaded && <Shimmer.Logo size="large" />}
				{previewError ? (
					<Container background="gray5" width="18.75rem" height="9.375rem" maxWidth="100%">
						<Icon size="large" icon="Image" color="gray2" />
					</Container>
				) : (
					<>
						{actionButtons}
						<AttachmentImg
							src={previewURL}
							onLoad={setLoaded}
							onError={setError}
							data-testid="attachmentImg"
						/>
					</>
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
					<Text size="small" color="secondary">
						{attachment.name}
					</Text>
				</Container>
			</Row>
		</FileContainer>
	);
};

export default AttachmentView;
