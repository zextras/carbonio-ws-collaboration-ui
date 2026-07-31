/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useContext } from 'react';

import styled from '@emotion/styled';
import { Button, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MediaGallerySelectionContext } from './MediaGallerySelectionContext';
import useAttachmentActions from './useAttachmentActions';

const BarContainer = styled.div`
	position: absolute;
	bottom: 0.75rem;
	left: 50%;
	transform: translateX(-50%);
	z-index: 2;
	display: flex;
	gap: 0.25rem;
	padding: 0.25rem 0.5rem;
	border-radius: 2rem;
	background-color: ${({ theme }): string => theme.palette.gray5.regular};
	box-shadow: 0 0 0.25rem rgba(0, 0, 0, 0.25);
`;

const RoundActionButton = styled(Button)`
	&:hover {
		background-color: ${({ theme }): string => theme.palette.gray5.hover} !important;
	}
`;

export const BulkActionsBar: FC = () => {
	const [t] = useTranslation();
	const downloadTooltip = t('action.download', 'Download');
	const forwardTooltip = t('action.forward', 'Forward');
	const deleteTooltip = t('action.delete', 'Delete');
	const forwardDisabledTooltip = t(
		'mediaGallery.selection.forwardDisabled',
		'Some of the selected attachments cannot be forwarded'
	);
	const deleteDisabledTooltip = t(
		'mediaGallery.selection.deleteDisabled',
		'You can only delete your own attachments'
	);

	const { selectedAttachments, clearSelection } = useContext(MediaGallerySelectionContext);

	const { canDelete, openDeleteModal, canForward, openForwardModal, download, modals } =
		useAttachmentActions(selectedAttachments, { onDeleted: clearSelection });

	return (
		<BarContainer data-testid="mediaGalleryBulkActionsBar">
			<Tooltip label={downloadTooltip} placement="top">
				<RoundActionButton
					data-testid="mediaGalleryBulkDownload"
					aria-label={downloadTooltip}
					size="large"
					shape="round"
					icon="DownloadOutline"
					type="ghost"
					color="gray0"
					onClick={download}
				/>
			</Tooltip>
			<Tooltip label={canForward ? forwardTooltip : forwardDisabledTooltip} placement="top">
				<RoundActionButton
					data-testid="mediaGalleryBulkForward"
					aria-label={forwardTooltip}
					size="large"
					shape="round"
					icon="Forward"
					type="ghost"
					color="gray0"
					disabled={!canForward}
					onClick={openForwardModal}
				/>
			</Tooltip>
			<Tooltip label={canDelete ? deleteTooltip : deleteDisabledTooltip} placement="top">
				<RoundActionButton
					data-testid="mediaGalleryBulkDelete"
					aria-label={deleteTooltip}
					size="large"
					shape="round"
					icon="Trash2Outline"
					type="ghost"
					color="error"
					disabled={!canDelete}
					onClick={openDeleteModal}
				/>
			</Tooltip>
			{modals}
		</BarContainer>
	);
};
