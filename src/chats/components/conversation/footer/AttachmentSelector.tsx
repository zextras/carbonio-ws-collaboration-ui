/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { RefObject, useCallback, useEffect, useMemo, useRef } from 'react';

import {
	Container,
	Dropdown,
	DropdownItem,
	IconButton,
	Tooltip
} from '@zextras/carbonio-design-system';
import { forEach } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { getFilesToUploadArray } from '../../../../store/selectors/ActiveConversationsSelectors';
import useStore from '../../../../store/Store';
import { FileToUpload } from '../../../../types/store/ActiveConversationTypes';
import { uid } from '../../../../utils/attachmentUtils';

type AttachmentSelectorProps = {
	roomId: string;
};

const InputSelector = styled.input<{
	onChange: (ev: any) => void;
	type: string;
	multiple: boolean;
	hidden: boolean;
	ref: RefObject<HTMLInputElement>;
}>`
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

	const setInputHasFocus = useStore((store) => store.setInputHasFocus);
	const setFilesToAttach = useStore((store) => store.setFilesToAttach);
	const filesToUploadArray = useStore((store) => getFilesToUploadArray(store, roomId));

	const fileSelectorInputRef = useRef<HTMLInputElement>(null);

	const selectFiles = useCallback(
		(ev) => {
			const { files } = ev.target as HTMLInputElement;
			const listOfFiles: FileToUpload[] = [];
			forEach(files, (file: File, index) => {
				const fileLocalUrl = URL.createObjectURL(file);
				const fileId = uid();
				const isFocusedIfFirstOfListAndFirstToBeUploaded = index === 0 && !filesToUploadArray;
				listOfFiles.push({
					file,
					fileId,
					hasFocus: isFocusedIfFirstOfListAndFirstToBeUploaded,
					description: '',
					localUrl: fileLocalUrl
				});
			});
			setFilesToAttach(roomId, listOfFiles);
			if (!filesToUploadArray) {
				setInputHasFocus(roomId, true);
			}
		},
		[setFilesToAttach, roomId, setInputHasFocus, filesToUploadArray]
	);

	const handleClickAttachment = useCallback(
		() => fileSelectorInputRef.current?.click(),
		[fileSelectorInputRef]
	);

	useEffect(() => {
		if (!filesToUploadArray && fileSelectorInputRef.current) {
			fileSelectorInputRef.current.value = '';
		}
	}, [filesToUploadArray]);

	const items: DropdownItem[] = useMemo(
		() => [
			{
				id: 'item1',
				icon: 'Link2',
				label: attachLinkLabel,
				keepOpen: false,
				disabled: true,
				onClick: () => null
			},
			{
				id: 'item2',
				icon: 'MonitorOutline',
				label: addLocalLabel,
				keepOpen: false,
				disabled: false,
				onClick: handleClickAttachment
			}
		],
		[addLocalLabel, attachLinkLabel, handleClickAttachment]
	);

	return (
		<Container width="fit" height="fit">
			<Tooltip label={uploadAttachmentTooltip} placement="top">
				<Dropdown items={items} placement="top-end">
					<IconButton icon="Attach" iconColor="gray1" size="large" onClick={(): null => null} />
				</Dropdown>
			</Tooltip>
			<InputSelector
				data-testid="inputSelector"
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
