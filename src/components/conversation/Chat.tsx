/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import { forEach } from 'lodash';
import React, {
	Dispatch,
	ReactElement,
	SetStateAction,
	useCallback,
	useEffect,
	useState
} from 'react';
import styled from 'styled-components';
import { v4 as uuidGenerator } from 'uuid';

import { getFilesToUploadArray } from '../../store/selectors/ActiveConversationsSelectors';
import useStore from '../../store/Store';
import { FileToUpload } from '../../types/store/ActiveConversationTypes';
import useMediaQueryCheck from '../../utils/useMediaQueryCheck';
import ConversationHeader from './ConversationHeader';
import DropZoneView from './DropZoneView';
import ConversationFooter from './footer/ConversationFooter';
import MessagesList from './MessagesList';

const CustomContainer = styled(Container)`
	position: relative;
`;

type ChatsProps = {
	roomId: string;
	setInfoPanelOpen: Dispatch<SetStateAction<boolean>>;
};

const Chat = ({ roomId, setInfoPanelOpen }: ChatsProps): ReactElement => {
	const filesToUploadArray = useStore((store) => getFilesToUploadArray(store, roomId));
	// const draftMessage = useStore((store) => getDraftMessage(store, roomId));
	// const setDraftMessage = useStore((store) => store.setDraftMessage);
	// const addDescriptionToFileToAttach = useStore((store) => store.addDescriptionToFileToAttach);
	const setFilesToAttach = useStore((store) => store.setFilesToAttach);
	const setInputHasFocus = useStore((store) => store.setInputHasFocus);

	const isDesktopView = useMediaQueryCheck();
	const [dropzoneEnabled, setDropzoneEnabled] = useState(false);

	useEffect(() => {
		if (isDesktopView) {
			setInfoPanelOpen(false);
		}
	}, [isDesktopView, setInfoPanelOpen]);

	const handleOnDrop = useCallback(
		(ev) => {
			ev.preventDefault();
			const { files } = ev.dataTransfer as HTMLInputElement;
			const listOfFiles: FileToUpload[] = [];
			forEach(files, (file: File, index) => {
				const fileLocalUrl = URL.createObjectURL(file);
				const fileId = uuidGenerator();
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
			setDropzoneEnabled(false);
			setInputHasFocus(roomId, true);
		},
		[roomId, setFilesToAttach, setInputHasFocus, filesToUploadArray]
	);

	const handleOnDragOver = useCallback((ev) => {
		ev.preventDefault();
		setDropzoneEnabled(true);
	}, []);

	const handleOnDragLeave = useCallback((ev) => {
		ev.preventDefault();
		setDropzoneEnabled(false);
	}, []);

	return (
		<CustomContainer
			data-testid="conversationCollapsedView"
			width={isDesktopView ? '70%' : '100%'}
			minWidth="70%"
			mainAlignment="flex-start"
			onDragOver={handleOnDragOver}
		>
			{dropzoneEnabled && (
				<DropZoneView
					onDragOverEvent={handleOnDragOver}
					onDropEvent={handleOnDrop}
					onDragLeaveEvent={handleOnDragLeave}
				/>
			)}
			<ConversationHeader roomId={roomId} setInfoPanelOpen={setInfoPanelOpen} />
			<MessagesList roomId={roomId} />
			<ConversationFooter roomId={roomId} />
		</CustomContainer>
	);
};

export default Chat;
