/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { Button, Container, Icon, Modal, Row, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

type DeleteAttachmentModalProps = {
	open: boolean;
	onConfirm: () => void;
	onClose: () => void;
	onCancel?: () => void;
};

export const DeleteAttachmentModal: FC<DeleteAttachmentModalProps> = ({
	open,
	onConfirm,
	onClose,
	onCancel
}) => {
	const [t] = useTranslation();
	const title = t('mediaGallery.deleteAttachmentTitle', 'Delete attachment');
	const description = t(
		'mediaGallery.deleteAttachmentDescription',
		'Do you want to delete this attachment? If you delete it, the file will be permanently removed. The caption of the original message, if present, will also be deleted from the conversation history.'
	);
	const warning = t('mediaGallery.deleteAttachmentWarning', 'This action cannot be undone.');
	const confirmLabel = t('mediaGallery.deleteAttachmentConfirm', 'Yes, delete attachment');
	const cancelLabel = t('mediaGallery.deleteAttachmentCancel', 'No, cancel');
	const closeLabel = t('action.close', 'Close');

	const titleNode = (
		<Row mainAlignment="flex-start" crossAlignment="center" gap="0.5rem">
			<Icon icon="AlertCircleOutline" color="error" size="large" />
			<Text size="medium" weight="bold">
				{title}
			</Text>
		</Row>
	);

	const customFooter = (
		<Container orientation="horizontal" mainAlignment="flex-end" gap="0.5rem">
			<Button label={cancelLabel} type="outlined" color="secondary" onClick={onClose} />
			<Button label={confirmLabel} color="error" onClick={onConfirm} />
		</Container>
	);

	return (
		<Modal
			size="small"
			zIndex={9000}
			open={open}
			title={titleNode}
			customFooter={customFooter}
			showCloseIcon
			closeIconTooltip={closeLabel}
			onClose={onClose}
			data-testid="deleteAttachmentModal"
		>
			<Container crossAlignment="flex-start" padding={{ vertical: 'large' }} gap="0.75rem">
				<Text overflow="break-word">{description}</Text>
				<Text overflow="break-word" color="error" weight="bold">
					{warning}
				</Text>
			</Container>
		</Modal>
	);
};
