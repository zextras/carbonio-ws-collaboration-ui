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

import styled from '@emotion/styled';
import { Container, CreateSnackbarFn, useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { ConversationView } from './Conversation';
import ConversationHeader from './ConversationHeader';
import DropZoneView from './DropZoneView';
import ConversationFooter from './footer/ConversationFooter';
import MessagesList from './MessagesList';
import { MEETINGS_PATH } from '../../../constants/appConstants';
import useEventListener, {
	EventName,
	MemberDemotedEvent,
	MemberPromotedEvent
} from '../../../hooks/useEventListener';
import useLoadFiles from '../../../hooks/useLoadFiles';
import useMediaQueryCheck from '../../../hooks/useMediaQueryCheck';
import { getReferenceMessage } from '../../../store/selectors/ActiveConversationsSelectors';
import { getXmppClient } from '../../../store/selectors/ConnectionSelector';
import useStore from '../../../store/Store';
import { messageActionType } from '../../../types/store/ActiveConversationTypes';

const CustomContainer = styled(Container)`
	position: relative;
`;

type ChatsProps = {
	roomId: string;
	conversationView?: ConversationView;
	setConversationView?: Dispatch<SetStateAction<ConversationView>>;
};

const Chat = ({ roomId, conversationView, setConversationView }: ChatsProps): ReactElement => {
	const [t] = useTranslation();
	const xmppClient = useStore(getXmppClient);
	const referenceMessage = useStore((store) => getReferenceMessage(store, roomId));

	const [dropzoneEnabled, setDropzoneEnabled] = useState(false);

	const isDesktopView = useMediaQueryCheck();

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const isInsideMeeting = useMemo(() => window.location.pathname.includes(MEETINGS_PATH), []);

	const loadFiles = useLoadFiles(roomId);

	const handleOnDrop = useCallback(
		(ev: React.DragEvent<HTMLElement>) => {
			ev.preventDefault();
			const { files } = ev.dataTransfer;
			loadFiles(files ?? new FileList());
			setDropzoneEnabled(false);
		},
		[loadFiles]
	);

	const handleOnDragOver = useCallback(
		(ev: React.DragEvent<HTMLElement>) => {
			// Avoid to drop files if user is editing a message
			const editingMessage = referenceMessage?.actionType === messageActionType.EDIT;
			if (!editingMessage) {
				ev.preventDefault();
				setDropzoneEnabled(true);
			}
		},
		[referenceMessage]
	);

	const handleOnDragLeave = useCallback((ev: React.DragEvent<HTMLElement> | DragEvent) => {
		ev.preventDefault();
		setDropzoneEnabled(false);
	}, []);

	const handleOnDragStart = useCallback((ev: React.DragEvent<HTMLElement>) => {
		ev.preventDefault();
	}, []);

	const promoteMemberHandler = useCallback(
		(event: CustomEvent<MemberPromotedEvent['data']> | undefined) => {
			const roomName = event?.detail.roomId
				? useStore.getState().rooms[event.detail.roomId]?.name
				: '';
			createSnackbar({
				key: new Date().toLocaleString(),
				severity: 'info',
				label: t(
					'feedback.member.demotion',
					`Congratulations! You are now a moderator of ${roomName} group.`,
					{ roomName }
				),
				hideButton: true,
				autoHideTimeout: 3000
			});
		},
		[createSnackbar, t]
	);

	const demoteMemberHandler = useCallback(
		(event: CustomEvent<MemberDemotedEvent['data']> | undefined) => {
			const roomName = event?.detail.roomId
				? useStore.getState().rooms[event.detail.roomId]?.name
				: '';
			createSnackbar({
				key: new Date().toLocaleString(),
				severity: 'info',
				label: t(
					'feedback.member.promotion',
					`You are no longer a moderator of ${roomName} group.`,
					{ roomName }
				),
				hideButton: true,
				autoHideTimeout: 3000
			});
		},
		[createSnackbar, t]
	);

	useEventListener(EventName.MEMBER_PROMOTED, promoteMemberHandler);
	useEventListener(EventName.MEMBER_DEMOTED, demoteMemberHandler);

	useEffect(() => {
		xmppClient.getMessagePin(roomId);
	}, [roomId, xmppClient]);

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
			{!isInsideMeeting && conversationView && setConversationView && (
				<ConversationHeader
					roomId={roomId}
					conversationView={conversationView}
					setConversationView={setConversationView}
				/>
			)}
			<MessagesList roomId={roomId} />
			<ConversationFooter key={roomId} roomId={roomId} isInsideMeeting={isInsideMeeting} />
		</CustomContainer>
	);
};

export default Chat;
