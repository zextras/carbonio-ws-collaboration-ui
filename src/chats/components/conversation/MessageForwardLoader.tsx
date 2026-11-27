/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useEffect, useRef, useState } from 'react';

import { Icon } from '@zextras/carbonio-design-system';

import { Loader, VisibilityContainer } from './MessageHistoryLoader';
import { chatClient } from '../../../network/chatClient/ChatClient';
import { isQueueCancelledError } from '../../../network/chatClient/windowGuard';
import { getRoomMessagesSizeSelector } from '../../../store/selectors/ChatsRegistrySelectors';
import useStore from '../../../store/Store';

type MessageForwardLoaderProps = {
	roomId: string;
	messageListRef: React.RefObject<HTMLDivElement>;
};

/**
 * Bottom of a window cut before the newest message: while it is in view, loads the next page
 * after the newest row, until the window reaches the newest message (and the parent unmounts it).
 * A failed page stops the automatic loading: the scroll-to-bottom button reloads the latest page.
 */
const MessageForwardLoader = ({
	roomId,
	messageListRef
}: MessageForwardLoaderProps): ReactElement => {
	const loaderRef = useRef<HTMLDivElement>(null);
	const isLoadingRef = useRef(false);
	const [hasFailed, setHasFailed] = useState(false);
	const [requestsDone, setRequestsDone] = useState(0);

	useEffect(() => {
		if (hasFailed || !messageListRef.current || !loaderRef.current) {
			return undefined;
		}
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting || isLoadingRef.current) {
					return;
				}
				isLoadingRef.current = true;
				const sizeBefore = getRoomMessagesSizeSelector(useStore.getState(), roomId);
				chatClient
					.requestMessagesAfter(roomId)
					.then(() => {
						// A page that adds nothing would be asked again forever
						if (getRoomMessagesSizeSelector(useStore.getState(), roomId) === sizeBefore) {
							setHasFailed(true);
						}
					})
					.catch((err) => {
						// Cancelled with its queue after a timeout: the next intersection asks again
						if (isQueueCancelledError(err)) {
							return;
						}
						console.error('MessageForwardLoader: next page failed', err);
						setHasFailed(true);
					})
					.finally(() => {
						isLoadingRef.current = false;
						setRequestsDone((done) => done + 1);
					});
			},
			{ root: messageListRef.current, rootMargin: '0px', threshold: 0 }
		);
		observer.observe(loaderRef.current);
		return (): void => observer.disconnect();
	}, [hasFailed, messageListRef, requestsDone, roomId]);

	return (
		<VisibilityContainer data-testid="messageForwardLoader" ref={loaderRef}>
			<Loader>
				<Icon icon="RefreshOutline" size="medium" />
			</Loader>
		</VisibilityContainer>
	);
};

export default MessageForwardLoader;
