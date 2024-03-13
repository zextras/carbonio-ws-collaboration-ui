/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { RefObject, useCallback, useEffect, useMemo, useRef } from 'react';

import {
	Container,
	CreateSnackbarFn,
	Dropdown,
	DropdownItem,
	IconButton,
	Tooltip,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useIntegratedFunction } from '@zextras/carbonio-shell-ui';
import { forEach } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { getFilesToUploadArray } from '../../../../store/selectors/ActiveConversationsSelectors';
import { getXmppClient } from '../../../../store/selectors/ConnectionSelector';
import {
	getRoomNameSelector,
	getRoomTypeSelector
} from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';
import { FileToUpload } from '../../../../types/store/ActiveConversationTypes';
import { RoomType } from '../../../../types/store/RoomTypes';
import { uid } from '../../../../utils/attachmentUtils';

type AttachmentSelectorProps = {
	roomId: string;
};

const InputSelector = styled.input<{
	onChange: (ev: React.ChangeEvent<HTMLInputElement>) => void;
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
	const errorSnackbar = t(
		'settings.profile.errorGenericResponse',
		'Something went wrong. Please retry'
	);
	const chooseFileLabel = t('attachments.integrations.chooseFile', 'Choose file');
	const shareLabel = t('attachments.integrations.shareLink', 'Share public link');

	const xmppClient = useStore((store) => getXmppClient(store));
	const roomName = useStore((store) => getRoomNameSelector(store, roomId));
	const roomType = useStore((store) => getRoomTypeSelector(store, roomId));
	const setInputHasFocus = useStore((store) => store.setInputHasFocus);
	const setFilesToAttach = useStore((store) => store.setFilesToAttach);
	const filesToUploadArray = useStore((store) => getFilesToUploadArray(store, roomId));

	const [filesSelectFilesAction, filesSelectFilesActionAvailable] =
		useIntegratedFunction('select-nodes');
	const [getLink, functionCheck] = useIntegratedFunction('get-link');

	const createSnackbar: CreateSnackbarFn = useSnackbar();

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

	const confirmAction = useCallback(
		(nodes) => {
			const date = new Date().toLocaleString();
			let myDescription;
			if (roomType === RoomType.ONE_TO_ONE) {
				myDescription = `Generated from ${roomName}'s chat on ${date}`;
			} else {
				myDescription = `Generated from ${roomName} on ${date}`;
			}
			if (functionCheck) {
				getLink({ node: nodes[0], type: 'createLink', description: myDescription })
					.then((result: { url: string }) => {
						xmppClient.sendChatMessage(roomId, result.url);
					})
					.catch(() => {
						createSnackbar({
							key: new Date().toLocaleString(),
							type: 'error',
							label: errorSnackbar
						});
					});
			}
		},
		[createSnackbar, errorSnackbar, functionCheck, getLink, roomId, roomName, roomType, xmppClient]
	);

	const actionTarget = useMemo(
		() => ({
			title: chooseFileLabel,
			confirmAction,
			confirmLabel: shareLabel,
			allowFiles: true,
			allowFolders: false,
			maxSelection: 1
		}),
		[chooseFileLabel, confirmAction, shareLabel]
	);

	const handleClickPublicLink = useCallback(() => {
		filesSelectFilesAction(actionTarget);
	}, [actionTarget, filesSelectFilesAction]);

	const items: DropdownItem[] = useMemo(
		() => [
			{
				id: 'item1',
				icon: 'Link2',
				label: attachLinkLabel,
				keepOpen: false,
				disabled: !functionCheck || !filesSelectFilesActionAvailable,
				onClick: handleClickPublicLink
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
		[
			addLocalLabel,
			attachLinkLabel,
			filesSelectFilesActionAvailable,
			functionCheck,
			handleClickAttachment,
			handleClickPublicLink
		]
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
