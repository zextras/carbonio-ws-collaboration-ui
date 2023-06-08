/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
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

import AttachmentSmallView from './AttachmentSmallView';
import usePreview from '../../../hooks/usePreview';
import { AttachmentsApi } from '../../../network';
import { getUserName } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';
import { AttachmentMessageType } from '../../../types/store/MessageTypes';
import { getThumbnailURL } from '../../../utils/attachmentUtils';
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

const CustomShimmerLogo = styled(Shimmer.Logo)`
	min-width: 18.75rem;
	width: 100%;
	height: 15.625rem;
`;

const PreviewContainer = styled(Container)`
	${({ isLoaded }): string => isLoaded && `background: black;`};
	${({ previewError, theme }): string =>
		previewError &&
		`border-radius: 0.25rem;
		background: ${theme.palette.gray5.regular};`};
	position: relative;
	min-width: 100%;
	&:hover {
		${HoverContainer} {
			opacity: 1;
		}
	}
`;
const AttachmentImg = styled.img<{ isPreviewLoaded: boolean }>`
	max-height: 15.625rem;
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
	display: ${({ isPreviewLoaded }): string => (isPreviewLoaded ? 'flex' : `none`)};
`;

const TextContainer = styled(Container)`
	position: absolute;
`;

const FileContainer = styled(Container)`
	border-left: ${({ userBorderColor, theme }): string =>
		`0.25rem solid ${theme.avatarColors[userBorderColor]}`};
	border-radius: 0 0.25rem 0.25rem 0;
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
		() => getThumbnailURL(attachment.id, attachment.mimeType),
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
				<Text color={isPreviewLoaded && !previewError ? 'gray6' : 'gray1'} overflow="break-word">
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
			<PreviewContainer
				width={'fit'}
				height={'fit'}
				borderRadius="half"
				isLoaded={isPreviewLoaded}
				previewError={previewError}
				data-testid="preview-container"
			>
				{!isPreviewLoaded && <CustomShimmerLogo />}
				{previewError ? (
					<Container background="gray5" width="18.75rem" height="15.625rem" maxWidth="100%">
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
							isPreviewLoaded={isPreviewLoaded}
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
			userBorderColor={isMyMessage ? '#C4D5EF' : userColor}
		>
			<Row>
				<AttachmentSmallView attachment={attachment} />
			</Row>
			<Row takeAvailableSpace wrap="nowrap" height="100%">
				<Container padding={{ vertical: 'small' }} wrap="wrap" crossAlignment="flex-start">
					<Text color="secondary">{attachment.name}</Text>
				</Container>
			</Row>
		</FileContainer>
	);
};

export default AttachmentView;
