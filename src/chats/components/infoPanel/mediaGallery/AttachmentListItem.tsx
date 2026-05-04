/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import styled from '@emotion/styled';
import { Avatar, Container, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { getUserId } from '../../../../store/selectors/SessionSelectors';
import { getUserName } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';
import { Attachment } from '../../../../types/network/models/attachmentTypes';
import {
	getAttachmentSize,
	getPinAttachmentColor,
	getPinAttachmentIcon
} from '../../../../utils/attachmentUtils';

type AttachmentListItemProps = {
	attachment: Attachment;
};

const FileAvatar = styled(Avatar)`
	min-width: 2.25rem;
	min-height: 2.25rem;
	width: 2.25rem;
	height: 2.25rem;
	svg {
		width: 1.25rem;
		min-width: 1.25rem;
		height: 1.25rem;
		min-height: 1.25rem;
	}
`;

export const AttachmentListItem: FC<AttachmentListItemProps> = ({ attachment }) => {
	const [t] = useTranslation();
	const youLabel = t('status.you', 'You');
	const unknownUserLabel = t('status.unknownUser', 'Unknown user');

	const sessionId = useStore(getUserId);
	const senderName = useStore((store) => getUserName(store, attachment.userId));

	const senderLabel = sessionId === attachment.userId ? youLabel : senderName || unknownUserLabel;
	const sizeLabel = getAttachmentSize(attachment.size);
	const subline = sizeLabel ? `${senderLabel} • ${sizeLabel}` : senderLabel;

	return (
		<Container
			data-testid={`mediaGalleryAttachment-${attachment.id}`}
			orientation="horizontal"
			mainAlignment="flex-start"
			crossAlignment="center"
			padding={{ horizontal: 'small', vertical: 'small' }}
			gap="0.5rem"
			minHeight="2.75rem"
		>
			<FileAvatar
				data-testid={`mediaGalleryAttachmentIcon-${attachment.id}`}
				icon={getPinAttachmentIcon(attachment.mimeType)}
				label={attachment.name}
				shape="square"
				background="gray3"
				color={getPinAttachmentColor(attachment.mimeType)}
			/>
			<Row takeAvailableSpace wrap="nowrap" mainAlignment="flex-start" crossAlignment="center">
				<Container
					orientation="vertical"
					mainAlignment="center"
					crossAlignment="flex-start"
					minWidth={0}
				>
					<Tooltip overflowTooltip label={attachment.name}>
						<Text size="small" overflow="ellipsis" lineHeight={1}>
							{attachment.name}
						</Text>
					</Tooltip>
					<Tooltip overflowTooltip label={subline}>
						<Text size="extrasmall" color="secondary" overflow="ellipsis" lineHeight={1.5}>
							{subline}
						</Text>
					</Tooltip>
				</Container>
			</Row>
		</Container>
	);
};
