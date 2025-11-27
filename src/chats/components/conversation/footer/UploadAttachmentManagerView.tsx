/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useContext, useEffect, useMemo, useRef } from 'react';

import styled from '@emotion/styled';
import { Button, Container, Icon, Text, Tooltip } from '@zextras/carbonio-design-system';
import { PreviewsManagerContext } from '@zextras/carbonio-ui-preview';
import { find, map } from 'lodash';
import { useTranslation } from 'react-i18next';

import useUploadFile from '../../../../hooks/useLoadFiles';
import {
	getFilesToUploadArray,
	getFocusedFile
} from '../../../../store/selectors/ActiveConversationsSelectors';
import useStore from '../../../../store/Store';
import { FileToUpload } from '../../../../types/store/ActiveConversationTypes';
import {
	canDisplayPreviewOnLoad,
	getAttachmentExtension,
	getAttachmentIcon,
	getAttachmentSize,
	getAttachmentType
} from '../../../../utils/attachmentUtils';

type UploadAttachmentManagerViewProps = {
	roomId: string;
	textMessage: string;
	setTextMessage: (message: string) => void;
};

const AttachmentsPreview = styled(Container)`
	box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.1);
	-webkit-box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.1);
`;

const HoverActions = styled(Container)`
	z-index: 1;
	position: absolute;
	opacity: 0;
	border-radius: 0.625rem;
	background:
		linear-gradient(0deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)),
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

const FileCloseButton = styled(Button)`
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

const UploadAttachmentManagerView: React.FC<UploadAttachmentManagerViewProps> = ({
	roomId,
	textMessage,
	setTextMessage
}) => {
	const [t] = useTranslation();
	const closeTooltip = t('tooltip.close', 'Close');
	const addAttachmentLabel = t('action.addAttachment', 'Add attachment');
	const previewActionLabel = t('action.preview', 'Preview');
	const removeActionLabel = t('action.removeUser', 'Remove');

	const filesToUploadArray = useStore((store) => getFilesToUploadArray(store, roomId));
	const focusedFile = useStore((store) => getFocusedFile(store, roomId));
	const setFileFocus = useStore((store) => store.setFileFocus);
	const removeFilesToAttach = useStore((store) => store.removeFilesToAttach);
	const setInputHasFocus = useStore((store) => store.setInputHasFocus);
	const setFileDescription = useStore((store) => store.setFileDescription);

	const fileSelectorInputRef = useRef<HTMLInputElement>(null);
	const { createPreview } = useContext(PreviewsManagerContext);

	const setDescriptionAsTextMessage = useCallback(
		(fileId: string | undefined) => {
			const fileSelected = find(filesToUploadArray, (file) => file.fileId === fileId);
			if (fileSelected) {
				setTextMessage(fileSelected.description);
			}
		},
		[filesToUploadArray, setTextMessage]
	);

	// Set inputTest as description of the first file and clear it on unmount
	useEffect(() => {
		setFileDescription(roomId, undefined, textMessage);
		return () => {
			setTextMessage('');
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [setTextMessage]);

	useEffect(() => {
		setDescriptionAsTextMessage(focusedFile);
	}, [focusedFile, setDescriptionAsTextMessage]);

	const focusFile = useCallback(
		(fileId: string) => {
			setFileFocus(roomId, fileId, true);
			setInputHasFocus(roomId, true);
		},
		[roomId, setFileFocus, setInputHasFocus]
	);

	const removeFile = useCallback(
		(ev: { stopPropagation: () => void }, fileId: string) => {
			ev.stopPropagation();
			removeFilesToAttach(roomId, fileId);
			setInputHasFocus(roomId, true);
		},
		[roomId, removeFilesToAttach, setInputHasFocus]
	);

	const previewClick = useCallback(
		(file: FileToUpload) => {
			const extension = getAttachmentExtension(file.file.type);
			const size = getAttachmentSize(file.file.size);
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
		map(filesToUploadArray, (file): void => {
			const displayPreview = canDisplayPreviewOnLoad(file.file.type);
			const previewFile = (
				<Tooltip key={`${file.file.name}-${file.fileId}`} label={file.file.name}>
					<PreviewContainer
						key={file.fileId}
						data-testid={`previewFileUpload-${file.file.name}-${file.fileId}`}
						height="6.25rem"
						width="6.25rem"
						onClick={(): void => focusFile(file.fileId)}
					>
						<HoverActions>
							<Tooltip label={removeActionLabel} placement="top">
								<FileCloseButton
									data-testid={`removeSingleFile-${file.fileId}`}
									color="gray6"
									type="ghost"
									shape="round"
									icon="Close"
									size="small"
									onClick={(ev): void => removeFile(ev, file.fileId)}
								/>
							</Tooltip>
							{displayPreview && (
								<Tooltip label={previewActionLabel} placement="top">
									<Button
										data-testid={`previewSingleFile-${file.fileId}`}
										color="gray6"
										type="ghost"
										shape="round"
										icon="EyeOutline"
										size="large"
										onClick={(ev): void => {
											ev.stopPropagation();
											previewClick(file);
										}}
									/>
								</Tooltip>
							)}
						</HoverActions>
						{!displayPreview ? (
							<LocalFile
								data-testid={`fileNoPreview-${file.file.name}-${file.fileId}`}
								height="6.25rem"
								width="6.25rem"
								background={'gray2'}
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
		filesToUploadArray,
		removeActionLabel,
		previewActionLabel,
		focusFile,
		removeFile,
		previewClick
	]);

	const closeUploadAttachmentManagerView = useCallback(() => {
		removeFilesToAttach(roomId);
	}, [roomId, removeFilesToAttach]);

	const loadFiles = useUploadFile(roomId);

	const selectFiles = useCallback(
		(ev: { target: HTMLInputElement }) => {
			const { files } = ev.target;
			loadFiles(files ?? new FileList());
		},
		[loadFiles]
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

	return (
		<AttachmentsPreview
			background={'gray5'}
			padding={{ all: 'small' }}
			data-testid="upload_attachment_manager"
		>
			<Container orientation="horizontal" mainAlignment="space-between">
				<Text color="secondary">{titleLabel}</Text>
				<Tooltip label={closeTooltip} placement="top">
					<Button
						data-testid="closeFilesManager"
						type="ghost"
						icon="Close"
						color="secondary"
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
					<Button
						data-testid="addMoreFilesFromManager"
						size="large"
						icon="Plus"
						labelColor="gray1"
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
};

export default UploadAttachmentManagerView;
