/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, Icon, IconButton, Text, Tooltip } from '@zextras/carbonio-design-system';
import { PreviewsManagerContext } from '@zextras/carbonio-ui-preview';
import { forEach, map } from 'lodash';
import React, { useCallback, useContext, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { v4 as uuidGenerator } from 'uuid';

import { getFilesToUploadArray } from '../../../store/selectors/ActiveConversationsSelectors';
import useStore from '../../../store/Store';
import { FileToUpload } from '../../../types/store/ActiveConversationTypes';
import {
	canDisplayPreview,
	getAttachmentSize,
	getAttachmentType,
	getExtension
} from '../../../utils/attachmentUtils';

type UploadAttachmentManagerViewProps = {
	roomId: string;
};

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
	border: 0.125rem solid
		${({ hasFocus, theme }): string => (hasFocus ? theme.palette.success.regular : 'transparent')};
	&:hover {
		${HoverActions} {
			opacity: 1;
		}
	}
`;

const PreviewLocalFile = styled(Container)`
	border-radius: 0.625rem;
	background: ${({ bkgUrl, theme }): string =>
		`center / contain no-repeat url('${bkgUrl}'), ${theme.palette.gray0.regular}`};
	box-sizing: border-box;
`;

const FileCloseIconButton = styled(IconButton)`
	position: absolute;
	top: 0.25rem;
	right: 0.25rem;
`;

const FileListContainer = styled(Container)`
	overflow-y: scroll;
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

const CustomIcon = styled(Icon)`
	height: 2.625rem;
	width: 2.625rem;
`;

const LocalFile = styled(Container)`
	border-radius: 0.625rem;
`;

const UploadAttachmentManagerView: React.FC<UploadAttachmentManagerViewProps> = ({ roomId }) => {
	const [t] = useTranslation();
	const closeTooltip = t('tooltip.close', 'Close');
	const addAttachmentLabel = t('action.addAttachment', 'Add attachment');
	const previewActionLabel = t('action.preview', 'Preview');
	const removeActionLabel = t('action.removeUser', 'Remove');

	const filesToUploadArray = useStore((store) => getFilesToUploadArray(store, roomId));
	const unsetFilesToAttach = useStore((store) => store.unsetFilesToAttach);
	const setFilesToAttach = useStore((store) => store.setFilesToAttach);
	const setDraftMessage = useStore((store) => store.setDraftMessage);
	const setFileFocusedToModify = useStore((store) => store.setFileFocusedToModify);
	const removeFileToAttach = useStore((store) => store.removeFileToAttach);
	const setInputHasFocus = useStore((store) => store.setInputHasFocus);

	const fileSelectorInputRef = useRef<HTMLInputElement>(null);
	const { createPreview } = useContext(PreviewsManagerContext);

	const editFileDescription = useCallback(
		(fileId, description) => {
			setDraftMessage(roomId, false, description);
			setFileFocusedToModify(roomId, fileId, true);
			setInputHasFocus(roomId, true);
		},
		[roomId, setFileFocusedToModify, setDraftMessage, setInputHasFocus]
	);

	const removeFile = useCallback(
		(ev, fileId) => {
			ev.stopPropagation();
			if (filesToUploadArray && filesToUploadArray.length === 1) {
				unsetFilesToAttach(roomId);
			} else {
				removeFileToAttach(roomId, fileId);
			}
		},
		[roomId, removeFileToAttach, filesToUploadArray, unsetFilesToAttach]
	);

	const previewClick = useCallback(
		(file) => {
			createPreview({
				previewType: getAttachmentType(file.file.type),
				filename: file.file.name,
				extension: getExtension(file.file.type),
				size: getAttachmentSize(file.file.size),
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
		const filePreviews: any[] = [];
		map(filesToUploadArray, (file) => {
			const displayPreview = canDisplayPreview(file.file.type);
			const previewFile = (
				<PreviewContainer
					key={file.fileId}
					data-testid={file.fileId}
					height="6.25rem"
					width="6.25rem"
					hasFocus={file.hasFocus}
					onClick={(): void => editFileDescription(file.fileId, file.description)}
				>
					<HoverActions>
						<Tooltip label={removeActionLabel} placement="top">
							<FileCloseIconButton
								backgroundColor="gray6"
								borderRadius="round"
								icon="Close"
								size="small"
								onClick={(ev: Event): void => removeFile(ev, file.fileId)}
							/>
						</Tooltip>
						{displayPreview && (
							<Tooltip label={previewActionLabel} placement="top">
								<IconButton
									data-testid={'onto'}
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
						<LocalFile height="6.25rem" width="6.25rem" background="gray2">
							<CustomIcon
								icon="FileTextOutline"
								height="2.625rem"
								width="2.625rem"
								color="secondary"
								label={file.file.name}
							/>
						</LocalFile>
					) : (
						<PreviewLocalFile
							height="6.25rem"
							width="6.25rem"
							minHeight="6.25rem"
							minWidth="6.25rem"
							bkgUrl={file.localUrl}
						/>
					)}
				</PreviewContainer>
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

	const closeUploadAttachmentManagerView = useCallback(
		() => unsetFilesToAttach(roomId),
		[roomId, unsetFilesToAttach]
	);

	const selectFiles = useCallback(
		(ev) => {
			const { files } = ev.target as HTMLInputElement;
			const listOfFiles: FileToUpload[] = [];
			forEach(files, (file: File) => {
				const fileLocalUrl = URL.createObjectURL(file);
				const fileId = uuidGenerator();
				listOfFiles.push({
					file,
					fileId,
					hasFocus: false,
					description: '',
					localUrl: fileLocalUrl
				});
			});
			setFilesToAttach(roomId, listOfFiles);
		},
		[setFilesToAttach, roomId]
	);

	if (filesToUploadArray) {
		return (
			<Container
				background="gray5"
				padding={{ all: 'small' }}
				data-testid="upload_attachment_manager"
			>
				<Container orientation="horizontal" mainAlignment="space-between">
					<Text color="secondary">{addAttachmentLabel}</Text>
					<Tooltip label={closeTooltip} placement="top">
						<IconButton
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
						height="112px"
						maxWidth="calc(100% - 2.5rem)"
					>
						{filesWithPreview}
					</FileListContainer>
					<Tooltip label={addAttachmentLabel} placement="top">
						<IconButton
							size="large"
							icon="Plus"
							iconColor="gray1"
							type="outlined"
							backgroundColor="transparent"
							onClick={addMoreFiles}
						/>
					</Tooltip>
				</Container>
				<input onChange={selectFiles} type="file" multiple hidden ref={fileSelectorInputRef} />
			</Container>
		);
	}
	return null;
};

export default UploadAttachmentManagerView;
