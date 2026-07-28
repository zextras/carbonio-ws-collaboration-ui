/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useContext, useEffect, useState } from 'react';

import styled from '@emotion/styled';
import {
	Avatar,
	Button,
	Container,
	Dropdown,
	Icon,
	ListItem,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MediaGallerySelectionContext } from './MediaGallerySelectionContext';
import useAttachmentActions from './useAttachmentActions';
import usePreviewNavigation from '../../../../hooks/usePreviewNavigation';
import { getUserId } from '../../../../store/selectors/SessionSelectors';
import { getUserName } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { Attachment } from '../../../../types/network/models/attachmentTypes';
import {
	downloadAttachment,
	getAttachmentSize,
	getAttachmentThumbnailURL,
	getPinAttachmentColor,
	getPinAttachmentIcon,
	isPreviewSupported
} from '../../../../utils/attachmentUtils';

type AttachmentListItemProps = {
	attachment: Attachment;
	listRef?: React.RefObject<HTMLDivElement>;
};

type AttachmentListItemContentProps = {
	attachment: Attachment;
	visible: boolean;
};

const FileAvatar = styled(Avatar)`
	min-width: 2.5rem;
	min-height: 2.5rem;
	width: 2.5rem;
	height: 2.5rem;
	svg {
		width: 1.5rem;
		min-width: 1.5rem;
		height: 1.5rem;
		min-height: 1.5rem;
	}
`;

const CustomContainer = styled(Container)<{ clickable: boolean }>`
	cursor: ${(props): string => (props.clickable ? 'pointer' : 'default')};
`;

// Swaps the file icon with the selection checkbox on hover and while the
// selection mode is active.
const AvatarSlot = styled.div<{ $selectionMode: boolean }>`
	position: relative;
	flex-shrink: 0;
	/* Opacity instead of display keeps the checkbox keyboard-focusable; its
	   opaque background covers the file icon when shown. */
	.selectionCheckbox {
		opacity: ${({ $selectionMode }): number => ($selectionMode ? 1 : 0)};
	}
	&:hover .selectionCheckbox,
	.selectionCheckbox:focus-visible {
		opacity: 1;
	}
	/* Where hovering is possible the hidden checkbox must not swallow the clicks
	   aimed at the file icon it covers. */
	@media (hover: hover) {
		.selectionCheckbox {
			pointer-events: ${({ $selectionMode }): string => ($selectionMode ? 'auto' : 'none')};
		}
		&:hover .selectionCheckbox,
		.selectionCheckbox:focus-visible {
			pointer-events: auto;
		}
	}
	/* Without hover the checkbox would never show up, leaving no way into the
	   selection mode: keep it visible. */
	@media (hover: none) {
		.selectionCheckbox {
			opacity: 1;
		}
	}
`;

// Takes the place of the file avatar, so it matches its footprint and its 15%
// rounding. Selected state as per Figma (Info Panel, node 4413:3324): filled
// primary box with a white checkmark, here scaled up to the avatar size.
const SelectionCheckbox = styled.div<{ $selected: boolean }>`
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	border-radius: 15%;
	background-color: ${({ $selected, theme }): string =>
		$selected ? theme.palette.primary.regular : theme.palette.gray6.regular};
`;

