/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useState } from 'react';

import styled from '@emotion/styled';
import {
	Avatar,
	Button,
	Container,
	Row,
	Text,
	Tooltip,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { DeleteAttachmentModal } from './DeleteAttachmentModal';
import { bulkDeleteRoomAttachments } from '../../../../network';
import { xmppClient } from '../../../../network/xmpp/XMPPClient';
import { getUserId } from '../../../../store/selectors/SessionSelectors';
import { getUserName } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { Attachment } from '../../../../types/network/models/attachmentTypes';
import {
	downloadAttachment,
	getAttachmentSize,
	getPinAttachmentColor,
	getPinAttachmentIcon
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
	const successLabel = t('feedback.attachmentDeleted', 'Attachment deleted');
	const errorLabel = t('feedback.attachmentDeleteError', 'Could not delete the attachment');

	const sessionId = useStore(getUserId);
	const senderName = useStore((store) => getUserName(store, attachment.userId));
	const removeMediaGalleryAttachment = useStore((store) => store.removeMediaGalleryAttachment);
	const createSnackbar = useSnackbar();

	const [modalOpen, setModalOpen] = useState(false);

	const senderLabel = sessionId === attachment.userId ? youLabel : senderName || unknownUserLabel;
	const sizeLabel = getAttachmentSize(attachment.size);
	const subline = sizeLabel ? `${senderLabel} • ${sizeLabel}` : senderLabel;
	const canDelete = sessionId === attachment.userId;

	const openModal = useCallback(() => setModalOpen(true), []);
	const closeModal = useCallback(() => setModalOpen(false), []);

	const handleDownload = useCallback(
		() => downloadAttachment(attachment.id, attachment.name),
		[attachment.id, attachment.name]
	);

	const confirmDelete = useCallback(() => {
		setModalOpen(false);
		const showSnackbar = (severity: 'success' | 'error', label: string): void => {
			createSnackbar({
				key: new Date().toLocaleString(),
				severity,
				label,
				hideButton: true
			});
		};
		bulkDeleteRoomAttachments(attachment.roomId, [attachment.id])
			.then((response) => {
				if (response.failedIds?.includes(attachment.id)) {
					showSnackbar('error', errorLabel);
					return;
				}
				removeMediaGalleryAttachment(attachment.roomId, attachment.id);
				if (attachment.stanzaId) {
					xmppClient.sendChatMessageDeletion(attachment.roomId, attachment.stanzaId);
				}
				showSnackbar('success', successLabel);
			})
			.catch(() => showSnackbar('error', errorLabel));
	}, [
		attachment.id,
		attachment.roomId,
		attachment.stanzaId,
		createSnackbar,
		errorLabel,
		removeMediaGalleryAttachment,
		successLabel
	]);

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
			<FileAvatar
				data-testid={`mediaGalleryAttachmentIcon-${attachment.id}`}
				icon={getPinAttachmentIcon(attachment.mimeType)}
				label={attachment.name}
				shape="square"
				background="gray3"
				color={getPinAttachmentColor(attachment.mimeType)}
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
