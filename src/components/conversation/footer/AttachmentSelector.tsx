/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Dropdown, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { forEach } from 'lodash';
import React, { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { v4 as uuidGenerator } from 'uuid';

import useStore from '../../../store/Store';
import { FileToUpload } from '../../../types/store/ActiveConversationTypes';

type AttachmentSelectorProps = {
	roomId: string;
};

const InputSelector = styled.input`
	cursor: pointer;
	opacity: 0;
	z-index: 2;
	position: absolute;
	right: 0;
	top: 0;
	width: 3.5rem;
	height: 3.5rem;
`;

const AttachmentSelector: React.FC<AttachmentSelectorProps> = ({ roomId }) => {
	const [t] = useTranslation();
	const uploadAttachmentTooltip = t('tooltip.uploadAttachment', 'Upload an attachment');
	const attachLinkLabel = t('attachments.attachLinkFiles', 'Attach public link from Files');
	const addLocalLabel = t('attachments.addFromLocal', 'Add from local');

	const setFilesToAttach = useStore((store) => store.setFilesToAttach);

	const fileSelectorInputRef = useRef<HTMLInputElement>(null);

	const selectFiles = useCallback(
		(ev) => {
			const { files } = ev.target as HTMLInputElement;
			const listOfFiles: FileToUpload[] = [];
			forEach(files, (file: File) => {
				const fileLocalUrl = URL.createObjectURL(file);
				const fileId = uuidGenerator();
				listOfFiles.push({
					file,
					fileId,
					hasFocus: false,
					description: '',
					localUrl: fileLocalUrl
				});
			});
			setFilesToAttach(roomId, listOfFiles);
		},
		[setFilesToAttach, roomId]
	);

	const handleClickAttachment = useCallback(
		() => fileSelectorInputRef.current?.click(),
		[fileSelectorInputRef]
	);

	const items = [
		{
			id: 'item1',
			icon: 'Link2',
			label: attachLinkLabel,
			keepOpen: false,
			disabled: true,
			onClick: null
		},
		{
			id: 'item2',
			icon: 'MonitorOutline',
			label: addLocalLabel,
			keepOpen: false,
			disabled: false,
			onClick: handleClickAttachment
		}
	];

	return (
		<Container width="fit" height="fit" padding={{ right: 'extrasmall', bottom: '0.3125rem' }}>
			<Tooltip label={uploadAttachmentTooltip} placement="top">
				<Dropdown items={items} placement="top-end">
					<IconButton icon="Attach" iconColor="gray1" size="large" />
				</Dropdown>
			</Tooltip>
			<InputSelector
				onChange={selectFiles}
				type="file"
				multiple
				hidden
				ref={fileSelectorInputRef}
			/>
		</Container>
	);
};

export default AttachmentSelector;
