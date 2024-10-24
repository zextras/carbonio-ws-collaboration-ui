/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, {
	BaseSyntheticEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';

import {
	Button,
	Container,
	CreateSnackbarFn,
	Spinner,
	Tooltip,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { debounce, find, forEach, map, size, throttle } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import AttachmentSelector from './AttachmentSelector';
import DeleteMessageModal from './DeleteMessageModal';
import EmojiSelector from './EmojiSelector';
import MessageArea from './MessageArea';
import {
	FILE_DESCRIPTION_CHAR_LIMIT,
	MESSAGE_CHAR_LIMIT
} from '../../../../constants/messageConstants';
import useLoadFiles from '../../../../hooks/useLoadFiles';
import useMessage from '../../../../hooks/useMessage';
import { AttachmentsApi, RoomsApi } from '../../../../network';
import {
	getDraftMessage,
	getFilesToUploadArray,
	getReferenceMessage
} from '../../../../store/selectors/ActiveConversationsSelectors';
import { getXmppClient } from '../../../../store/selectors/ConnectionSelector';
import { getLastMessageIdSelector } from '../../../../store/selectors/MessagesSelectors';
import { getCapability, getUserId } from '../../../../store/selectors/SessionSelectors';
import { getIsUserGuest } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { AddRoomAttachmentResponse } from '../../../../types/network/responses/roomsResponses';
import {
	FileToUpload,
	messageActionType,
	ReferenceMessage
} from '../../../../types/store/ActiveConversationTypes';
import { Message, MessageType, TextMessage } from '../../../../types/store/MessageTypes';
import { CapabilityType } from '../../../../types/store/SessionTypes';
import { isAttachmentImage } from '../../../../utils/attachmentUtils';
import { BrowserUtils } from '../../../../utils/BrowserUtils';
import { canPerformAction } from '../../../../utils/MessageActionsUtils';

type ConversationMessageComposerProps = {
	roomId: string;
};

const BlockUploadButton = styled(Button)`
	display: none;
`;

const LoadingSpinner = styled(Spinner)``;

const UploadSpinnerWrapper = styled(Container)`
	&:hover {
		${BlockUploadButton} {
			display: block;
		}
		${LoadingSpinner} {
			display: none;
		}
	}
`;

const SendButton = styled(Button)<{ alt?: string }>``;

const MessageComposer: React.FC<ConversationMessageComposerProps> = ({ roomId }) => {
	const xmppClient = useStore(getXmppClient);

	const [t] = useTranslation();
	const writeToSendTooltip = t('tooltip.writeToSend', 'Write a message to send it');
	const sendMessageLabel = t('tooltip.sendMessage', 'Send message');
	const uploadingLabel = t('tooltip.uploading', 'Uploading');
	const uploadAbortedLabel = t('attachments.uploadAborted', 'Upload has been interrupted');
	const stopUploadLabel = t('attachments.stopUpload', 'Stop upload');

	const myUserId = useStore(getUserId);
	const isUserGuest = useStore((store) => getIsUserGuest(store, myUserId ?? ''));
	const referenceMessage = useStore((store) => getReferenceMessage(store, roomId));
	const draftMessage = useStore((store) => getDraftMessage(store, roomId));
	const unsetReferenceMessage = useStore((store) => store.unsetReferenceMessage);
	const setInputHasFocus = useStore((store) => store.setInputHasFocus);
	const setDraftMessage = useStore((store) => store.setDraftMessage);
	const unsetFilesToAttach = useStore((store) => store.unsetFilesToAttach);
	const filesToUploadArray = useStore((store) => getFilesToUploadArray(store, roomId));
	const lastMessageId: string | undefined = useStore((state) =>
		getLastMessageIdSelector(state, roomId)
	);
	const editMessageTimeLimitInMinutes = useStore((store) =>
		getCapability(store, CapabilityType.EDIT_MESSAGE_TIME_LIMIT)
	) as number;
	const lastMessageOfRoom: Message | undefined = useMessage(roomId, lastMessageId ?? '');
	const setReferenceMessage = useStore((store) => store.setReferenceMessage);

	const completeReferenceMessage = useMessage(roomId, referenceMessage?.messageId ?? '');

	const [listAbortController, setListAbortController] = useState<AbortController[]>([]);
	const [textMessage, setTextMessage] = useState(draftMessage ?? '');
	const [isUploading, setIsUploading] = useState(false);
	const [noMoreCharsOnInputComposer, setNoMoreCharsOnInputComposer] = useState(false);
	const [deleteMessageModalStatus, setDeleteMessageModalStatus] = useState(false);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const messageInputRef = useRef<HTMLTextAreaElement>(null);

	const loadFiles = useLoadFiles(roomId);

	const sendDisabled = useMemo(() => {
		// Send button is always enabled if user is editing
		if (referenceMessage?.actionType === messageActionType.EDIT) {
			return false;
		}
		// Disable if textMessage is composed only by spaces, tabs or line breaks
		return !/\S/.test(textMessage) && !filesToUploadArray;
	}, [referenceMessage, textMessage, filesToUploadArray]);

	const abortUploadRequest = useCallback(() => {
		forEach(listAbortController, (controller: AbortController) => controller.abort());
		createSnackbar({
			key: new Date().toLocaleString(),
			severity: 'info',
			label: uploadAbortedLabel,
			hideButton: true,
			autoHideTimeout: 3000
		});
	}, [listAbortController, uploadAbortedLabel, createSnackbar]);

	const checkMaxLengthAndSetMessage = useCallback(
		(textareaValue: string): void => {
			const filesToUpload = useStore.getState().activeConversations[roomId]?.filesToAttach;
			const charsLimit = size(filesToUpload) > 0 ? FILE_DESCRIPTION_CHAR_LIMIT : MESSAGE_CHAR_LIMIT;
			if (textareaValue.length >= charsLimit) {
				setTextMessage(textareaValue.slice(0, charsLimit));
				setNoMoreCharsOnInputComposer(true);
			} else {
				setNoMoreCharsOnInputComposer(false);
			}
		},
		[roomId]
	);

	// Check message max length when some files are attached
	useEffect(() => {
		checkMaxLengthAndSetMessage(messageInputRef.current?.value ?? '');
	}, [filesToUploadArray?.length, checkMaxLengthAndSetMessage]);

	const errorHandler = (reason: DOMException, fileName: string): void => {
		if (reason.name !== 'AbortError') {
			const errorString = t(
				'attachments.errorUploadingFile',
				`Something went wrong uploading ${fileName}`,
				{ file: fileName }
			);
			createSnackbar({
				key: new Date().toLocaleString(),
				severity: 'error',
				label: errorString,
				actionLabel: 'UNDERSTOOD',
				disableAutoHide: true
			});
		}
	};

	const uploadAttachmentPromise = (
		file: FileToUpload,
		controller: AbortController
	): Promise<void | AddRoomAttachmentResponse> => {
		const fileName = file.file.name;
		const { signal } = controller;

		// Send as reply only the first file of the array
		const sendAsReply = filesToUploadArray && file.fileId === filesToUploadArray[0].fileId;

		// get the attachment type
		const isImage = isAttachmentImage(file.file.type);
		// we have to check if it's supported by the previewer or not
		// if it's not supported we can avoid to send the area field
		if (isImage) {
			return AttachmentsApi.getImageSize(file.localUrl)
				.then((res) =>
					RoomsApi.addRoomAttachment(
						roomId,
						file.file,
						{
							description: file.description,
							replyId: sendAsReply ? referenceMessage?.stanzaId : undefined,
							area: `${res.width}x${res.height}`
						},
						signal
					).catch((reason: DOMException) => {
						errorHandler(reason, fileName);
					})
				)
				.catch((err) => Promise.reject(new Error(`Upload error for ${fileName}, reason: ${err}`)));
		}
		return RoomsApi.addRoomAttachment(
			roomId,
			file.file,
			{
				description: file.description,
				replyId: sendAsReply ? referenceMessage?.stanzaId : undefined
			},
			signal
		).catch((reason: DOMException) => {
			errorHandler(reason, fileName);
		});
	};

	// Send isWriting every 3 seconds
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const sendThrottleIsWriting = useCallback(
		throttle(() => xmppClient.sendIsWriting(roomId), 3000),
		[xmppClient, roomId]
	);

	// Send paused after 3,5 seconds user stops typing
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const sendDebouncedPause = useCallback(
		debounce(() => xmppClient.sendPaused(roomId), 3500),
		[xmppClient, roomId]
	);

	// Send paused and avoid to send pending isWriting
	const sendStopWriting = useCallback(() => {
		sendThrottleIsWriting.cancel();
		sendDebouncedPause.cancel();
		xmppClient.sendPaused(roomId);
	}, [sendThrottleIsWriting, sendDebouncedPause, xmppClient, roomId]);

	const actionToPerformBasedOnType = useCallback(
		(
			referenceMessage: ReferenceMessage,
			message: string,
			completeReferenceMessage: TextMessage
		): void => {
			switch (referenceMessage.actionType) {
				case messageActionType.REPLY: {
					xmppClient.sendChatMessageReply(
						roomId,
						message,
						referenceMessage.senderId,
						referenceMessage.stanzaId
					);
					unsetReferenceMessage(roomId);
					break;
				}
				case messageActionType.EDIT: {
					// If a text message (not an attachment description) is completely removed, open the delete dialog
					if (message === '' && !referenceMessage.attachment) {
						setDeleteMessageModalStatus(true);
					} else if (completeReferenceMessage.text !== message) {
						// Avoid to send correction if text doesn't change
						xmppClient.sendChatMessageEdit(roomId, message, referenceMessage.stanzaId);
						unsetReferenceMessage(roomId);
					} else {
						unsetReferenceMessage(roomId);
					}
					break;
				}
				default: {
					console.warn('case not handled', referenceMessage);
				}
			}
		},
		[roomId, unsetReferenceMessage, xmppClient]
	);

	const sendMessage = useCallback((): void => {
		sendStopWriting();
		const message = textMessage.trim();
		if (filesToUploadArray) {
			const abortControllerList: AbortController[] = [];
			const copyOfFilesToUploadArray = map(filesToUploadArray, (file) => {
				const copyOfFile = { ...file };
				if (copyOfFile.hasFocus) {
					copyOfFile.description = message;
				}
				const controller = new AbortController();
				abortControllerList.push(controller);
				return copyOfFile;
			});

			setIsUploading(true);
			setListAbortController(abortControllerList);
			const uploadFilesInOrder = copyOfFilesToUploadArray.reduce(
				(acc: Promise<AddRoomAttachmentResponse | void>, file, i) =>
					acc.then(() => uploadAttachmentPromise(file, abortControllerList[i])),
				Promise.resolve()
			);

			// Clean input composer
			unsetFilesToAttach(roomId);
			setDraftMessage(roomId, true);
			setTextMessage('');
			if (referenceMessage) unsetReferenceMessage(roomId);

			uploadFilesInOrder
				.then(() => {
					unsetFilesToAttach(roomId);
					setIsUploading(false);
				})
				.catch((error) => console.log(error));
		} else if (referenceMessage && completeReferenceMessage?.type === MessageType.TEXT_MSG) {
			actionToPerformBasedOnType(referenceMessage, message, completeReferenceMessage);
			setDraftMessage(roomId, true);
			setTextMessage('');
		} else {
			xmppClient.sendChatMessage(roomId, message);
			setDraftMessage(roomId, true);
			setTextMessage('');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		xmppClient,
		roomId,
		textMessage,
		sendStopWriting,
		referenceMessage,
		completeReferenceMessage,
		filesToUploadArray
	]);

	// Set focus on input after closing DeleteMessageModal
	useEffect(() => {
		if (referenceMessage?.actionType === messageActionType.EDIT && !deleteMessageModalStatus) {
			messageInputRef?.current?.focus();
		}
	}, [referenceMessage, deleteMessageModalStatus]);

	const handleTypingMessage = useCallback((e: BaseSyntheticEvent): void => {
		setTextMessage(e.target.value);
	}, []);

	const handleKeyUp = useCallback(
		(e: KeyboardEvent) => {
			if (
				e.key === 'ArrowUp' &&
				!e.shiftKey &&
				lastMessageOfRoom !== undefined &&
				lastMessageOfRoom.type === MessageType.TEXT_MSG &&
				textMessage === '' &&
				canPerformAction(
					lastMessageOfRoom,
					lastMessageOfRoom.from === myUserId,
					editMessageTimeLimitInMinutes,
					messageActionType.EDIT
				)
			) {
				setDraftMessage(lastMessageOfRoom.roomId, false, lastMessageOfRoom.text);
				setReferenceMessage(
					lastMessageOfRoom.roomId,
					lastMessageOfRoom.id,
					lastMessageOfRoom.from,
					lastMessageOfRoom.stanzaId,
					messageActionType.EDIT,
					lastMessageOfRoom.attachment
				);
			}
		},
		[
			editMessageTimeLimitInMinutes,
			lastMessageOfRoom,
			myUserId,
			setDraftMessage,
			setReferenceMessage,
			textMessage
		]
	);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (!sendDisabled && e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				sendMessage();
			} else {
				sendThrottleIsWriting();
				sendDebouncedPause();
			}
		},
		[sendDisabled, sendMessage, sendThrottleIsWriting, sendDebouncedPause]
	);

	const handleOnBlur = useCallback(() => {
		if (size(textMessage) > 0) {
			setDraftMessage(roomId, false, textMessage);
		} else {
			setDraftMessage(roomId, true);
		}
		setInputHasFocus(roomId, false);
	}, [textMessage, setInputHasFocus, roomId, setDraftMessage]);

	const handlePaste = useCallback(
		(ev: ClipboardEvent) => {
			try {
				// Avoid to paste files if user is editing a message
				const editingMessage = referenceMessage?.actionType === messageActionType.EDIT;
				if (!editingMessage) {
					const includeFiles = ev.clipboardData?.files;
					if (includeFiles && includeFiles.length > 0) {
						ev.preventDefault();
						ev.stopPropagation();
						const isFirefoxBrowser = BrowserUtils.isFirefox();
						const isChromeBrowser = BrowserUtils.isChrome();
						const chromeVersion = BrowserUtils.getChromeVersion();
						const isSafariBrowser = BrowserUtils.isSafari();
						const isLinux = BrowserUtils.isLinux();
						const isMac = BrowserUtils.isMac();
						const isWin = BrowserUtils.isWin();

						// LINUX OS AND BROWSER ARE FIREFOX/CHROME
						// WIN OS AND BROWSER ARE CHROME/FIREFOX
						if (isLinux || (isWin && isFirefoxBrowser) || isChromeBrowser || chromeVersion) {
							loadFiles(includeFiles);
						} else if (
							// MAC OS AND BROWSER ARE CHROME/FIREFOX/SAFARI
							(isMac && isChromeBrowser) ||
							chromeVersion ||
							isFirefoxBrowser ||
							isSafariBrowser
						) {
							loadFiles(includeFiles);
						} else {
							console.error(`Browser not support copy/paste function ${navigator.userAgent}`);
						}
					}
				}
			} catch (e) {
				console.error(e);
			}
		},
		[loadFiles, referenceMessage?.actionType]
	);

	useEffect(() => {
		setTextMessage(draftMessage ?? '');
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
		checkMaxLengthAndSetMessage(messageInputRef.current?.value ?? '');
	}, [textMessage, checkMaxLengthAndSetMessage]);

	// Reset values when roomId changes
	useEffect(() => {
		const messageRef = messageInputRef.current;
		return (): void => {
			setTextMessage('');
			if (messageRef) {
				messageRef.value = '';
			}
		};
	}, [roomId]);

	const isDisabledWhileAttachingFile = useMemo(() => {
		if (filesToUploadArray) {
			return !find(filesToUploadArray, (file) => file.hasFocus);
		}
		return false;
	}, [filesToUploadArray]);

	const showAttachFileButton = useMemo(
		() =>
			!isUserGuest &&
			!isUploading &&
			!filesToUploadArray &&
			(!referenceMessage || referenceMessage.actionType === messageActionType.REPLY),
		[filesToUploadArray, isUploading, isUserGuest, referenceMessage]
	);

	return (
		<Container
			height="fit"
			orientation="horizontal"
			crossAlignment="flex-end"
			gap="0.25rem"
			padding={{ all: 'small' }}
		>
			<EmojiSelector messageInputRef={messageInputRef} setMessage={setTextMessage} />
			<MessageArea
				roomId={roomId}
				textareaRef={messageInputRef}
				message={textMessage}
				onInput={handleTypingMessage}
				composerIsFull={noMoreCharsOnInputComposer}
				handleKeyDownTextarea={handleKeyDown}
				handleKeyUpTextarea={handleKeyUp}
				handleOnBlur={handleOnBlur}
				handleOnPaste={handlePaste}
				isDisabled={isDisabledWhileAttachingFile}
			/>
			{showAttachFileButton && <AttachmentSelector roomId={roomId} />}
			{isUploading && (
				<Tooltip label={stopUploadLabel} placement="top">
					<UploadSpinnerWrapper width="2.25rem" height="2.5625rem">
						<LoadingSpinner color="primary" title={uploadingLabel} />
						<BlockUploadButton
							onClick={abortUploadRequest}
							type="ghost"
							color="gray0"
							size="large"
							icon="CloseOutline"
						/>
					</UploadSpinnerWrapper>
				</Tooltip>
			)}
			<Tooltip label={sendDisabled ? writeToSendTooltip : sendMessageLabel} placement="top">
				<SendButton
					onClick={sendMessage}
					type="ghost"
					color="primary"
					size="large"
					icon="Navigation2"
					alt={sendDisabled ? writeToSendTooltip : sendMessageLabel}
					disabled={sendDisabled}
				/>
			</Tooltip>
			{deleteMessageModalStatus && (
				<DeleteMessageModal
					roomId={roomId}
					open={deleteMessageModalStatus}
					setModalStatus={setDeleteMessageModalStatus}
				/>
			)}
		</Container>
	);
};

export default MessageComposer;
