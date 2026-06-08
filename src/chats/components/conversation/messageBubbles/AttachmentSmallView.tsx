/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo } from 'react';

import styled from '@emotion/styled';
import { Avatar, Button, Container, Padding, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import usePreviewNavigation from '../../../../hooks/usePreviewNavigation';
import { AttachmentMessageType } from '../../../../types/store/ChatsRegistryTypes';
import {
	downloadAttachment,
	getAttachmentThumbnailURL,
	getPinAttachmentIcon,
	isPreviewSupported
} from '../../../../utils/attachmentUtils';

const HoverContainer = styled(Container)<{ $isGenericFile: boolean }>`
	z-index: 1;
	position: absolute;
	opacity: 0;
	border-radius: 0.5rem;
	background-color: ${({ $isGenericFile }): string =>
		$isGenericFile ? 'rgba(0, 0, 0, 0.8);' : 'rgba(0, 0, 0, 0.6);'};
`;

const CustomPadding = styled(Padding)`
	position: relative;
	&:hover {
		${HoverContainer} {
			opacity: 1;
		}
	}
`;

const CustomButton = styled(Button)`
	background-color: rgba(255, 255, 255, 0);
	padding: 0.25rem;
	& > svg {
		width: 1.5rem;
		min-width: 1.5rem;
		height: 1.5rem;
		min-height: 1.5rem;
	}
`;

const CustomAvatar = styled(Avatar)`
	svg {
		width: calc(2rem * 0.75);
		min-width: calc(2rem * 0.75);
		height: calc(2rem * 0.75);
		min-height: calc(2rem * 0.75);
	}
`;

type AttachmentSmallViewProps = {
	attachment: AttachmentMessageType;
	roomId: string;
	messageDate: number;
};
const AttachmentSmallView: FC<AttachmentSmallViewProps> = ({ attachment, roomId, messageDate }) => {
	const [t] = useTranslation();
	const previewActionLabel = t('action.preview', 'Preview');
	const downloadActionLabel = t('action.download', 'Download');

	const { openFromChat } = usePreviewNavigation();
	const onPreviewClick = useCallback(() => {
		openFromChat(roomId, attachment, messageDate);
	}, [attachment, messageDate, openFromChat, roomId]);

	const previewURL = useMemo(
		() => getAttachmentThumbnailURL(attachment.id, attachment.mimeType),
		[attachment]
	);

	const previewSupported = useMemo(() => isPreviewSupported(attachment.mimeType), [attachment]);

	const download = useCallback(
		() => downloadAttachment(attachment.id, attachment.name),
		[attachment.id, attachment.name]
	);

	return (
		<CustomPadding right="small" data-testid="hover-container">
			<HoverContainer
				height="3rem"
				width="3rem"
				mainAlignment="center"
				crossAlignment="center"
				$isGenericFile={!previewSupported}
			>
				<Tooltip label={previewSupported ? previewActionLabel : downloadActionLabel}>
					{previewSupported ? (
						<CustomButton type="ghost" icon="EyeOutline" color="gray6" onClick={onPreviewClick} />
					) : (
						<CustomButton type="ghost" color="gray6" icon="DownloadOutline" onClick={download} />
					)}
				</Tooltip>
			</HoverContainer>
			<CustomAvatar
				size="large"
				icon={`${getPinAttachmentIcon(attachment.mimeType)}Outline`}
				label={attachment.name}
				shape="square"
				background={previewURL ? 'gray3' : 'gray0'}
				picture={previewURL}
			/>
		</CustomPadding>
	);
};

export default AttachmentSmallView;
