/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, FileLoader, Tooltip } from '@zextras/carbonio-design-system';
import { forEach } from 'lodash';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { RoomsApi } from '../../../network';

type AttachmentSelectorProps = {
	roomId: string;
};

const AttachmentSelector: React.FC<AttachmentSelectorProps> = ({ roomId }) => {
	const [t] = useTranslation();
	const uploadAttachmentTooltip = t('tooltip.uploadAttachment', 'Upload an attachment');

	const selectFiles = useCallback(
		(ev) => {
			const { files } = ev.target as HTMLInputElement;
			forEach(files, (file: File) => RoomsApi.addRoomAttachment(roomId, file));
		},
		[roomId]
	);

	return (
		<Container width="fit" height="fit" padding={{ right: 'extrasmall', bottom: '0.3125rem' }}>
			<Tooltip label={uploadAttachmentTooltip} placement="top">
				<FileLoader size="large" iconColor="gray1" onChange={selectFiles} multiple />
			</Tooltip>
		</Container>
	);
};

export default AttachmentSelector;
