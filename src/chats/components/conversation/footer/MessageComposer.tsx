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

import styled from '@emotion/styled';
import {
	Button,
	Container,
	CreateSnackbarFn,
	Spinner,
	Tooltip,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { debounce, find, forEach, map, throttle } from 'lodash';
import { useTranslation } from 'react-i18next';

import AttachmentSelector from './AttachmentSelector';
import DeleteMessageModal from './DeleteMessageModal';
import EmojiSelector from './EmojiSelector';
import MessageArea from './MessageArea';
import { IME_LANGUAGES, MESSAGE_CHAR_LIMIT } from '../../../../constants/messageConstants';
import useLoadFiles from '../../../../hooks/useLoadFiles';
import useMessage from '../../../../hooks/useMessage';
import { AttachmentsApi, RoomsApi } from '../../../../network';
import {
	getFilesToUploadArray,
	getReferenceMessage
} from '../../../../store/selectors/ActiveConversationsSelectors';
import { getLastMessageIdSelector } from '../../../../store/selectors/ChatsRegistrySelectors';
import { getXmppClient } from '../../../../store/selectors/ConnectionSelector';
import { getAttribute, getUserId } from '../../../../store/selectors/SessionSelectors';
import { getIsUserGuest } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { AddRoomAttachmentResponse } from '../../../../types/network/responses/roomsResponses';
import {
	FileToUpload,
	messageActionType,
	ReferenceMessage
} from '../../../../types/store/ActiveConversationTypes';
import { Message, MessageType, TextMessage } from '../../../../types/store/ChatsRegistryTypes';
import { isAttachmentImage } from '../../../../utils/attachmentUtils';
import { BrowserUtils } from '../../../../utils/BrowserUtils';
import { canPerformAction } from '../../../../utils/MessageActionsUtils';

type ConversationMessageComposerProps = {
	roomId: string;
	textMessage: string;
	setTextMessage: (message: string) => void;
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

const MessageComposer: React.FC<ConversationMessageComposerProps> = ({
	roomId,
	textMessage,
	setTextMessage
}) => {
	const xmppClient = useStore(getXmppClient);

	const [t] = useTranslation();
	const writeToSendTooltip = t('tooltip.writeToSend', 'Write a message to send it');
	const sendMessageLabel = t('tooltip.sendMessage', 'Send message');
	const uploadingLabel = t('tooltip.uploading', 'Uploading');
	const uploadAbortedLabel = t('attachments.uploadAborted', 'Upload has been interrupted');
	const stopUploadLabel = t('attachments.stopUpload', 'Stop upload');
	const actionLabel = t('action.understood', 'Understood');

	const myUserId = useStore(getUserId);
	const isUserGuest = useStore((store) => getIsUserGuest(store, myUserId ?? ''));
	const referenceMessage = useStore((store) => getReferenceMessage(store, roomId));
	const unsetReferenceMessage = useStore((store) => store.unsetReferenceMessage);
	const setDraftMessage = useStore((store) => store.setDraftMessage);
	const removeFilesToAttach = useStore((store) => store.removeFilesToAttach);
	const setFileDescription = useStore((store) => store.setFileDescription);
	const filesToUploadArray = useStore((store) => getFilesToUploadArray(store, roomId));
	const lastMessageId: string | undefined = useStore((state) =>
		getLastMessageIdSelector(state, roomId)
	);
	const messageEditTimeLimit = useStore((store) =>
		getAttribute(store, 'messageEditTimeLimit')
	) as number;
	const lastMessageOfRoom: Message | undefined = useMessage(roomId, lastMessageId ?? '');
	const setReferenceMessage = useStore((store) => store.setReferenceMessage);
	const maxAttachmentSize = useStore((store) => getAttribute(store, 'maxAttachmentSize'));

	const fileSizeTooLargeLabel = t(
		'attachments.upload.tooLarge',
		`Upload failed: The file exceeds the maximum file size of ${maxAttachmentSize}MB.`,
		{ size: maxAttachmentSize }
	);

	const completeReferenceMessage = useMessage(roomId, referenceMessage?.messageId ?? '');

	const [listAbortController, setListAbortController] = useState<AbortController[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const [noMoreCharsOnInputComposer, setNoMoreCharsOnInputComposer] = useState(false);
	const [deleteMessageModalStatus, setDeleteMessageModalStatus] = useState(false);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const messageInputRef = useRef<HTMLTextAreaElement>(null);

	const loadFiles = useLoadFiles(roomId);

	const carbonioLanguage = useUserSettings().prefs?.zimbraPrefLocale;

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
			if (textareaValue.length >= MESSAGE_CHAR_LIMIT) {
				setTextMessage(textareaValue.slice(0, MESSAGE_CHAR_LIMIT));
				setNoMoreCharsOnInputComposer(true);
			} else {
				setNoMoreCharsOnInputComposer(false);
			}
		},
		[setTextMessage]
	);

	// Check message max length when some files are attached
	useEffect(() => {
		checkMaxLengthAndSetMessage(messageInputRef.current?.value ?? '');
	}, [filesToUploadArray?.length, checkMaxLengthAndSetMessage]);

	const errorHandler = (reason: Error, fileName: string): void => {
		if (reason.name !== 'AbortError') {
			const errorLabel = t(
				'attachments.errorUploadingFile',
				`Something went wrong uploading ${fileName}`,
				{ file: fileName }
			);
			createSnackbar({
				key: new Date().toLocaleString(),
				severity: 'error',
				label: reason.message === 'file_too_large' ? fileSizeTooLargeLabel : errorLabel,
				actionLabel,
				disableAutoHide: true
			});
		}
	};

	const uploadAttachmentPromise = async (
		file: FileToUpload,
		controller: AbortController
	): Promise<AddRoomAttachmentResponse> => {
		const fileName = file.file.name;
		const { signal } = controller;

		// Send as reply only the first file of the array
		const sendAsReply = filesToUploadArray && file.fileId === filesToUploadArray[0].fileId;

		let area;
		if (isAttachmentImage(file.file.type)) {
			try {
				const imageSize = await AttachmentsApi.getImageSize(file.localUrl);
				area = `${imageSize.width}x${imageSize.height}`;
			} catch (err) {
				return Promise.reject(err);
			}
		}
		return RoomsApi.addRoomAttachment(
			roomId,
			file.file,
			{
				description: file.description,
				replyId: sendAsReply ? referenceMessage?.stanzaId : undefined,
				area
			},
			signal
		).catch((reason: DOMException) => {
			errorHandler(reason, fileName);
			return Promise.reject(reason);
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
						xmppClient.sendChatMessageEdit(
							roomId,
							message,
							referenceMessage.stanzaId,
							completeReferenceMessage.editedStanzaId ?? referenceMessage.stanzaId
						);
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
			removeFilesToAttach(roomId);
			setDraftMessage(roomId);
			setTextMessage('');
			if (referenceMessage) unsetReferenceMessage(roomId);

			uploadFilesInOrder
				.then(() => {
					removeFilesToAttach(roomId);
					setIsUploading(false);
				})
				.catch(() => {
					setDraftMessage(roomId, message);
					setIsUploading(false);
				});
		} else if (referenceMessage && completeReferenceMessage?.type === MessageType.TEXT_MSG) {
			actionToPerformBasedOnType(referenceMessage, message, completeReferenceMessage);
			setDraftMessage(roomId);
			setTextMessage('');
		} else {
			xmppClient.sendChatMessage(roomId, message);
			setDraftMessage(roomId);
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

	const handleTypingMessage = useCallback(
		(e: BaseSyntheticEvent): void => {
			setTextMessage(e.target.value);
			const focusedFile = filesToUploadArray?.find((file) => file.hasFocus);
			if (focusedFile) {
				setFileDescription(roomId, focusedFile.fileId, e.target.value);
			}
		},
		[setTextMessage, filesToUploadArray, roomId, setFileDescription]
	);

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
					messageEditTimeLimit,
					messageActionType.EDIT
				)
			) {
				setDraftMessage(lastMessageOfRoom.roomId, lastMessageOfRoom.text);
				setReferenceMessage(lastMessageOfRoom.roomId, {
					messageId: lastMessageOfRoom.id,
					senderId: lastMessageOfRoom.from,
					stanzaId: lastMessageOfRoom.stanzaId,
					actionType: messageActionType.EDIT,
					attachment: lastMessageOfRoom.attachment
				});
			}
		},
		[
			messageEditTimeLimit,
			lastMessageOfRoom,
			myUserId,
			setDraftMessage,
			setReferenceMessage,
			textMessage
		]
	);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (
				!sendDisabled &&
				e.key === 'Enter' &&
				!e.shiftKey &&
				(!carbonioLanguage || !IME_LANGUAGES.includes(carbonioLanguage))
			) {
				e.preventDefault();
				sendMessage();
			} else {
				sendThrottleIsWriting();
				sendDebouncedPause();
			}
		},
		[sendDisabled, carbonioLanguage, sendMessage, sendThrottleIsWriting, sendDebouncedPause]
	);

	useEffect(() => {
		const ref = messageInputRef.current;
		return () => {
			const draft = ref?.value ?? '';
			setDraftMessage(roomId, draft.trim() || undefined);
		};
	}, [roomId, setDraftMessage, messageInputRef]);

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
		if (referenceMessage && messageInputRef.current) {
			messageInputRef.current.focus();
			// clean the composer section and remove all file uploading if user
			// is uploading files and then decide to edit a message
			if (filesToUploadArray && referenceMessage.actionType === messageActionType.EDIT) {
				removeFilesToAttach(roomId);
			}
		}
	}, [referenceMessage, filesToUploadArray, removeFilesToAttach, roomId]);

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
	}, [roomId, setTextMessage]);

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
