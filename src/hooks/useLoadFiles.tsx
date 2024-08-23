/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import { Container, Padding, Text, useModal } from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import { useTranslation } from 'react-i18next';

import { FILE_DESCRIPTION_CHAR_LIMIT } from '../constants/messageConstants';
import { getFilesToUploadArray } from '../store/selectors/ActiveConversationsSelectors';
import useStore from '../store/Store';
import { FileToUpload } from '../types/store/ActiveConversationTypes';
import { uid } from '../utils/attachmentUtils';

const useLoadFiles = (roomId: string, clearInput?: () => void): ((files: FileList) => void) => {
	const [t] = useTranslation();
	const titleLabel = t('conversation.longCaption.modal.title', 'Message too long for caption');
	const descriptionLabel = t(
		'conversation.longCaption.modal.description',
		"This text is too long and it can't be used as the attachment caption."
	);
	const description2Label = t(
		'conversation.longCaption.modal.additionalDetails',
		'If you proceed with the operation, the excess will be removed from the original text. Proceed?'
	);
	const confirmLabel = t('conversation.longCaption.modal.action', 'Attach anyway');

	const filesToUploadArray = useStore((store) => getFilesToUploadArray(store, roomId));
	const setFilesToAttach = useStore((store) => store.setFilesToAttach);
	const setInputHasFocus = useStore((store) => store.setInputHasFocus);

	const { createModal, closeModal } = useModal();

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
				const modalId = 'attachment-description-limit-modal';
				createModal({
					id: modalId,
					title: titleLabel,
					confirmLabel,
					onConfirm: () => {
						setFilesIntoStore(files);
						closeModal(modalId);
					},
					showCloseIcon: true,
					onClose: () => {
						clearInput?.();
						closeModal(modalId);
					},
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
			clearInput,
			closeModal,
			confirmLabel,
			createModal,
			description2Label,
			descriptionLabel,
			setFilesIntoStore,
			titleLabel
		]
	);
};

export default useLoadFiles;
