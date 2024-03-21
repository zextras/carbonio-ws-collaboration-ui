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
	Container,
	CreateSnackbarFn,
	IconButton,
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
import useStore from '../../../../store/Store';
import { AddRoomAttachmentResponse } from '../../../../types/network/responses/roomsResponses';
import { FileToUpload, messageActionType } from '../../../../types/store/ActiveConversationTypes';
import { Message, MessageType } from '../../../../types/store/MessageTypes';
import { CapabilityType } from '../../../../types/store/SessionTypes';
import { isAttachmentImage, uid } from '../../../../utils/attachmentUtils';
import { BrowserUtils } from '../../../../utils/BrowserUtils';
import { canPerformAction } from '../../../../utils/MessageActionsUtils';

type ConversationMessageComposerProps = {
	roomId: string;
};

const BlockUploadButton = styled(IconButton)`
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

const SendIconButton = styled(IconButton)<{ alt?: string }>``;

const MessageComposer: React.FC<ConversationMessageComposerProps> = ({ roomId }) => {
	const xmppClient = useStore(getXmppClient);

	const [t] = useTranslation();
	const writeToSendTooltip = t('tooltip.writeToSend', 'Write a message to send it');
	const sendMessageLabel = t('tooltip.sendMessage', 'Send message');
	const uploadingLabel = t('tooltip.uploading', 'Uploading');
	const uploadAbortedLabel = t('attachments.uploadAborted', 'Upload has been interrupted');
	const stopUploadLabel = t('attachments.stopUpload', 'Stop upload');

	const myUserId = useStore(getUserId);
	const referenceMessage = useStore((store) => getReferenceMessage(store, roomId));
	const draftMessage = useStore((store) => getDraftMessage(store, roomId));
	const unsetReferenceMessage = useStore((store) => store.unsetReferenceMessage);
	const setInputHasFocus = useStore((store) => store.setInputHasFocus);
	const setDraftMessage = useStore((store) => store.setDraftMessage);
	const addDescriptionToFileToAttach = useStore((store) => store.addDescriptionToFileToAttach);
	const unsetFilesToAttach = useStore((store) => store.unsetFilesToAttach);
	const filesToUploadArray = useStore((store) => getFilesToUploadArray(store, roomId));
	const setFilesToAttach = useStore((store) => store.setFilesToAttach);
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
			type: 'info',
			label: uploadAbortedLabel,
			hideButton: true,
			autoHideTimeout: 3000
		});
	}, [listAbortController, uploadAbortedLabel, createSnackbar]);

	const checkMaxLengthAndSetMessage = useCallback((textareaValue: string): void => {
		if (textareaValue.length > 4096) {
			setTextMessage(textareaValue.slice(0, 4096));
			// todo fix selection place when user is modifying in the middle of the components
			// const cursorPosition = messageInputRef.current.selectionStart;
			// messageInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
			setNoMoreCharsOnInputComposer(true);
		} else {
			setNoMoreCharsOnInputComposer(false);
			setTextMessage(textareaValue);
		}
	}, []);

	const errorHandler = (reason: DOMException, fileName: string): void => {
		if (reason.name !== 'AbortError') {
			const errorString = t(
				'attachments.errorUploadingFile',
				`Something went wrong uploading ${fileName}`,
				{ file: fileName }
			);
			createSnackbar({
				key: new Date().toLocaleString(),
				type: 'error',
				label: errorString,
				actionLabel: 'UNDERSTOOD',
				disableAutoHide: true
			});
		}
	};

	const uploadAttachmentPromise = (file: FileToUpload, controller: AbortController): any => {
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
				.catch((err) => {
					Promise.reject(new Error(`Upload error for ${fileName}, reason: ${err}`));
				});
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
		} else {
			if (referenceMessage && completeReferenceMessage?.type === MessageType.TEXT_MSG) {
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
						} else {
							// Avoid to send correction if text doesn't change
							if (completeReferenceMessage.text !== message) {
								xmppClient.sendChatMessageEdit(roomId, message, referenceMessage.stanzaId);
							}
							unsetReferenceMessage(roomId);
						}
						break;
					}
					default: {
						console.warn('case not handled', referenceMessage);
					}
				}
			} else {
				xmppClient.sendChatMessage(roomId, message);
			}
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
		filesToUploadArray,
		addDescriptionToFileToAttach
	]);

	// Set focus on input after closing DeleteMessageModal
	useEffect(() => {
		if (referenceMessage?.actionType === messageActionType.EDIT && !deleteMessageModalStatus) {
			messageInputRef?.current?.focus();
		}
	}, [referenceMessage, deleteMessageModalStatus]);

	const handleTypingMessage = useCallback(
		(e: BaseSyntheticEvent): void => {
			checkMaxLengthAndSetMessage(e.target.value);
		},
		[checkMaxLengthAndSetMessage]
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

	const mapFiles = useCallback(
		(listOfFiles, includeFiles) => {
			forEach(includeFiles as [], (file: File, index) => {
				const fileLocalUrl = URL.createObjectURL(file);
				const fileId = uid();
				const isFocusedIfFirstOfListAndFirstToBeUploaded = index === 0 && !filesToUploadArray;
				listOfFiles.push({
					file,
					fileId,
					hasFocus: isFocusedIfFirstOfListAndFirstToBeUploaded,
					description: '',
					localUrl: fileLocalUrl
				});
			});
			setFilesToAttach(roomId, listOfFiles);
			setInputHasFocus(roomId, true);
		},
		[filesToUploadArray, roomId, setFilesToAttach, setInputHasFocus]
	);

	const handlePaste = useCallback(
		(ev) => {
			try {
				// Avoid to paste files if user is editing a message
				const editingMessage = referenceMessage?.actionType === messageActionType.EDIT;
				if (!editingMessage) {
					const includeFiles = ev.clipboardData.files;
					const listOfFiles: FileToUpload[] = [];
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
							mapFiles(listOfFiles, includeFiles);
						} else if (
							// MAC OS AND BROWSER ARE CHROME/FIREFOX/SAFARI
							(isMac && isChromeBrowser) ||
							chromeVersion ||
							isFirefoxBrowser ||
							isSafariBrowser
						) {
							mapFiles(listOfFiles, includeFiles);
						} else {
							console.error(`Browser not support copy/paste function ${navigator}`);
						}
					}
				}
			} catch (e) {
				console.error(e);
			}
		},
		[mapFiles, referenceMessage]
	);

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

	// Reset values when roomId changes
	useEffect(() => {
		const messageRef = messageInputRef.current;
		return () => {
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
			!isUploading &&
			!filesToUploadArray &&
			(!referenceMessage || referenceMessage.actionType === messageActionType.REPLY),
		[filesToUploadArray, isUploading, referenceMessage]
	);

	return (
		<Container
			height="fit"
			orientation="horizontal"
			crossAlignment="flex-end"
			gap="0.25rem"
			padding={{ all: 'small' }}
		>
			<EmojiSelector messageInputRef={messageInputRef} setMessage={checkMaxLengthAndSetMessage} />
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
							iconColor="gray0"
							size="large"
							icon="CloseOutline"
						/>
					</UploadSpinnerWrapper>
				</Tooltip>
			)}
			<Tooltip label={sendDisabled ? writeToSendTooltip : sendMessageLabel} placement="top">
				<SendIconButton
					onClick={sendMessage}
					iconColor="primary"
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
