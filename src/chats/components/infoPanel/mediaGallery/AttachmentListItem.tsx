/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback } from 'react';

import styled from '@emotion/styled';
import { Avatar, Button, Container, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { DeleteAttachmentModal } from './DeleteAttachmentModal';
import useDeleteAttachment from './useDeleteAttachment';
import usePreview from '../../../../hooks/usePreview';
import { getUserId } from '../../../../store/selectors/SessionSelectors';
import { getUserName } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { Attachment } from '../../../../types/network/models/attachmentTypes';
import {
	downloadAttachment,
	getAttachmentSize,
	getPinAttachmentColor,
	getPinAttachmentIcon,
	isPreviewSupported
} from '../../../../utils/attachmentUtils';

type AttachmentListItemProps = {
	attachment: Attachment;
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

export const AttachmentListItem: FC<AttachmentListItemProps> = ({ attachment }) => {
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

	const { onPreviewClick } = usePreview(attachment, {
		onDelete: canDelete ? openModal : undefined
	});

	const handleDownload = useCallback(
		() => downloadAttachment(attachment.id, attachment.name),
		[attachment.id, attachment.name]
	);

	const fileInfoRow = (
		<Row
			data-testid={`mediaGalleryAttachmentClickArea-${attachment.id}`}
			takeAvailableSpace
			wrap="nowrap"
			mainAlignment="flex-start"
			crossAlignment="center"
			background="gray6"
			gap="0.5rem"
			onClick={canPreview ? onPreviewClick : undefined}
			style={{ cursor: canPreview ? 'pointer' : 'default' }}
		>
			<FileAvatar
				data-testid={`mediaGalleryAttachmentIcon-${attachment.id}`}
				icon={getPinAttachmentIcon(attachment.mimeType)}
				label={attachment.name}
				shape="square"
				background="gray3"
				color={getPinAttachmentColor(attachment.mimeType)}
			/>
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
	);

	return (
		<Container
			data-testid={`mediaGalleryAttachment-${attachment.id}`}
			orientation="horizontal"
			mainAlignment="flex-start"
			crossAlignment="center"
			padding={{ left: 'large', right: 'small', vertical: 'extrasmall' }}
			gap="0.5rem"
			height="fit"
		>
			{canPreview ? (
				<Tooltip label={previewTooltip} placement="top">
					{fileInfoRow}
				</Tooltip>
			) : (
				fileInfoRow
			)}
			<Tooltip label={downloadTooltip} placement="top">
				<Button
					data-testid={`mediaGalleryAttachmentDownload-${attachment.id}`}
					aria-label={downloadTooltip}
					size="large"
					icon="DownloadOutline"
					type="ghost"
					color="gray0"
					onClick={handleDownload}
				/>
			</Tooltip>
			{canDelete && (
				<Tooltip label={deleteTooltip} placement="top">
					<Button
						data-testid={`mediaGalleryAttachmentDelete-${attachment.id}`}
						size="large"
						icon="Trash2Outline"
						type="ghost"
						color="error"
						onClick={openModal}
					/>
				</Tooltip>
			)}
			{modalOpen && (
				<DeleteAttachmentModal open={modalOpen} onConfirm={confirmDelete} onClose={closeModal} />
			)}
		</Container>
	);
};
