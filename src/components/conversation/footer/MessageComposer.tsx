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
	SnackbarManagerContext,
	Spinner
} from '@zextras/carbonio-design-system';
import { find, forEach, map } from 'lodash';
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
import styled from 'styled-components';

import AttachmentSelector from './AttachmentSelector';
import DeleteMessageModal from './DeleteMessageModal';
import EmojiPicker from './EmojiPicker';
import MessageArea from './MessageArea';
import useMessage from '../../../hooks/useMessage';
import { RoomsApi } from '../../../network';
import {
	getDraftMessage,
	getFilesToUploadArray,
	getInputHasFocus,
	getReferenceMessage
} from '../../../store/selectors/ActiveConversationsSelectors';
import { getXmppClient } from '../../../store/selectors/ConnectionSelector';
import { getRoomUnreadsSelector } from '../../../store/selectors/UnreadsCounterSelectors';
import useStore from '../../../store/Store';
import { Emoji } from '../../../types/generics';
import { AddRoomAttachmentResponse } from '../../../types/network/responses/roomsResponses';
import { FileToUpload, messageActionType } from '../../../types/store/ActiveConversationTypes';
import { MessageType } from '../../../types/store/MessageTypes';
import { uid } from '../../../utils/attachmentUtils';
import { BrowserUtils } from '../../../utils/BrowserUtils';

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

