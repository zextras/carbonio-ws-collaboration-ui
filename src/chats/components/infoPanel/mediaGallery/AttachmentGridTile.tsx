/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useContext, useEffect, useState } from 'react';

import styled from '@emotion/styled';
import { Container, Dropdown, Icon, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MediaGallerySelectionContext } from './MediaGallerySelectionContext';
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

const TileSlot = styled.div`
	width: calc((100% - 3 * 0.125rem) / 4);
	aspect-ratio: 1 / 1;
`;

const TileWrapper = styled.div<{ $selectionMode: boolean }>`
	position: relative;
	width: 100%;
	height: 100%;
	overflow: hidden;
	cursor: pointer;
	background-color: ${({ theme }): string => theme.palette.gray5.regular};
	.selectionCheckbox {
		opacity: ${({ $selectionMode }): number => ($selectionMode ? 1 : 0)};
	}
	&:hover .selectionCheckbox,
	.selectionCheckbox:focus-visible {
		opacity: 1;
	}
	@media (hover: hover) {
		.selectionCheckbox {
			pointer-events: ${({ $selectionMode }): string => ($selectionMode ? 'auto' : 'none')};
		}
		&:hover .selectionCheckbox,
		.selectionCheckbox:focus-visible {
			pointer-events: auto;
		}
	}
	@media (hover: none) {
		.selectionCheckbox {
			opacity: 1;
		}
	}
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

const SelectionCheckbox = styled.div<{ $selected: boolean }>`
	position: absolute;
	top: 0.25rem;
	left: 0.25rem;
	z-index: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.125rem;
	height: 1.125rem;
	cursor: pointer;
	border-radius: 0.1875rem;
	background-color: ${({ $selected, theme }): string =>
		$selected ? theme.palette.primary.regular : 'transparent'};
	filter: drop-shadow(0 0 0.125rem rgba(0, 0, 0, 0.6));
`;

type AttachmentGridTileProps = {
	attachment: Attachment;
	visible: boolean;
};

export const AttachmentGridTile: FC<AttachmentGridTileProps> = ({ attachment, visible }) => {
	const [t] = useTranslation();
	const previewTooltip = t('action.preview', 'Preview');
	const downloadTooltip = t('action.download', 'Download');

	const { contextMenuItems, modals } = useAttachmentActions(attachment);
	const { isSelectionMode, isSelected, toggleSelection } = useContext(MediaGallerySelectionContext);
	const selected = isSelected(attachment.id);

	const isVideo = isAttachmentVideo(attachment.mimeType);
	const thumbnailUrl = isVideo
		? getVideoThumbnailURL(attachment.id, '0x0', ImageQuality.LOW)
		: getAttachmentThumbnailURL(attachment.id, attachment.mimeType);

	const [hasBeenVisible, setHasBeenVisible] = useState(false);
	useEffect(() => {
		if (visible) setHasBeenVisible(true);
	}, [visible]);

	const [thumbnailFailed, setThumbnailFailed] = useState(false);
	const onThumbnailError = useCallback(() => setThumbnailFailed(true), []);

	const canPreview = isPreviewSupported(attachment.mimeType);
	const { openFromGallery } = usePreviewNavigation();
	const onTileClick = useCallback(() => {
		if (isSelectionMode) {
			toggleSelection(attachment);
		} else if (canPreview) {
			openFromGallery(attachment.roomId, attachment);
		} else {
			downloadAttachment(attachment.id, attachment.name);
		}
	}, [attachment, canPreview, isSelectionMode, openFromGallery, toggleSelection]);

	const onCheckboxClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			e.stopPropagation();
			toggleSelection(attachment);
		},
		[attachment, toggleSelection]
	);

	const onTileKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (e.key !== 'Enter' && e.key !== ' ') return;
			e.preventDefault();
			onTileClick();
		},
		[onTileClick]
	);

	const onCheckboxKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (e.key !== 'Enter' && e.key !== ' ') return;
			e.preventDefault();
			e.stopPropagation();
			toggleSelection(attachment);
		},
		[attachment, toggleSelection]
	);

	const showImage = hasBeenVisible && thumbnailUrl !== undefined && !thumbnailFailed;

	return (
		<TileSlot>
			<Tooltip
				label={canPreview ? previewTooltip : downloadTooltip}
				placement="top"
				disabled={isSelectionMode}
			>
				<Dropdown
					items={contextMenuItems}
					contextMenu
					disabled={isSelectionMode}
					disableRestoreFocus
					display="block"
					style={{ width: '100%', height: '100%' }}
				>
					<TileWrapper
						data-testid={`mediaGalleryAttachmentClickArea-${attachment.id}`}
						onClick={onTileClick}
						onKeyDown={onTileKeyDown}
						role="button"
						tabIndex={0}
						aria-label={attachment.name}
						$selectionMode={isSelectionMode}
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
						<SelectionCheckbox
							className="selectionCheckbox"
							data-testid={`mediaGallerySelect-${attachment.id}`}
							onClick={onCheckboxClick}
							onKeyDown={onCheckboxKeyDown}
							$selected={selected}
							role="checkbox"
							tabIndex={0}
							aria-checked={selected}
							aria-label={attachment.name}
						>
							<Icon
								icon={selected ? 'Checkmark' : 'Square'}
								size={selected ? 'small' : 'medium'}
								color="gray6"
							/>
						</SelectionCheckbox>
					</TileWrapper>
				</Dropdown>
			</Tooltip>
			{modals}
		</TileSlot>
	);
};
