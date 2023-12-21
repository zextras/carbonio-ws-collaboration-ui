/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useContext, useMemo, useRef } from 'react';

import { Container, Icon, IconButton, Text, Tooltip } from '@zextras/carbonio-design-system';
import { PreviewsManagerContext } from '@zextras/carbonio-ui-preview';
import { forEach, map } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
	getDraftMessage,
	getFilesToUploadArray
} from '../../../../store/selectors/ActiveConversationsSelectors';
import useStore from '../../../../store/Store';
import { FileToUpload } from '../../../../types/store/ActiveConversationTypes';
import {
	canDisplayPreviewOnLoad,
	getAttachmentIcon,
	getAttachmentInfo,
	getAttachmentType,
	uid
} from '../../../../utils/attachmentUtils';

type UploadAttachmentManagerViewProps = {
	roomId: string;
};

const AttachmentsPreview = styled(Container)`
	box-shadow: 0px -1px 2px rgba(0, 0, 0, 0.1);
	-webkit-box-shadow: 0px -1px 2px rgba(0, 0, 0, 0.1);
`;

const HoverActions = styled(Container)`
	z-index: 1;
	position: absolute;
	opacity: 0;
	border-radius: 0.625rem;
	background: linear-gradient(0deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)),
		linear-gradient(0deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5));
`;

const PreviewContainer = styled(Container)`
	border-radius: 0.625rem;
	margin-left: 0.25rem;
	margin-right: 0.25rem;
	position: relative;
	cursor: pointer;
	box-sizing: content-box;
	&:hover {
		${HoverActions} {
			opacity: 1;
		}
	}
`;

const LocalFile = styled(Container)<{ $hasFocus: boolean }>`
	border-radius: 0.625rem;
	border: 0.125rem solid
		${({ $hasFocus, theme }): string => ($hasFocus ? theme.palette.success.regular : 'transparent')};
`;

const PreviewLocalFile = styled(Container)<{ $hasFocus: boolean; $bkgUrl: string }>`
	border-radius: 0.625rem;
	border: 0.125rem solid
		${({ $hasFocus, theme }): string => ($hasFocus ? theme.palette.success.regular : 'transparent')};
	background: ${({ $bkgUrl, theme }): string =>
		`center / contain no-repeat url('${$bkgUrl}'), ${theme.palette.gray0.regular}`};
`;

const FileCloseIconButton = styled(IconButton)`
	position: absolute;
	top: 0.25rem;
	right: 0.25rem;
`;

const FileListContainer = styled(Container)`
	overflow-x: scroll;
	margin-right: ${({ theme }): string => theme.sizes.padding.small};
	&::-webkit-scrollbar {
		width: 0.5rem;
		height: 0.5rem;
	}
	&::-webkit-scrollbar-thumb {
		background: ${({ theme }): string => theme.palette.gray6.active};
		border-radius: 0.25rem;
	}
	&::-webkit-scrollbar-thumb:hover {
		background: #ccc;
	}
	&::-webkit-scrollbar-track {
		background: transparent;
	}
`;

const CustomIcon = styled(Icon)<{ title?: string }>`
	height: 2.625rem;
	width: 2.625rem;
`;

