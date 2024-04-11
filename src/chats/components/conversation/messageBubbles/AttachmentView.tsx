/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import {
	Container,
	Icon,
	IconButton,
	Row,
	Text,
	TextWithTooltip,
	Tooltip
} from '@zextras/carbonio-design-system';
import { split } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled, { DefaultTheme, SimpleInterpolation } from 'styled-components';

import AttachmentSmallView from './AttachmentSmallView';
import usePreview from '../../../../hooks/usePreview';
import { AttachmentsApi } from '../../../../network';
import { getUserName } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { AttachmentType } from '../../../../types/network/apis/IAttachmentsApi';
import { AttachmentMessageType } from '../../../../types/store/MessageTypes';
import { getAttachmentExtension, getThumbnailURL } from '../../../../utils/attachmentUtils';
import { calculateAvatarColor } from '../../../../utils/styleUtils';

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

const PreviewContainer = styled(Container)<{ $isLoaded: boolean; $previewError: boolean }>`
	${({ $isLoaded }): SimpleInterpolation => $isLoaded && `background: black;`};
	${({ $previewError, theme }): SimpleInterpolation =>
		$previewError &&
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

const PreviewErrorContainer = styled(Container)<{
	$imgWidth: number;
	$imgHeight: number;
	$maxWidth: number;
}>`
	${({ $imgWidth, $maxWidth }): string | false =>
		$imgWidth === 0
			? `width: ${$maxWidth * 0.063}rem;`
			: $maxWidth === 0
				? 'width: 100%'
				: `width: min(${$imgWidth * 0.063}rem, ${$maxWidth * 0.063}rem);`};
	${({ $imgWidth, $imgHeight }): string | false =>
		$imgWidth !== 0
			? `aspect-ratio: ${$imgWidth * 0.063}/${$imgHeight * 0.063};`
			: 'aspect-ratio: 1;'};
	max-height: 37.5rem;
`;

const AttachmentImg = styled.img<{
	src: string;
	onLoad: () => void;
	onError: () => void;
	isPreviewLoaded: boolean;
	width: number;
	height: number;
}>`
	${({ width, isPreviewLoaded }): string | false =>
		width === 0 && !isPreviewLoaded && `width: fit-content;`};
	${({ isPreviewLoaded }): string | false => isPreviewLoaded && `width: fit-content;`};
	${({ height, isPreviewLoaded }): string | false =>
		height * 0.063 >= 37.5 && isPreviewLoaded && `object-fit: contain;`};
	max-width: ${({ width }): string => (width === 0 ? '100%' : `min(${width * 0.063}rem, 100%)`)};
	max-height: 37.5rem;
	height: fit-content;
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
	display: flex;
`;

const TextContainer = styled(Container)`
	position: absolute;
`;

const FileContainer = styled(Container)<{
	$userBorderColor: keyof DefaultTheme['avatarColors'] | string;
}>`
	border-left: ${({ $userBorderColor, theme }): string =>
		`0.25rem solid ${theme.avatarColors[$userBorderColor as keyof DefaultTheme['avatarColors']]}`};
	border-radius: 0 0.25rem 0.25rem 0;
`;

type AttachmentViewProps = {
	attachment: AttachmentMessageType;
	isMyMessage?: boolean;
	from: string;
	messageListRef?: React.RefObject<HTMLDivElement | undefined>;
};

const AttachmentView: FC<AttachmentViewProps> = ({
	attachment,
	from,
	isMyMessage = false,
	messageListRef
}) => {
	const [t] = useTranslation();

	const downloadActionLabel = t('action.download', 'Download');
	const previewActionLabel = t('action.preview', 'Preview');

	const senderIdentifier = useStore((store) => getUserName(store, from));

	const dimensions = useMemo(() => {
		if (getAttachmentExtension(attachment.mimeType) === AttachmentType.PDF) return ['2480', '3508'];
		return split(attachment.area, 'x');
	}, [attachment.area, attachment.mimeType]);

	const [isPreviewLoaded, setPreviewLoaded] = useState(false);
	const [previewError, setPreviewError] = useState(false);
	const [attachmentBubbleMaxWidth, setAttachmentBubbleMaxWidth] = useState(0);

	// Reset preview state when attachment changes to request again preview
	useEffect(() => {
		setPreviewLoaded(false);
		setPreviewError(false);
	}, [attachment.id]);

	const resizeHandler = useCallback(() => {
		if (previewError && messageListRef) {
			const relativeWidth = messageListRef.current?.clientWidth;
			setAttachmentBubbleMaxWidth(relativeWidth !== undefined ? relativeWidth * 0.55 : 0);
		} else setAttachmentBubbleMaxWidth(0);
	}, [messageListRef, previewError]);

	useEffect(() => {
		if (previewError && messageListRef) {
			const relativeWidth = messageListRef.current?.clientWidth;
			setAttachmentBubbleMaxWidth(relativeWidth !== undefined ? relativeWidth * 0.55 : 0);
		} else setAttachmentBubbleMaxWidth(0);
	}, [messageListRef, previewError]);

	useEffect(() => {
		window.addEventListener('resize', resizeHandler);
		return () => {
			window.removeEventListener('resize', resizeHandler);
		};
	}, [resizeHandler]);

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
				<TextWithTooltip color={isPreviewLoaded && !previewError ? 'gray6' : 'gray1'}>
					{attachment.name}
				</TextWithTooltip>
			</TextContainer>
		),
		[attachment.name, isPreviewLoaded, previewError]
	);

	const actionButtons = useMemo(
		() => (
			<HoverContainer width="fit" height="fit">
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
				width={'fill'}
				height={'fit'}
				borderRadius="half"
				$isLoaded={isPreviewLoaded}
				$previewError={previewError}
				data-testid="preview-container"
			>
				{previewError ? (
					<PreviewErrorContainer
						background="gray5"
						$imgWidth={Number(dimensions[0])}
						$imgHeight={Number(dimensions[1])}
						$maxWidth={attachmentBubbleMaxWidth}
					>
						<Icon size="large" icon="Image" color="gray2" />
					</PreviewErrorContainer>
				) : (
					<>
						{actionButtons}
						<AttachmentImg
							src={previewURL}
							onLoad={setLoaded}
							onError={setError}
							data-testid="attachmentImg"
							isPreviewLoaded={isPreviewLoaded}
							width={Number(dimensions[0])}
							height={Number(dimensions[1])}
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
			$userBorderColor={isMyMessage ? '#C4D5EF' : userColor}
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
