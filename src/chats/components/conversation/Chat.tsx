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

import ConversationHeader from './ConversationHeader';
import DropZoneView from './DropZoneView';
import ConversationFooter from './footer/ConversationFooter';
import MessagesList from './MessagesList';
import useMediaQueryCheck from '../../../hooks/useMediaQueryCheck';
import {
	getFilesToUploadArray,
	getReferenceMessage
} from '../../../store/selectors/ActiveConversationsSelectors';
import useStore from '../../../store/Store';
import { FileToUpload, messageActionType } from '../../../types/store/ActiveConversationTypes';
import { uid } from '../../../utils/attachmentUtils';

const CustomContainer = styled(Container)`
	position: relative;
`;

type ChatsProps = {
	roomId: string;
	setInfoPanelOpen: Dispatch<SetStateAction<boolean>>;
};

const Chat = ({ roomId, setInfoPanelOpen }: ChatsProps): ReactElement => {
	const filesToUploadArray = useStore((store) => getFilesToUploadArray(store, roomId));
	const setFilesToAttach = useStore((store) => store.setFilesToAttach);
	const setInputHasFocus = useStore((store) => store.setInputHasFocus);
	const referenceMessage = useStore((store) => getReferenceMessage(store, roomId));

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
			setDropzoneEnabled(false);
			setInputHasFocus(roomId, true);
		},
		[roomId, setFilesToAttach, setInputHasFocus, filesToUploadArray]
	);

	const handleOnDragOver = useCallback(
		(ev) => {
			// Avoid to drop files if user is editing a message
			const editingMessage = referenceMessage?.actionType === messageActionType.EDIT;
			if (!editingMessage) {
				ev.preventDefault();
				setDropzoneEnabled(true);
			}
		},
		[referenceMessage]
	);

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
