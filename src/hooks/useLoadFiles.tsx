/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import { Container, Padding, useModal, Text } from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import { useTranslation } from 'react-i18next';

import { FILE_DESCRIPTION_CHAR_LIMIT } from '../constants/messageConstants';
import { getFilesToUploadArray } from '../store/selectors/ActiveConversationsSelectors';
import useStore from '../store/Store';
import { FileToUpload } from '../types/store/ActiveConversationTypes';
import { uid } from '../utils/attachmentUtils';

const useLoadFiles = (roomId: string): ((files: FileList) => void) => {
	const [t] = useTranslation();
	// TODO add translation keys
	const titleLabel = t('', 'Message too long for caption');
	const descriptionLabel = t(
		'',
		'The message you are attaching this item to is very long and cannot be used as an attachment caption.'
	);
	const description2Label = t(
		'',
		'If you proceed with the operation, the excess will be removed from the original text. Proceed?'
	);
	const confirmLabel = t('', 'Attach anyway');

	const filesToUploadArray = useStore((store) => getFilesToUploadArray(store, roomId));
	const setFilesToAttach = useStore((store) => store.setFilesToAttach);
	const setInputHasFocus = useStore((store) => store.setInputHasFocus);

	const creationModal = useModal();

	const setFilesIntoStore = useCallback(
		(files: FileList) => {
			const listOfFiles: FileToUpload[] = map(files, (file, index) => ({
				file,
				fileId: uid(),
				hasFocus: index === 0 && !filesToUploadArray,
				description: '',
				localUrl: URL.createObjectURL(file)
			}));
			setFilesToAttach(roomId, listOfFiles);
			setInputHasFocus(roomId, true);
		},
		[filesToUploadArray, roomId, setFilesToAttach, setInputHasFocus]
	);

	return useCallback(
		(files: FileList) => {
			const textAreaComposer = document.querySelector('[data-testid="textAreaComposer"]');
			if (size(textAreaComposer?.textContent) > FILE_DESCRIPTION_CHAR_LIMIT) {
				const closeModal = creationModal({
					title: titleLabel,
					confirmLabel,
					onConfirm: () => {
						setFilesIntoStore(files);
						closeModal();
					},
					showCloseIcon: true,
					onClose: () => closeModal(),
					children: (
						<Container>
							<Text overflow="break-word">{descriptionLabel}</Text>
							<Padding vertical="medium" />
							<Text overflow="break-word">{description2Label}</Text>
						</Container>
					)
				});
			} else {
				setFilesIntoStore(files);
			}
		},
		[
			confirmLabel,
			creationModal,
			description2Label,
			descriptionLabel,
			setFilesIntoStore,
			titleLabel
		]
	);
};

export default useLoadFiles;