const MessageComposer: React.FC<ConversationMessageComposerProps> = ({ roomId }) => {
	const xmppClient = useStore(getXmppClient);

	const [t] = useTranslation();
	const writeToSendTooltip = t('tooltip.writeToSend', 'Write a message to send it');
	const selectEmojiLabel = t('tooltip.selectEmoji', 'Select emoji');
	const sendMessageLabel = t('tooltip.sendMessage', 'Send message');
	const uploadingLabel = t('tooltip.uploading', 'Uploading');
	const uploadAbortedLabel = t('attachments.uploadAborted', 'Upload has been interrupted');
	const stopUploadLabel = t('attachments.stopUpload', 'Stop upload');
	const clearLabel = t('tooltip.removeCaption', 'Remove caption');

	const referenceMessage = useStore((store) => getReferenceMessage(store, roomId));
	const draftMessage = useStore((store) => getDraftMessage(store, roomId));
	const unsetReferenceMessage = useStore((store) => store.unsetReferenceMessage);
	const inputHasFocus = useStore((store) => getInputHasFocus(store, roomId));
	const setInputHasFocus = useStore((store) => store.setInputHasFocus);
	const setDraftMessage = useStore((store) => store.setDraftMessage);
	const addDescriptionToFileToAttach = useStore((store) => store.addDescriptionToFileToAttach);
	const unsetFilesToAttach = useStore((store) => store.unsetFilesToAttach);
	const unreadMessagesCount = useStore((store) => getRoomUnreadsSelector(store, roomId));
	const filesToUploadArray = useStore((store) => getFilesToUploadArray(store, roomId));
	const setFilesToAttach = useStore((store) => store.setFilesToAttach);

	const completeReferenceMessage = useMessage(roomId, referenceMessage?.messageId || '');

	const [listAbortController, setListAbortController] = useState<AbortController[]>([]);
	const [textMessage, setTextMessage] = useState('');
	const [isWriting, setIsWriting] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [noMoreCharsOnInputComposer, setNoMoreCharsOnInputComposer] = useState(false);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [deleteMessageModalStatus, setDeleteMessageModalStatus] = useState(false);

	const createSnackbar: any = useContext(SnackbarManagerContext);

	const messageInputRef = useRef<HTMLTextAreaElement>();
	const emojiButtonRef = useRef<HTMLButtonElement>();
	const emojiTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

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

	const checkMaxLengthAndSetMessage = useCallback(
		(textareaValue: string): void => {
			if (textareaValue.length > 4096) {
				setTextMessage(textareaValue.slice(0, 4096));
				// todo fix selection place when user is modifying in the middle of the components
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
						messageInputRef.current.style.paddingTop = '0.9375rem';
					}
				}
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[textMessage, messageInputRef]
	);

	const uploadAttachmentPromise = (
		file: FileToUpload,
		controller: AbortController
	): Promise<AddRoomAttachmentResponse | void> => {
		const fileName = file.file.name;
		const { signal } = controller;
		// Send as reply only the first file of the array
		const sendAsReply = filesToUploadArray && file.fileId === filesToUploadArray[0].fileId;
		return RoomsApi.addRoomAttachment(
			roomId,
			file.file,
			{
				description: file.description,
				replyId: sendAsReply ? referenceMessage?.stanzaId : undefined
			},
			signal
		).catch((reason: DOMException) => {
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
		});
	};

	const sendMessage = useCallback((): void => {
		if (showEmojiPicker) setShowEmojiPicker(false);
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
			if (messageInputRef.current) messageInputRef.current.style.height = '';
			if (referenceMessage) unsetReferenceMessage(roomId);

			uploadFilesInOrder
				.then(() => {
					unsetFilesToAttach(roomId);
					setIsUploading(false);
				})
				.catch(() => console.log('error'));
		} else {
			if (
				referenceMessage &&
				completeReferenceMessage &&
				completeReferenceMessage.type === MessageType.TEXT_MSG
			) {
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
						}
						// Avoid to send correction if text doesn't change
						else {
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
		completeReferenceMessage,
		filesToUploadArray,
		addDescriptionToFileToAttach
	]);

	// Set focus on input after closing DeleteMessageModal
	useEffect(() => {
		if (referenceMessage?.actionType === messageActionType.EDIT && !deleteMessageModalStatus) {
			if (messageInputRef?.current) {
				messageInputRef.current?.focus();
			}
		}
	}, [referenceMessage, deleteMessageModalStatus]);

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

	const clearInput = useCallback(() => {
		setTextMessage('');
		setDraftMessage(roomId, true);
		if (messageInputRef.current) {
			messageInputRef.current.style.height = '';
			messageInputRef.current.focus();
		}
	}, [setTextMessage, setDraftMessage, roomId]);

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
		if (textMessage.length > 0) {
			setDraftMessage(roomId, false, textMessage);
		} else {
			setDraftMessage(roomId, true);
		}
		setInputHasFocus(roomId, false);
	}, [textMessage, setInputHasFocus, roomId, setDraftMessage]);

	const sendStopWriting = useCallback(() => xmppClient.sendPaused(roomId), [xmppClient, roomId]);

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
						if (isLinux || isWin) {
							if (isFirefoxBrowser || isChromeBrowser || chromeVersion) {
								mapFiles(listOfFiles, includeFiles);
							} else {
								console.error(`Browser not support copy/paste function ${navigator}`);
							}
						}
						// MAC OS AND BROWSER ARE CHROME/FIREFOX/SAFARI
						else if (isMac) {
							if (isChromeBrowser || chromeVersion || isFirefoxBrowser || isSafariBrowser) {
								mapFiles(listOfFiles, includeFiles);
							} else {
								console.error(`Browser not support copy/paste function ${navigator}`);
							}
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [roomId, sendStopWriting, xmppClient]);

	useEffect(() => {
		if (inputHasFocus) {
			messageInputRef.current?.focus();
		}
	}, [inputHasFocus]);

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
					handleOnPaste={handlePaste}
					isDisabled={isDisabledWhileAttachingFile}
				/>
				{showAttachFileButton && <AttachmentSelector roomId={roomId} />}
				{isUploading && (
					<Tooltip label={stopUploadLabel} placement="top">
						<UploadSpinnerWrapper
							width="2.25rem"
							height="2.5625rem"
							padding={{ bottom: '0.3125rem' }}
						>
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
				{filesToUploadArray && textMessage.length > 0 && (
					<Tooltip label={clearLabel} placement="top">
						<Container width="fit" height="fit" padding={{ bottom: '0.3125rem' }}>
							<IconButton
								onClick={clearInput}
								iconColor="gray0"
								size="large"
								icon="BackspaceOutline"
								disabled={sendDisabled}
							/>
						</Container>
					</Tooltip>
				)}
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
