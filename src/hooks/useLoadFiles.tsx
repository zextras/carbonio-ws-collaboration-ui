/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback } from 'react';

import { map } from 'lodash';

import useStore from '../store/Store';
import { FileToUpload } from '../types/store/ActiveConversationTypes';
import { uid } from '../utils/attachmentUtils';

const useLoadFiles = (roomId: string): ((files: FileList) => void) => {
	const addFilesToAttach = useStore((store) => store.addFilesToAttach);
	const setInputHasFocus = useStore((store) => store.setInputHasFocus);

	return useCallback(
		(files: FileList) => {
			const listOfFiles: FileToUpload[] = map(files, (file) => ({
				file,
				fileId: uid(),
				localUrl: URL.createObjectURL(file)
			}));
			addFilesToAttach(roomId, listOfFiles);
			setInputHasFocus(roomId, true);
		},
		[roomId, addFilesToAttach, setInputHasFocus]
	);
};

export default useLoadFiles;
