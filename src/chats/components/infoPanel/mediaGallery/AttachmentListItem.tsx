/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect, useState } from 'react';

import styled from '@emotion/styled';
import {
	Avatar,
	Button,
	Container,
	ListItem,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { DeleteAttachmentModal } from './DeleteAttachmentModal';
import useDeleteAttachment from './useDeleteAttachment';
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

const AttachmentListItemContent: FC<AttachmentListItemContentProps> = ({ attachment, visible }) => {
	const [t] = useTranslation();
	const youLabel = t('status.you', 'You');
	const unknownUserLabel = t('status.unknownUser', 'Unknown user');
	const deleteTooltip = t('action.delete', 'Delete');
	const downloadTooltip = t('action.download', 'Download');
	const previewTooltip = t('action.preview', 'Preview');

	const sessionId = useStore(getUserId);
	const senderName = useStore((store) => getUserName(store, attachment.userId));

	const { canDelete, modalOpen, openModal, closeModal, confirmDelete } =
		useDeleteAttachment(attachment);

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

	const onDeleteClick = useCallback(
		(e: KeyboardEvent | React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
			e.stopPropagation();
			openModal();
		},
		[openModal]
	);

	const onDownloadClick = useCallback(
		(e: KeyboardEvent | React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
			e.stopPropagation();
			downloadAttachment(attachment.id, attachment.name);
		},
		[attachment.id, attachment.name]
	);

	return (
		<Tooltip label={previewTooltip} placement="top" disabled={!canPreview}>
			<CustomContainer
				data-testid={`mediaGalleryAttachmentClickArea-${attachment.id}`}
				orientation="horizontal"
				mainAlignment="flex-start"
				crossAlignment="center"
				clickable={canPreview}
				padding={{ left: 'large', right: 'small', vertical: 'extrasmall' }}
				gap="0.5rem"
				height="fit"
				onClick={canPreview ? onPreviewClick : undefined}
			>
				<FileAvatar
					data-testid={`mediaGalleryAttachmentIcon-${attachment.id}`}
					icon={getPinAttachmentIcon(attachment.mimeType)}
					label={attachment.name}
					shape="square"
					background="gray3"
					color={getPinAttachmentColor(attachment.mimeType)}
					picture={pictureUrl}
				/>
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
				{modalOpen && (
					<DeleteAttachmentModal open={modalOpen} onConfirm={confirmDelete} onClose={closeModal} />
				)}
			</CustomContainer>
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
