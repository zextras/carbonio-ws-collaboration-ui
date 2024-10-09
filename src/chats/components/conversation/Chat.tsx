/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, {
	Dispatch,
	ReactElement,
	SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useState
} from 'react';

import { Container } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

import ConversationHeader from './ConversationHeader';
import DropZoneView from './DropZoneView';
import ConversationFooter from './footer/ConversationFooter';
import MessagesList from './MessagesList';
import { MEETINGS_PATH } from '../../../constants/appConstants';
import useLoadFiles from '../../../hooks/useLoadFiles';
import useMediaQueryCheck from '../../../hooks/useMediaQueryCheck';
import { getReferenceMessage } from '../../../store/selectors/ActiveConversationsSelectors';
import useStore from '../../../store/Store';
import { messageActionType } from '../../../types/store/ActiveConversationTypes';

const CustomContainer = styled(Container)`
	position: relative;
`;

type ChatsProps = {
	roomId: string;
	setInfoPanelOpen?: Dispatch<SetStateAction<boolean>>;
};

const Chat = ({ roomId, setInfoPanelOpen }: ChatsProps): ReactElement => {
	const referenceMessage = useStore((store) => getReferenceMessage(store, roomId));

	const [dropzoneEnabled, setDropzoneEnabled] = useState(false);

	const isDesktopView = useMediaQueryCheck();

	const isInsideMeeting = useMemo(() => window.location.pathname.includes(MEETINGS_PATH), []);

	useEffect(() => {
		if (isDesktopView && setInfoPanelOpen) {
			setInfoPanelOpen(false);
		}
	}, [isDesktopView, setInfoPanelOpen]);

	const loadFiles = useLoadFiles(roomId);

	const handleOnDrop = useCallback(
		(ev) => {
			ev.preventDefault();
			const { files } = ev.dataTransfer as HTMLInputElement;
			loadFiles(files ?? new FileList());
			setDropzoneEnabled(false);
		},
		[loadFiles]
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

	const handleOnDragStart = useCallback((ev) => {
		ev.preventDefault();
	}, []);

	return (
		<CustomContainer
			data-testid="conversationCollapsedView"
			width={isDesktopView && !isInsideMeeting ? '70%' : '100%'}
			minWidth="70%"
			mainAlignment="flex-start"
			onDragStart={handleOnDragStart}
			onDragOver={handleOnDragOver}
		>
			{dropzoneEnabled && (
				<DropZoneView
					onDragOverEvent={handleOnDragOver}
					onDropEvent={handleOnDrop}
					onDragLeaveEvent={handleOnDragLeave}
				/>
			)}
			{!isInsideMeeting && setInfoPanelOpen && (
				<ConversationHeader roomId={roomId} setInfoPanelOpen={setInfoPanelOpen} />
			)}
			<MessagesList roomId={roomId} />
			<ConversationFooter roomId={roomId} isInsideMeeting={isInsideMeeting} />
		</CustomContainer>
	);
};

export default Chat;
