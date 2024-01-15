/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, RefObject, useCallback, useEffect, useRef } from 'react';

import { Icon } from '@zextras/carbonio-design-system';
import { debounce, first } from 'lodash';
import styled from 'styled-components';

import { getHistoryIsLoadedDisabled } from '../../../store/selectors/ActiveConversationsSelectors';
import { getXmppClient } from '../../../store/selectors/ConnectionSelector';
import useStore from '../../../store/Store';
import { now } from '../../../utils/dateUtils';

type MessageHistoryLoaderProps = {
	roomId: string;
	messageListRef: React.RefObject<HTMLDivElement>;
};

const Loader = styled.div`
	background-color: ${({ theme }): string => theme.palette.gray6.active};
	color: #999;
	text-align: center;
	border-radius: 50%;
	margin: 0.875rem auto;
	width: 1.75rem;
	height: 1.75rem;

	@-moz-keyframes spin { 0% {transform: scaleX(-1) rotate(0deg);} 100% {transform: scaleX(-1) rotate(360deg);} }
	@-webkit-keyframes spin { 0% {transform: scaleX(-1) rotate(0deg);} 100% {transform: scaleX(-1) rotate(360deg);} }
	@keyframes spin { 0% {transform: scaleX(-1) rotate(0deg);} 100% {transform: scaleX(-1) rotate(360deg);} }
	}
	& svg {
		position: relative;
		top: 0.375rem;
		left: 0.375rem;
		-webkit-animation: spin 1s linear infinite;
		-moz-animation: spin 1s linear infinite;
		animation: spin 1s linear infinite;
	}
`;

const VisibilityContainer = styled.div<{
	children: ReactElement;
	'data-testid': string;
	ref: RefObject<HTMLDivElement>;
}>`
	width: 100%;
	text-align: center;
`;

const MessageHistoryLoader = ({
	roomId,
	messageListRef
}: MessageHistoryLoaderProps): ReactElement => {
	const intersectionObserverRef = useRef<IntersectionObserver>();
	const messageHistoryLoaderRef = React.createRef<HTMLDivElement>();

	const xmppClient = useStore(getXmppClient);
	const historyLoadedDisabled = useStore((store) => getHistoryIsLoadedDisabled(store, roomId));
	const setHistoryLoadDisabled = useStore((store) => store.setHistoryLoadDisabled);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const handleHistoryLoader = useCallback(
		debounce(() => {
			const roomMessages = useStore.getState().messages[roomId];
			const date = first(roomMessages)?.date ?? now();
			if (!historyLoadedDisabled) {
				xmppClient.requestHistory(roomId, date, 50, useStore.getState().unreads[roomId]);
				setHistoryLoadDisabled(roomId, true);
			}
		}, 500),
		[roomId, historyLoadedDisabled]
	);

	useEffect(() => {
		if (messageListRef?.current && messageHistoryLoaderRef?.current) {
			intersectionObserverRef.current = new IntersectionObserver(
				([entry]) => {
					if (entry.intersectionRatio === 1) {
						handleHistoryLoader.cancel();
						handleHistoryLoader();
					}
				},
				{
					root: messageListRef.current,
					rootMargin: '0px',
					threshold: 1
				}
			);
			intersectionObserverRef.current.observe(messageHistoryLoaderRef.current);
		}
		return () => intersectionObserverRef.current?.disconnect();
	}, [handleHistoryLoader, messageHistoryLoaderRef, messageListRef]);

	return (
		<VisibilityContainer data-testid={'messageHistoryLoader'} ref={messageHistoryLoaderRef}>
			<Loader>
				<Icon icon="RefreshOutline" size="medium" />
			</Loader>
		</VisibilityContainer>
	);
};

export default MessageHistoryLoader;
