/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { RefObject, useCallback, useEffect, useRef } from 'react';

import { chatClient } from '../../../network/chatClient/ChatClient';
import { getMessagesSelector } from '../../../store/selectors/ChatsRegistrySelectors';
import { getIsWscPure } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { pickReadTarget, shouldRequestRead } from '../../../utils/readTargetUtils';

const BOTTOM_TOLERANCE_PX = 100;

const isUserLookingAtThePage = (): boolean =>
	document.visibilityState === 'visible' && document.hasFocus();

const isScrolledToBottom = (element: HTMLElement | null): boolean =>
	!element ||
	element.scrollHeight - element.scrollTop - element.clientHeight <= BOTTOM_TOLERANCE_PX;

const useReadMarker = (roomId: string, scrollerRef: RefObject<HTMLElement>): (() => void) => {
	const messages = useStore((store) => getMessagesSelector(store, roomId));
	const requestedDates = useRef<Partial<Record<string, number>>>({});

	const markRead = useCallback(() => {
		const state = useStore.getState();
		if (!getIsWscPure(state) || !isUserLookingAtThePage()) return;
		const bottomVisibleId = isScrolledToBottom(scrollerRef.current)
			? undefined
			: state.activeConversations[roomId]?.scrollPositionMessageId;
		const target = pickReadTarget(state.chatsRegistry[roomId]?.messages ?? [], bottomVisibleId);
		const markerDate = state.session.id
			? state.chatsRegistry[roomId]?.markers?.[state.session.id]?.markerDate
			: undefined;
		if (!target || !shouldRequestRead(target.date, markerDate, requestedDates.current[roomId])) {
			return;
		}
		const previouslyRequested = requestedDates.current[roomId];
		requestedDates.current[roomId] = target.date;
		Promise.resolve<boolean | void>(chatClient.readMessage(roomId, target.id)).then((done) => {
			if (done === false && requestedDates.current[roomId] === target.date) {
				if (previouslyRequested === undefined) delete requestedDates.current[roomId];
				else requestedDates.current[roomId] = previouslyRequested;
			}
		});
	}, [roomId, scrollerRef]);

	useEffect(() => {
		markRead();
	}, [messages, markRead]);

	useEffect(() => {
		document.addEventListener('visibilitychange', markRead);
		window.addEventListener('focus', markRead);
		return (): void => {
			document.removeEventListener('visibilitychange', markRead);
			window.removeEventListener('focus', markRead);
		};
	}, [markRead]);

	return markRead;
};

export default useReadMarker;
