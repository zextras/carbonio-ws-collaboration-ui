/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import MessageHistoryLoaderRest, {
	HistoryLoaderAfter as HistoryLoaderAfterRest,
	HistoryLoaderBefore as HistoryLoaderBeforeRest
} from './MessageHistoryLoaderRest';
import MessageHistoryLoaderXmpp from './MessageHistoryLoaderXmpp';
import { getIsMongooseIM } from '../../../store/selectors/ConnectionSelector';
import useStore from '../../../store/Store';

type HistoryLoaderProps = {
	roomId: string;
	messageListRef: React.RefObject<HTMLDivElement>;
};

/**
 * Named export: loader for OLDER messages (top of list).
 * XMPP path: not applicable — XMPP uses a single MAM-based loader via the default export.
 * REST path: delegates to HistoryLoaderBeforeRest.
 */
export const HistoryLoaderBefore = (props: HistoryLoaderProps): ReactElement | null => {
	const isMongooseIM = useStore(getIsMongooseIM);
	if (isMongooseIM) return null;
	return <HistoryLoaderBeforeRest {...props} />;
};

/**
 * Named export: loader for NEWER messages (bottom of list).
 * XMPP path: not applicable — XMPP does not support forward pagination.
 * REST path: delegates to HistoryLoaderAfterRest.
 */
export const HistoryLoaderAfter = (props: HistoryLoaderProps): ReactElement | null => {
	const isMongooseIM = useStore(getIsMongooseIM);
	if (isMongooseIM) return null;
	return <HistoryLoaderAfterRest {...props} />;
};

/**
 * Default export: initial / primary history loader.
 * XMPP path: MAM-based single loader (devel implementation).
 * REST path: REST timeline cursor loader (common-socket implementation).
 */
const MessageHistoryLoader = (props: HistoryLoaderProps): ReactElement => {
	const isMongooseIM = useStore(getIsMongooseIM);
	return isMongooseIM ? (
		<MessageHistoryLoaderXmpp {...props} />
	) : (
		<MessageHistoryLoaderRest {...props} />
	);
};

export default MessageHistoryLoader;
