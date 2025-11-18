/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { MouseEventHandler, ReactElement } from 'react';

import styled from '@emotion/styled';
import {
	Avatar,
	Button,
	Checkbox,
	Container,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import useAvatarUtilities from '../../../hooks/useAvatarUtilities';
import { ContactInfo } from '../../../types/network/soap/searchUsersByFeatureRequest';

type ListParticipantProps = {
	item: ContactInfo;
	selected: boolean;
	onClickCb: (item: ContactInfo) => MouseEventHandler<HTMLDivElement> | undefined;
	canBeModerator?: boolean;
	isOwner?: boolean;
	updateOwnership?: (id: string) => void;
	isDisabled?: boolean;
};

const SelectableText = styled(Text)`
	user-select: text;
`;

const ListParticipant = ({
	item,
	selected,
	onClickCb,
	isOwner = false,
	updateOwnership,
	canBeModerator = false,
	isDisabled
}: ListParticipantProps): ReactElement => {
	const [t] = useTranslation();
	const removeToAddNewOneLabel = t(
		'tooltip.removeToAddNewOne',
		'Remove someone to add new members'
	);
	const demoteModeratorLabel: string = t('tooltip.demoteModerator', 'Demote moderator');
	const promoteModeratorLabel: string = t('tooltip.promoteModerator', 'Promote to moderator');

	const { avatarPicture } = useAvatarUtilities(item.id);

	return (
		<Tooltip disabled={!isDisabled} label={removeToAddNewOneLabel}>
			<Container orientation="horizontal">
				<Container
					data-testid={`chip-${item.email}`}
					onClick={onClickCb(item)}
					orientation="horizontal"
					mainAlignment="flex-start"
					width="fill"
					padding={{ vertical: 'small' }}
				>
					<Row>
						<Checkbox
							data-testid={`checkbox-chip-${item.email}`}
							value={selected}
							disabled={!selected && isDisabled}
							iconColor={selected ? 'primary' : 'gray0'}
						/>
						<Padding horizontal="small">
							<Avatar label={item.displayName} picture={avatarPicture} />
						</Padding>
						<Container crossAlignment="flex-start" width="fit">
							<Text size="small">{item.displayName}</Text>
							<Padding top="extrasmall" />
							<SelectableText
								data-testid={`${item.id}-emailSelectable`}
								size="extrasmall"
								color="gray1"
							>
								{item.email}
							</SelectableText>
						</Container>
					</Row>
				</Container>
				{canBeModerator && (
					<Container width="fit" padding={{ right: 'small' }}>
						<Tooltip label={isOwner ? demoteModeratorLabel : promoteModeratorLabel}>
							<Button
								icon={isOwner ? 'Crown' : 'CrownOutline'}
								type="ghost"
								color={isOwner ? 'primary' : 'gray1'}
								size="large"
								disabled={!selected}
								onClick={() => updateOwnership?.(item.id)}
							/>
						</Tooltip>
					</Container>
				)}
			</Container>
		</Tooltip>
	);
};

export default ListParticipant;
