/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo } from 'react';

import { Avatar, Container, IconButton, Padding, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import usePreview from '../../../../hooks/usePreview';
import { AttachmentsApi } from '../../../../network';
import { AttachmentMessageType } from '../../../../types/store/MessageTypes';
import { getThumbnailURL, isPreviewSupported } from '../../../../utils/attachmentUtils';

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

const CustomIconButton = styled(IconButton)`
	background-color: rgba(255, 255, 255, 0);
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
};
const AttachmentSmallView: FC<AttachmentSmallViewProps> = ({ attachment }) => {
	const [t] = useTranslation();
	const previewActionLabel = t('action.preview', 'Preview');
	const downloadActionLabel = t('action.download', 'Download');

	const { onPreviewClick } = usePreview(attachment);

	const previewURL = useMemo(
		() => getThumbnailURL(attachment.id, attachment.mimeType),
		[attachment]
	);

	const previewSupported = useMemo(() => isPreviewSupported(attachment.mimeType), [attachment]);

	const download = useCallback(() => {
		const downloadUrl = AttachmentsApi.getURLAttachment(attachment.id);
		const linkTag: HTMLAnchorElement = document.createElement('a');
		document.body.appendChild(linkTag);
		linkTag.href = downloadUrl;
		linkTag.download = attachment.name;
		linkTag.target = '_blank';
		linkTag.click();
		linkTag.remove();
	}, [attachment.id, attachment.name]);

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
						<CustomIconButton
							icon="EyeOutline"
							iconColor="gray6"
							customSize={{ iconSize: 'large', paddingSize: 'extrasmall' }}
							onClick={onPreviewClick}
						/>
					) : (
						<CustomIconButton
							iconColor="gray6"
							icon="DownloadOutline"
							customSize={{ iconSize: 'large', paddingSize: 'extrasmall' }}
							onClick={download}
						/>
					)}
				</Tooltip>
			</HoverContainer>
			<CustomAvatar
				size="large"
				icon="FileTextOutline"
				label={attachment.name}
				shape="square"
				background={previewURL ? 'gray3' : 'gray0'}
				picture={previewURL}
			/>
		</CustomPadding>
	);
};

export default AttachmentSmallView;
