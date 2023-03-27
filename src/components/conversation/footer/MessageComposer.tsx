/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	IconButton,
	Container,
	Tooltip,
	Padding,
	SnackbarManagerContext
} from '@zextras/carbonio-design-system';
import { find, forEach } from 'lodash';
import React, {
	BaseSyntheticEvent,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import { useTranslation } from 'react-i18next';

import { RoomsApi } from '../../../network';
import {
	getDraftMessage,
	getFilesToUploadArray,
	getInputHasFocus,
	getReferenceMessageView
} from '../../../store/selectors/ActiveConversationsSelectors';
import { getXmppClient } from '../../../store/selectors/ConnectionSelector';
import { getMessageSelector } from '../../../store/selectors/MessagesSelectors';
import { getRoomUnreadsSelector } from '../../../store/selectors/UnreadsCounterSelectors';
import useStore from '../../../store/Store';
import { Emoji } from '../../../types/generics';
import { FileToUpload, messageActionType } from '../../../types/store/ActiveConversationTypes';
import { Message, MessageType } from '../../../types/store/MessageTypes';
import AttachmentSelector from './AttachmentSelector';
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
	const addDescriptionToFileToAttach = useStore((store) => store.addDescriptionToFileToAttach);
	const unsetFilesToAttach = useStore((store) => store.unsetFilesToAttach);
	const unreadMessagesCount = useStore((store) => getRoomUnreadsSelector(store, roomId));
	const filesToUploadArray = useStore((store) => getFilesToUploadArray(store, roomId));
	const setFileFocusedToModify = useStore((store) => store.setFileFocusedToModify);
	const messageReference = useStore<Message | undefined>((store) =>
		getMessageSelector(store, roomId, referenceMessage?.messageId)
	);

	const [textMessage, setTextMessage] = useState('');
	const [isWriting, setIsWriting] = useState(false);
	const [noMoreCharsOnInputComposer, setNoMoreCharsOnInputComposer] = useState(false);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);

	const createSnackbar: any = useContext(SnackbarManagerContext);

	const messageInputRef = useRef<HTMLTextAreaElement>();
	const emojiButtonRef = useRef<HTMLButtonElement>();
	const emojiTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

	// Disable if textMessage is composed only by spaces, tabs or line breaks
	const sendDisabled = useMemo(
		() => !/\S/.test(textMessage) && !filesToUploadArray,
		[textMessage, filesToUploadArray]
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
		if (showEmojiPicker) setShowEmojiPicker(false);
		const message = textMessage.trim();
		const fileWithDescriptionChange: FileToUpload | undefined = find(
			filesToUploadArray,
			(file) => file.hasFocus
		);

		if (fileWithDescriptionChange) {
			// user is attaching files and send the description,
			// so we save the description for that attachment and clean the input
			addDescriptionToFileToAttach(roomId, fileWithDescriptionChange.fileId, message);
			setDraftMessage(roomId, true);
			setTextMessage('');
		} else if (!fileWithDescriptionChange && filesToUploadArray && filesToUploadArray.length > 0) {
			// user clicked the send button or pressed enter and there is no text in the input,
			// there are some attachment
			const listOfRequest: any[] = [];
			forEach(filesToUploadArray, (file) => {
				const fileName = file.file.name;
				const errorString = t(
					'attachments.errorUploadingFile',
					`Something went wrong uploading ${fileName}`,
					{ file: fileName }
				);
				listOfRequest.push(
					RoomsApi.addRoomAttachment(
						roomId,
						file.file,
						file.description ? file.description : undefined
					).catch(() => {
						createSnackbar({
							key: new Date().toLocaleString(),
							type: 'error',
							label: errorString
						});
					})
				);
			});
			Promise.all(listOfRequest).then(() => unsetFilesToAttach(roomId));
		} else {
			if (referenceMessage && referenceMessage.roomId === roomId) {
				switch (referenceMessage.actionType) {
					case messageActionType.REPLY: {
						xmppClient.sendChatMessageReply(
							roomId,
							message,
							referenceMessage.senderId,
							referenceMessage.stanzaId
						);
						break;
					}
					case messageActionType.EDIT: {
						if (
							messageReference?.type === MessageType.TEXT_MSG &&
							messageReference?.text !== message
						) {
							xmppClient.sendChatMessageCorrection(roomId, message, referenceMessage.messageId);
						}
						break;
					}
					default: {
						console.warn('case not handled', referenceMessage);
					}
				}
				unsetReferenceMessage(roomId);
			} else {
				xmppClient.sendChatMessage(roomId, message);
			}
			setDraftMessage(roomId, true);
			setTextMessage('');
			if (messageInputRef.current) messageInputRef.current.style.height = '';
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			setIsWriting(false);
			xmppClient.sendPaused(roomId);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		xmppClient,
		roomId,
		textMessage,
		timeoutRef,
		referenceMessage,
		messageReference,
		filesToUploadArray,
		addDescriptionToFileToAttach
	]);

	const handleTypingMessage = useCallback(
		(e: BaseSyntheticEvent): void => {
			checkMaxLengthAndSetMessage(e.target.value);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[roomId, textMessage, timeoutRef]
	);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (!sendDisabled) {
				if (e.key === 'Enter' && !e.shiftKey) {
					e.preventDefault();
					sendMessage();
				} else if (!isWriting) {
					if (timeoutRef.current) clearTimeout(timeoutRef.current);
					timeoutRef.current = setTimeout(() => {
						setIsWriting(false);
						xmppClient.sendPaused(roomId);
					}, 3000);
					xmppClient.sendIsWriting(roomId);
				}
			}
		},
		[sendDisabled, isWriting, sendMessage, xmppClient, roomId]
	);

	const insertEmojiInMessage = useCallback(
		(emoji: Emoji): void => {
			if (messageInputRef.current) {
				const position = messageInputRef.current.selectionStart;
				const prevPosition = messageInputRef.current.value.slice(0, position);
				const nextPosition = messageInputRef.current.value.slice(position);
				const text = `${prevPosition}${emoji.native}${nextPosition}`;
				checkMaxLengthAndSetMessage(text);
				const cursorMiddlePosition = emoji.native.length + position;
				messageInputRef.current.focus();
				messageInputRef.current?.setSelectionRange(cursorMiddlePosition, cursorMiddlePosition);
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[messageInputRef]
	);

	const handleOnFocus = useCallback(() => {
		setInputHasFocus(roomId, true);
	}, [roomId, setInputHasFocus]);

	const handleOnBlur = useCallback(() => {
		// if user is adding a description to a file and blur the input
		// we save the description of the file and set the file as not focused
		const fileWithDescriptionChanging: FileToUpload | undefined = find(
			filesToUploadArray,
			(file) => file.hasFocus
		);
		if (fileWithDescriptionChanging) {
			const message = textMessage.trim();
			if (message.length > 0) {
				addDescriptionToFileToAttach(roomId, fileWithDescriptionChanging.fileId, message);
			}
			setFileFocusedToModify(roomId, fileWithDescriptionChanging.fileId, false);
			setDraftMessage(roomId, true);
			setTextMessage('');
			if (messageInputRef.current) messageInputRef.current.style.height = '';
		} else if (textMessage.length > 0) {
			setDraftMessage(roomId, false, textMessage);
		} else {
			setDraftMessage(roomId, true);
		}
		setInputHasFocus(roomId, false);
	}, [
		filesToUploadArray,
		textMessage,
		setInputHasFocus,
		roomId,
		addDescriptionToFileToAttach,
		setFileFocusedToModify,
		setDraftMessage
	]);

	const sendStopWriting = useCallback(() => xmppClient.sendPaused(roomId), [xmppClient, roomId]);

	useEffect(() => {
		setTextMessage(draftMessage || '');
	}, [draftMessage, roomId]);

	useEffect(() => {
		if (referenceMessage && messageInputRef.current) {
			messageInputRef.current.focus();
			// clean the composer section and remove all file uploading if user
			// is uploading files and then decide to edit a message
			if (filesToUploadArray && referenceMessage.actionType === messageActionType.EDIT) {
				unsetFilesToAttach(roomId);
			}
		}
	}, [referenceMessage, filesToUploadArray, unsetFilesToAttach, roomId]);

	useEffect(() => {
		checkMaxLengthAndSetMessage(messageInputRef.current?.value || '');
	}, [textMessage, checkMaxLengthAndSetMessage]);

	useEffect(() => {
		if (unreadMessagesCount <= 0) messageInputRef.current?.focus();
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		window.parent.addEventListener('beforeunload', sendStopWriting);
		const messageRef = messageInputRef.current;
		return () => {
			if (xmppClient) {
				xmppClient.sendPaused(roomId);
			}
			window.parent.removeEventListener('beforeunload', sendStopWriting);
			setTextMessage('');
			if (messageRef) {
				messageRef.value = '';
				messageRef.style.height = '0';
			}
		};
	}, [roomId, sendStopWriting, unreadMessagesCount, xmppClient]);

	useEffect(() => {
		if (inputHasFocus) {
			messageInputRef.current?.focus();
		}
	}, [inputHasFocus]);

	useEffect(() => {
		// set the message in the input as description of the first file
		// when user add some or one file to attach and set the first file active for edit the description
		if (filesToUploadArray && filesToUploadArray.length >= 1 && textMessage.length > 0) {
			setFileFocusedToModify(roomId, filesToUploadArray[0].fileId, true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filesToUploadArray, setFileFocusedToModify, roomId]);

	const mouseEnterEvent = useCallback(() => {
		if (emojiButtonRef.current) {
			clearTimeout(emojiTimeoutRef.current);
			setShowEmojiPicker(true);
		}
	}, []);

	const mouseLeaveEvent = useCallback(() => {
		if (emojiButtonRef.current) {
			emojiTimeoutRef.current = setTimeout(() => {
				setShowEmojiPicker(false);
			}, 300);
		}
	}, []);

	useEffect(() => {
		let refValue: HTMLButtonElement | undefined;
		if (emojiButtonRef.current) {
			emojiButtonRef.current.addEventListener('mouseenter', mouseEnterEvent);
			emojiButtonRef.current.addEventListener('mouseleave', mouseLeaveEvent);
			refValue = emojiButtonRef.current;
		}
		return () => {
			if (refValue) {
				refValue.removeEventListener('mouseenter', mouseEnterEvent);
				refValue.removeEventListener('mouseleave', mouseLeaveEvent);
			}
		};
	}, [mouseEnterEvent, mouseLeaveEvent]);

	return (
		<Container height="fit">
			{showEmojiPicker && (
				<EmojiPicker
					onEmojiSelect={insertEmojiInMessage}
					setShowEmojiPicker={setShowEmojiPicker}
					emojiTimeoutRef={emojiTimeoutRef}
				/>
			)}
			<Container orientation="horizontal" crossAlignment="flex-end">
				<Tooltip label={selectEmojiLabel}>
					<Container width="fit" height="fit" padding={{ left: 'extrasmall', bottom: '0.3125rem' }}>
						<IconButton
							ref={emojiButtonRef}
							iconColor="secondary"
							size="large"
							icon={'SmileOutline'}
							alt={selectEmojiLabel}
							onClick={(): null => null}
						/>
					</Container>
				</Tooltip>
				<Padding right={'0.25rem'} />
				<MessageArea
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					textareaRef={messageInputRef}
					message={textMessage}
					onInput={handleTypingMessage}
					composerIsFull={noMoreCharsOnInputComposer}
					handleKeyDownTextarea={handleKeyDown}
					handleOnBlur={handleOnBlur}
					handleOnFocus={handleOnFocus}
				/>
				{textMessage === '' && !messageReference && <AttachmentSelector roomId={roomId} />}
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
