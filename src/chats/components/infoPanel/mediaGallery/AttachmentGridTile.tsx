/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect, useState } from 'react';

import styled from '@emotion/styled';
import { Container, Dropdown, Icon, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import useAttachmentActions from './useAttachmentActions';
import usePreviewNavigation from '../../../../hooks/usePreviewNavigation';
import { getVideoThumbnailURL } from '../../../../network';
import { Attachment } from '../../../../types/network/models/attachmentTypes';
import {
	downloadAttachment,
	getAttachmentThumbnailURL,
	ImageQuality,
	isAttachmentVideo,
	isPreviewSupported
} from '../../../../utils/attachmentUtils';

// Sizing lives on the slot so the tile keeps the 4-column layout even when
// wrapped by the contextual menu dropdown.
const TileSlot = styled.div`
	width: calc((100% - 3 * 0.125rem) / 4);
	aspect-ratio: 1 / 1;
`;

const TileWrapper = styled.div`
	position: relative;
	width: 100%;
	height: 100%;
	overflow: hidden;
	cursor: pointer;
	background-color: ${({ theme }): string => theme.palette.gray5.regular};
`;

const TileImage = styled.img`
	display: block;
	width: 100%;
	height: 100%;
	object-fit: cover;
`;

const VideoBadge = styled.div`
	position: absolute;
	bottom: 0.25rem;
	left: 0.25rem;
	display: flex;
	filter: drop-shadow(0 0 0.125rem rgba(0, 0, 0, 0.6));
`;

type AttachmentGridTileProps = {
	attachment: Attachment;
	// Whether the row containing this tile has entered the viewport at least once.
	visible: boolean;
};

export const AttachmentGridTile: FC<AttachmentGridTileProps> = ({ attachment, visible }) => {
	const [t] = useTranslation();
	const previewTooltip = t('action.preview', 'Preview');
	const downloadTooltip = t('action.download', 'Download');

	const { contextMenuItems, modals } = useAttachmentActions(attachment);

	const isVideo = isAttachmentVideo(attachment.mimeType);
	const thumbnailUrl = isVideo
		? getVideoThumbnailURL(attachment.id, '0x0', ImageQuality.LOW)
		: getAttachmentThumbnailURL(attachment.id, attachment.mimeType);

	// Latch the first visibility so the thumbnail is fetched lazily but only once.
	const [hasBeenVisible, setHasBeenVisible] = useState(false);
	useEffect(() => {
		if (visible) setHasBeenVisible(true);
	}, [visible]);

	// The backend replies 202 while the video frame is being generated: fall back
	// to the icon without retrying.
	const [thumbnailFailed, setThumbnailFailed] = useState(false);
	const onThumbnailError = useCallback(() => setThumbnailFailed(true), []);

	const canPreview = isPreviewSupported(attachment.mimeType);
	const { openFromGallery } = usePreviewNavigation();
	const onTileClick = useCallback(() => {
		if (canPreview) {
			openFromGallery(attachment.roomId, attachment);
		} else {
			downloadAttachment(attachment.id, attachment.name);
		}
	}, [attachment, canPreview, openFromGallery]);

	const showImage = hasBeenVisible && thumbnailUrl !== undefined && !thumbnailFailed;

	return (
		<TileSlot>
			<Tooltip label={canPreview ? previewTooltip : downloadTooltip} placement="top">
				<Dropdown
					items={contextMenuItems}
					contextMenu
					disableRestoreFocus
					display="block"
					style={{ width: '100%', height: '100%' }}
				>
					<TileWrapper
						data-testid={`mediaGalleryAttachmentClickArea-${attachment.id}`}
						onClick={onTileClick}
						role="button"
						aria-label={attachment.name}
					>
						{showImage ? (
							<TileImage src={thumbnailUrl} alt={attachment.name} onError={onThumbnailError} />
						) : (
							<Container mainAlignment="center" crossAlignment="center" height="100%">
								<Icon
									data-testid={`mediaGalleryTileIcon-${attachment.id}`}
									icon={isVideo ? 'Video' : 'Image'}
									size="large"
									color="secondary"
								/>
							</Container>
						)}
						{isVideo && (
							<VideoBadge data-testid={`mediaGalleryVideoBadge-${attachment.id}`}>
								<Icon icon="Video" size="small" color="gray6" />
							</VideoBadge>
						)}
					</TileWrapper>
				</Dropdown>
			</Tooltip>
			{modals}
		</TileSlot>
	);
};