const UploadAttachmentManagerView: React.FC<UploadAttachmentManagerViewProps> = ({ roomId }) => {
	const [t] = useTranslation();
	const closeTooltip = t('tooltip.close', 'Close');
	const addAttachmentLabel = t('action.addAttachment', 'Add attachment');
	const previewActionLabel = t('action.preview', 'Preview');
	const removeActionLabel = t('action.removeUser', 'Remove');

	const filesToUploadArray = useStore((store) => getFilesToUploadArray(store, roomId));
	const draftMessage = useStore((store) => getDraftMessage(store, roomId));
	const unsetFilesToAttach = useStore((store) => store.unsetFilesToAttach);
	const setFilesToAttach = useStore((store) => store.setFilesToAttach);
	const setDraftMessage = useStore((store) => store.setDraftMessage);
	const setFileFocusedToModify = useStore((store) => store.setFileFocusedToModify);
	const removeFileToAttach = useStore((store) => store.removeFileToAttach);
	const addDescriptionToFileToAttach = useStore((store) => store.addDescriptionToFileToAttach);
	const removeDescriptionToFileToAttach = useStore(
		(store) => store.removeDescriptionToFileToAttach
	);
	const setInputHasFocus = useStore((store) => store.setInputHasFocus);

	const fileSelectorInputRef = useRef<HTMLInputElement>(null);
	const { createPreview } = useContext(PreviewsManagerContext);

	const editFileDescription = useCallback(
		(fileId, description) => {
			// save the description of the file currently focused
			// and then change the file to edit
			let fileIdActuallyFocused;
			forEach(filesToUploadArray, (file) => {
				if (file.hasFocus) {
					fileIdActuallyFocused = file.fileId;
					if (draftMessage) {
						addDescriptionToFileToAttach(roomId, file.fileId, draftMessage);
					} else {
						removeDescriptionToFileToAttach(roomId, file.fileId);
					}
				}
			});
			if (fileIdActuallyFocused !== fileId) {
				setDraftMessage(roomId, false, description);
			}
			setFileFocusedToModify(roomId, fileId, true);
			setInputHasFocus(roomId, true);
		},
		[
			roomId,
			setFileFocusedToModify,
			setDraftMessage,
			setInputHasFocus,
			addDescriptionToFileToAttach,
			removeDescriptionToFileToAttach,
			draftMessage,
			filesToUploadArray
		]
	);

	const removeFile = useCallback(
		(ev, fileId) => {
			ev.stopPropagation();
			if (filesToUploadArray && filesToUploadArray.length === 1) {
				unsetFilesToAttach(roomId);
				setDraftMessage(roomId, true);
			} else {
				// if the file I'm removing is the selected one with text on input, clean the input and remove the file
				if (draftMessage) {
					forEach(filesToUploadArray, (file) => {
						if (file.hasFocus && file.fileId === fileId) {
							setDraftMessage(roomId, true);
						}
					});
				}
				removeFileToAttach(roomId, fileId);
				setInputHasFocus(roomId, true);
			}
		},
		[
			roomId,
			setDraftMessage,
			removeFileToAttach,
			filesToUploadArray,
			unsetFilesToAttach,
			draftMessage,
			setInputHasFocus
		]
	);

	const previewClick = useCallback(
		(file) => {
			const { extension, size } = getAttachmentInfo(file.file.type, file.file.size);
			return createPreview({
				previewType: getAttachmentType(file.file.type),
				filename: file.file.name,
				extension: extension?.toUpperCase(),
				size,
				closeAction: {
					id: 'close-action',
					icon: 'ArrowBackOutline',
					tooltipLabel: t('action.close', 'Close')
				},
				src: file.localUrl
			});
		},
		[createPreview, t]
	);

	const addMoreFiles = useCallback(
		() => fileSelectorInputRef.current?.click(),
		[fileSelectorInputRef]
	);

	const filesWithPreview = useMemo(() => {
		const filePreviews: JSX.Element[] = [];
		map(filesToUploadArray, (file) => {
			const displayPreview = canDisplayPreviewOnLoad(file.file.type);
			const previewFile = (
				<Tooltip key={`${file.file.name}-${file.fileId}`} label={file.file.name}>
					<PreviewContainer
						key={file.fileId}
						data-testid={`previewFileUpload-${file.file.name}-${file.fileId}`}
						height="6.25rem"
						width="6.25rem"
						onClick={(): void => editFileDescription(file.fileId, file.description)}
					>
						<HoverActions>
							<Tooltip label={removeActionLabel} placement="top">
								<FileCloseIconButton
									data-testid={`removeSingleFile-${file.fileId}`}
									backgroundColor="gray6"
									borderRadius="round"
									icon="Close"
									size="small"
									onClick={(ev): void => removeFile(ev, file.fileId)}
								/>
							</Tooltip>
							{displayPreview && (
								<Tooltip label={previewActionLabel} placement="top">
									<IconButton
										data-testid={`previewSingleFile-${file.fileId}`}
										backgroundColor="gray6"
										borderRadius="round"
										icon="EyeOutline"
										size="large"
										onClick={(): void => previewClick(file)}
									/>
								</Tooltip>
							)}
						</HoverActions>
						{!displayPreview ? (
							<LocalFile
								data-testid={`fileNoPreview-${file.file.name}-${file.fileId}`}
								height="6.25rem"
								width="6.25rem"
								background="gray2"
								$hasFocus={file.hasFocus}
							>
								<CustomIcon
									icon={getAttachmentIcon(file.file.type)}
									height="2.625rem"
									width="2.625rem"
									color="secondary"
									title={file.file.name}
								/>
							</LocalFile>
						) : (
							<PreviewLocalFile
								data-testid={`previewImage-${file.file.name}-${file.fileId}`}
								height="6.25rem"
								width="6.25rem"
								minHeight="6.25rem"
								minWidth="6.25rem"
								$bkgUrl={file.localUrl}
								$hasFocus={file.hasFocus}
							/>
						)}
					</PreviewContainer>
				</Tooltip>
			);
			filePreviews.push(previewFile);
		});
		return filePreviews;
	}, [
		editFileDescription,
		filesToUploadArray,
		previewActionLabel,
		previewClick,
		removeActionLabel,
		removeFile
	]);

	const closeUploadAttachmentManagerView = useCallback(() => {
		unsetFilesToAttach(roomId);
		setDraftMessage(roomId, true);
	}, [roomId, unsetFilesToAttach, setDraftMessage]);

	const selectFiles = useCallback(
		(ev) => {
			const { files } = ev.target as HTMLInputElement;
			const listOfFiles: FileToUpload[] = [];
			forEach(files, (file: File, index) => {
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
		[setFilesToAttach, roomId, setInputHasFocus, filesToUploadArray]
	);

	const titleLabel = useMemo(() => {
		if (filesToUploadArray?.length === 1) {
			return t('action.addSingleAttachment', `Add ${filesToUploadArray?.length} attachment`, {
				counter: filesToUploadArray?.length
			});
		}
		return t('action.addMoreAttachments', `Add ${filesToUploadArray?.length} attachments`, {
			counter: filesToUploadArray?.length
		});
	}, [filesToUploadArray, t]);

	if (filesToUploadArray) {
		return (
			<AttachmentsPreview
				background="gray5"
				padding={{ all: 'small' }}
				data-testid="upload_attachment_manager"
			>
				<Container orientation="horizontal" mainAlignment="space-between">
					<Text color="secondary">{titleLabel}</Text>
					<Tooltip label={closeTooltip} placement="top">
						<IconButton
							data-testid="closeFilesManager"
							icon="Close"
							iconColor="secondary"
							size="medium"
							onClick={closeUploadAttachmentManagerView}
						/>
					</Tooltip>
				</Container>
				<Container orientation="horizontal" padding={{ all: 'small' }}>
					<FileListContainer
						orientation="horizontal"
						padding={{ horizontal: 'extrasmall' }}
						width="fit"
						mainAlignment="flex-start"
						height="7.1875rem"
						maxWidth="calc(100% - 2.5rem)"
					>
						{filesWithPreview}
					</FileListContainer>
					<Tooltip label={addAttachmentLabel} placement="top">
						<IconButton
							data-testid="addMoreFilesFromManager"
							size="large"
							icon="Plus"
							iconColor="gray1"
							type="outlined"
							backgroundColor="transparent"
							onClick={addMoreFiles}
						/>
					</Tooltip>
				</Container>
				<input
					data-testid="addMoreFilesInput"
					onChange={selectFiles}
					type="file"
					multiple
					hidden
					ref={fileSelectorInputRef}
				/>
			</AttachmentsPreview>
		);
	}
	return null;
};

export default UploadAttachmentManagerView;
