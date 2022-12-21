/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IconButton, Container, Tooltip } from '@zextras/carbonio-design-system';
import React, {
	BaseSyntheticEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import { useTranslation } from 'react-i18next';

import {
	getDraftMessage,
	getInputHasFocus,
	getReferenceMessageView
} from '../../store/selectors/ActiveConversationsSelectors';
import { getXmppClient } from '../../store/selectors/ConnectionSelector';
import { getRoomUnreadsSelector } from '../../store/selectors/UnreadsCounterSelectors';
import useStore from '../../store/Store';
import { Emoji } from '../../types/generics';
import EmojiPicker from './EmojiPicker';
import MessageArea from './MessageArea';

type ConversationMessageComposerProps = {
	roomId: string;
};

const MessageComposer: React.FC<ConversationMessageComposerProps> = ({ roomId }) => {
	const xmppClient = useStore(getXmppClient);

	const [t] = useTranslation();
	const writeToSendTooltip = t('tooltip.writeToSend', 'Write a message to send it');
	const selectEmojiLabel = t('tooltip.selectEmoji', 'Select emoji');
	const sendMessageLabel = t('tooltip.sendMessage', 'Send message');

	const referenceMessage = useStore((store) => getReferenceMessageView(store, roomId));
	const draftMessage = useStore((store) => getDraftMessage(store, roomId));
	const unsetReferenceMessage = useStore((store) => store.unsetReferenceMessage);
	const inputHasFocus = useStore((store) => getInputHasFocus(store, roomId));
	const setInputHasFocus = useStore((store) => store.setInputHasFocus);
	const setDraftMessage = useStore((store) => store.setDraftMessage);
	const unreadMessagesCount = useStore((store) => getRoomUnreadsSelector(store, roomId));

	const [textMessage, setTextMessage] = useState('');
	const [isWriting, setIsWriting] = useState(false);
	const [noMoreCharsOnInputComposer, setNoMoreCharsOnInputComposer] = useState(false);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);

	const messageInputRef = useRef<HTMLTextAreaElement>();
	const emojiButtonRef = useRef<HTMLButtonElement>();
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

	const sendDisabled = useMemo(
		() => textMessage === '' && !referenceMessage,
		[referenceMessage, textMessage]
	);

	const checkMaxLengthAndSetMessage = useCallback(
		(textareaValue: string): void => {
			if (textareaValue.length > 4096) {
				setTextMessage(textareaValue.slice(0, 4096));
				// todo fix selection place when user is modifing in the middle of the components
				// const cursorPosition = messageInputRef.current.selectionStart;
				// messageInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
				setNoMoreCharsOnInputComposer(true);
			} else {
				setNoMoreCharsOnInputComposer(false);
				setTextMessage(textareaValue);
				if (messageInputRef.current) {
					messageInputRef.current.style.height = '';
					if (messageInputRef.current.scrollHeight >= messageInputRef.current.clientHeight) {
						messageInputRef.current.style.height = `${messageInputRef.current.scrollHeight + 1}px`;
						messageInputRef.current.style.paddingBottom = '0.75rem';
					} else {
						messageInputRef.current.style.paddingBottom = '0';
						messageInputRef.current.style.paddingTop = '0.75rem';
					}
				}
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[textMessage, messageInputRef]
	);

	const sendMessage = useCallback((): void => {
		if (referenceMessage && referenceMessage.roomId === roomId) {
			xmppClient.sendChatMessage(roomId, textMessage, referenceMessage.messageId);
			unsetReferenceMessage(roomId);
		} else {
			xmppClient.sendChatMessage(roomId, textMessage);
		}
		setDraftMessage(roomId, true);
		setTextMessage('');
		if (messageInputRef.current) messageInputRef.current.style.height = '';
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		setIsWriting(false);
		xmppClient.sendPaused(roomId);
		const listOfMessages = document.getElementById(`messageListRef${roomId}`);
		listOfMessages?.scrollTo({ top: listOfMessages.scrollHeight, behavior: 'auto' });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [xmppClient, roomId, textMessage, timeoutRef, referenceMessage]);

	const handleTypingMessage = useCallback(
		(e: BaseSyntheticEvent): void => {
			checkMaxLengthAndSetMessage(e.target.value);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[roomId, textMessage, timeoutRef]
	);

	const handleKeyUp = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				if (showEmojiPicker) setShowEmojiPicker(false);
				sendMessage();
			}
			if (!isWriting) {
				if (timeoutRef.current) clearTimeout(timeoutRef.current);
				timeoutRef.current = setTimeout(() => {
					setIsWriting(false);
					xmppClient.sendPaused(roomId);
				}, 3000);
				xmppClient.sendIsWriting(roomId);
			}
		},
		[isWriting, roomId, xmppClient, sendMessage, showEmojiPicker, timeoutRef]
	);

	const toggleEmojiSelectorView = (): void => setShowEmojiPicker((prevState) => !prevState);

	const insertEmojiInMessage = useCallback(
		(emoji: Emoji): void => {
			console.log(messageInputRef);
			if (messageInputRef.current) {
				const position = messageInputRef.current.selectionStart;
				const prevPosition = messageInputRef.current.value.slice(0, position);
				const nextPosition = messageInputRef.current.value.slice(position);
				const text = `${prevPosition}${emoji.native}${nextPosition}`;
				// todo add backup input

				checkMaxLengthAndSetMessage(text);

				const cursorMiddlePosition = emoji.native.length + position;
				messageInputRef.current.focus();
				const range = document.createRange();
				range.selectNodeContents(messageInputRef.current);
				range.collapse(false);
				const sel = window.getSelection();

				if (nextPosition === '' && sel) {
					sel.removeAllRanges();
					sel.addRange(range);
				} else {
					messageInputRef.current.setSelectionRange(cursorMiddlePosition, cursorMiddlePosition);
				}
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[messageInputRef]
	);

	const handleOnFocus = useCallback(() => {
		setInputHasFocus(roomId, true);
	}, [roomId, setInputHasFocus]);

	const handleOnBlur = useCallback(() => {
		if (textMessage.length > 0) {
			setDraftMessage(roomId, false, textMessage);
		} else {
			setDraftMessage(roomId, true);
		}
		setInputHasFocus(roomId, false);
	}, [textMessage, setInputHasFocus, roomId, setDraftMessage]);

	const sendStopWriting = useCallback(() => xmppClient.sendPaused(roomId), [xmppClient, roomId]);

	useEffect(() => {
		setTextMessage(draftMessage || '');
	}, [draftMessage, roomId]);

	useEffect(() => {
		if (referenceMessage && messageInputRef.current) {
			messageInputRef.current.focus();
		}
	}, [referenceMessage]);

	useEffect(() => {
		checkMaxLengthAndSetMessage(messageInputRef.current?.value || '');
	}, [textMessage, checkMaxLengthAndSetMessage]);

	useEffect(() => {
		if (unreadMessagesCount <= 0) messageInputRef.current?.focus();
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		window.parent.addEventListener('beforeunload', sendStopWriting);
		const messageRef = messageInputRef.current;
		return () => {
			xmppClient.sendPaused(roomId);
			window.parent.removeEventListener('beforeunload', sendStopWriting);
			setTextMessage('');
			if (messageRef) {
				messageRef.value = '';
				messageRef.style.height = '0';
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [roomId]);

	useEffect(() => {
		if (inputHasFocus) {
			messageInputRef.current?.focus();
		}
	}, [inputHasFocus]);

	return (
		<Container height="fit">
			{showEmojiPicker && <EmojiPicker onEmojiSelect={insertEmojiInMessage} />}
			<Container orientation="horizontal" crossAlignment="flex-end">
				<Tooltip label={selectEmojiLabel}>
					<Container width="fit" height="fit" padding={{ left: 'extrasmall', bottom: '0.3125rem' }}>
						<IconButton
							ref={emojiButtonRef}
							onClick={toggleEmojiSelectorView}
							iconColor="secondary"
							size="large"
							icon={'SmileOutline'}
							alt={selectEmojiLabel}
						/>
					</Container>
				</Tooltip>
				<MessageArea
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					textareaRef={messageInputRef}
					message={textMessage}
					onInput={handleTypingMessage}
					composerIsFull={noMoreCharsOnInputComposer}
					handleKeyUpTextarea={handleKeyUp}
					handleOnBlur={handleOnBlur}
					handleOnFocus={handleOnFocus}
				/>
				<Tooltip label={sendDisabled ? writeToSendTooltip : sendMessageLabel} placement="top">
					<Container
						width="fit"
						height="fit"
						padding={{ right: 'extrasmall', bottom: '0.3125rem' }}
					>
						<IconButton
							onClick={sendMessage}
							iconColor="primary"
							size="large"
							icon="Navigation2"
							alt={sendDisabled ? writeToSendTooltip : sendMessageLabel}
							disabled={sendDisabled}
						/>
					</Container>
				</Tooltip>
			</Container>
		</Container>
	);
};

export default MessageComposer;
