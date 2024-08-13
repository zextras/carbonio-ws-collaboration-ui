/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useMemo } from 'react';

import { Avatar, Container, Padding, Tooltip } from '@zextras/carbonio-design-system';
import { map, size } from 'lodash';
import styled from 'styled-components';

import useAvatarUtilities from '../../../../hooks/useAvatarUtilities';
import { getUserName } from '../../../../store/selectors/UsersSelectors';
import useStore from '../../../../store/Store';

const CustomContainer = styled(Container)`
	border-radius: 1.25rem;
	font-size: 0.9rem;
	cursor: default;
`;

const CustomAvatar = styled(Avatar)`
	> p {
		font-size: 0.5rem;
	}
`;

type ReactionChipProps = {
	reaction: string | undefined;
	from: string[];
};

const ReactionChip = ({ reaction, from }: ReactionChipProps): ReactElement => {
	const { avatarColor, avatarPicture, avatarIcon } = useAvatarUtilities(from[0]);

	const tooltipLabel = useMemo(
		() => map(from, (from) => getUserName(useStore.getState(), from)).join(', '),
		[from]
	);

	const pictureToShow = useMemo(
		() => (size(from) === 1 ? avatarPicture : undefined),
		[from, avatarPicture]
	);

	const avatarLabel = useMemo(
		() => (size(from) === 1 ? getUserName(useStore.getState(), from[0]) : size(from).toString()),
		[from]
	);

	return (
		<Tooltip label={tooltipLabel}>
			<CustomContainer
				background="gray4"
				width="fit-content"
				minHeight="1.5rem"
				maxHeight="1.5rem"
				padding="0.25rem 0.25rem 0.25rem 0.3rem"
				orientation="horizontal"
				gap="0.25rem"
			>
				<Padding bottom="0.1rem">{reaction}</Padding>
				<CustomAvatar
					size="small"
					label={avatarLabel}
					shape="round"
					picture={pictureToShow}
					icon={avatarIcon}
					background={avatarColor}
				/>
			</CustomContainer>
		</Tooltip>
	);
};

export default ReactionChip;
