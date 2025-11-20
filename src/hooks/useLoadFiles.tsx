/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback } from 'react';

import { map } from 'lodash';

import { getFilesToUploadArray } from '../store/selectors/ActiveConversationsSelectors';
import useStore from '../store/Store';
import { FileToUpload } from '../types/store/ActiveConversationTypes';
import { uid } from '../utils/attachmentUtils';

const useLoadFiles = (roomId: string): ((files: FileList) => void) => {
	const filesToUploadArray = useStore((store) => getFilesToUploadArray(store, roomId));
	const addFilesToAttach = useStore((store) => store.addFilesToAttach);
	const setInputHasFocus = useStore((store) => store.setInputHasFocus);

	return useCallback(
		(files: FileList) => {
			const textArea = document.querySelector(
				'textarea[data-testid="textAreaComposer"]'
			) as HTMLTextAreaElement;
			const listOfFiles: FileToUpload[] = map(files, (file, index) => ({
				file,
				fileId: uid(),
				hasFocus: index === 0 && !filesToUploadArray,
				description: index === 0 && !filesToUploadArray && textArea?.value ? textArea.value : '',
				localUrl: URL.createObjectURL(file)
			}));
			addFilesToAttach(roomId, listOfFiles);
			setInputHasFocus(roomId, true);
		},
		[filesToUploadArray, roomId, addFilesToAttach, setInputHasFocus]
	);
};

export default useLoadFiles;