const AttachmentListItemContent: FC<AttachmentListItemContentProps> = ({ attachment, visible }) => {
	const [t] = useTranslation();
	const youLabel = t('status.you', 'You');
	const unknownUserLabel = t('status.unknownUser', 'Unknown user');
	const deleteTooltip = t('action.delete', 'Delete');
	const forwardTooltip = t('action.forward', 'Forward');
	const downloadTooltip = t('action.download', 'Download');
	const previewTooltip = t('action.preview', 'Preview');

	const sessionId = useStore(getUserId);
	const senderName = useStore((store) => getUserName(store, attachment.userId));

	const { canDelete, openDeleteModal, canForward, openForwardModal, contextMenuItems, modals } =
		useAttachmentActions(attachment);
	const { isSelectionMode, isSelected, toggleSelection } = useContext(MediaGallerySelectionContext);
	const selected = isSelected(attachment.id);

	const senderLabel = sessionId === attachment.userId ? youLabel : senderName || unknownUserLabel;
	const sizeLabel = getAttachmentSize(attachment.size);
	const subline = sizeLabel ? `${senderLabel} • ${sizeLabel}` : senderLabel;
	const canPreview = isPreviewSupported(attachment.mimeType);

	const thumbnailUrl = getAttachmentThumbnailURL(attachment.id, attachment.mimeType);

	const [hasBeenVisible, setHasBeenVisible] = useState(false);
	useEffect(() => {
		if (visible) setHasBeenVisible(true);
	}, [visible]);
	const pictureUrl = hasBeenVisible ? thumbnailUrl : undefined;

	const { openFromGallery } = usePreviewNavigation();
	const onPreviewClick = useCallback(() => {
		openFromGallery(attachment.roomId, attachment);
	}, [attachment, openFromGallery]);

	const onRowClick = useCallback(() => {
		if (isSelectionMode) {
			toggleSelection(attachment);
		} else if (canPreview) {
			onPreviewClick();
		}
	}, [attachment, canPreview, isSelectionMode, onPreviewClick, toggleSelection]);

	const onCheckboxClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			e.stopPropagation();
			toggleSelection(attachment);
		},
		[attachment, toggleSelection]
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

	const onDeleteClick = useCallback(
		(e: KeyboardEvent | React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
			e.stopPropagation();
			openDeleteModal();
		},
		[openDeleteModal]
	);

	const onForwardClick = useCallback(
		(e: KeyboardEvent | React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
			e.stopPropagation();
			openForwardModal();
		},
		[openForwardModal]
	);

	const onDownloadClick = useCallback(
		(e: KeyboardEvent | React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
			e.stopPropagation();
			downloadAttachment(attachment.id, attachment.name);
		},
		[attachment.id, attachment.name]
	);

	return (
		<Tooltip label={previewTooltip} placement="top" disabled={!canPreview || isSelectionMode}>
			<Dropdown
				items={contextMenuItems}
				contextMenu
				disabled={isSelectionMode}
				disableRestoreFocus
				display="block"
			>
				<CustomContainer
					data-testid={`mediaGalleryAttachmentClickArea-${attachment.id}`}
					orientation="horizontal"
					mainAlignment="flex-start"
					crossAlignment="center"
					clickable={canPreview || isSelectionMode}
					padding={{ left: 'large', right: 'small', vertical: 'extrasmall' }}
					gap="0.5rem"
					height="fit"
					onClick={canPreview || isSelectionMode ? onRowClick : undefined}
				>
					<AvatarSlot $selectionMode={isSelectionMode}>
						<FileAvatar
							className="fileAvatar"
							data-testid={`mediaGalleryAttachmentIcon-${attachment.id}`}
							icon={getPinAttachmentIcon(attachment.mimeType)}
							label={attachment.name}
							shape="square"
							background="gray3"
							color={getPinAttachmentColor(attachment.mimeType)}
							picture={pictureUrl}
						/>
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
								size="large"
								color={selected ? 'gray6' : 'gray0'}
							/>
						</SelectionCheckbox>
					</AvatarSlot>
					<Row takeAvailableSpace wrap="nowrap" mainAlignment="flex-start" crossAlignment="center">
						<Container
							orientation="vertical"
							mainAlignment="center"
							crossAlignment="flex-start"
							minWidth={0}
						>
							<Tooltip overflowTooltip label={attachment.name}>
								<Text size="small" overflow="ellipsis" lineHeight={1}>
									{attachment.name}
								</Text>
							</Tooltip>
							<Tooltip overflowTooltip label={subline}>
								<Text size="extrasmall" color="secondary" overflow="ellipsis" lineHeight={1.5}>
									{subline}
								</Text>
							</Tooltip>
						</Container>
					</Row>
					{canDelete && (
						<Tooltip label={deleteTooltip} placement="top">
							<Button
								data-testid={`mediaGalleryAttachmentDelete-${attachment.id}`}
								size="large"
								icon="Trash2Outline"
								type="ghost"
								color="error"
								onClick={onDeleteClick}
							/>
						</Tooltip>
					)}
					{canForward && (
						<Tooltip label={forwardTooltip} placement="top">
							<Button
								data-testid={`mediaGalleryAttachmentForward-${attachment.id}`}
								aria-label={forwardTooltip}
								size="large"
								icon="Forward"
								type="ghost"
								color="gray0"
								onClick={onForwardClick}
							/>
						</Tooltip>
					)}
					<Tooltip label={downloadTooltip} placement="top">
						<Button
							data-testid={`mediaGalleryAttachmentDownload-${attachment.id}`}
							aria-label={downloadTooltip}
							size="large"
							icon="DownloadOutline"
							type="ghost"
							color="gray0"
							onClick={onDownloadClick}
						/>
					</Tooltip>
					{modals}
				</CustomContainer>
			</Dropdown>
		</Tooltip>
	);
};

export const AttachmentListItem: FC<AttachmentListItemProps> = ({ attachment, listRef }) => (
	<ListItem key={attachment.id} background="gray6" listRef={listRef}>
		{(visible: boolean): React.ReactElement => (
			<AttachmentListItemContent attachment={attachment} visible={visible} />
		)}
	</ListItem>
);
