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
	animation: bounceIn 0.4s ease-in-out;

	@keyframes bounceIn {
		0% {
			transform: scale(0.5);
			opacity: 0;
		}
		60% {
			transform: scale(1.1);
			opacity: 1;
		}
		100% {
			transform: scale(1);
		}
	}
`;

const CustomAvatar = styled(Avatar)<{ $numberBadge: boolean }>`
	> p {
		font-size: 0.5rem;
		${({ $numberBadge, theme }): string | false =>
			$numberBadge && `font-size: 0.75rem; color: ${theme.palette.text.regular};`}
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

	const colorToShow = useMemo(
		() => (size(from) === 1 ? avatarColor : 'gray4'),
		[from, avatarColor]
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
					background={colorToShow}
					$numberBadge={size(from) > 1}
				/>
			</CustomContainer>
		</Tooltip>
	);
};

export default ReactionChip;
