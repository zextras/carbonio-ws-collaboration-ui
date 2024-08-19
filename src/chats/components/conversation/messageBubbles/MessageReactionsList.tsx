/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { forEach, map, reverse } from 'lodash';
import styled from 'styled-components';

import ReactionChip from './ReactionChip';
import { getReactionFastenings } from '../../../../store/selectors/FasteningsSelectors';
import useStore from '../../../../store/Store';

type BubbleReactionsProps = {
	roomId: string;
	stanzaId: string;
};

const ReactionChipContainer = styled(Container)`
	flex-wrap: wrap;
`;

const MessageReactionsList: FC<BubbleReactionsProps> = ({ roomId, stanzaId }) => {
	const reactions = useStore((store) => getReactionFastenings(store, roomId, stanzaId));

	const reactionGroup = useMemo(() => {
		const reactionGroup: { [reaction: string]: string[] } = {};
		forEach(reactions, (reaction) => {
			if (reaction.value !== undefined && reaction.value !== '') {
				if (!reactionGroup[reaction.value]) {
					reactionGroup[reaction.value] = [];
				}
				reactionGroup[reaction.value].push(reaction.from);
			}
		});
		return reactionGroup;
	}, [reactions]);

	const reactionsList = useMemo(
		() =>
			reverse(
				map(reactionGroup, (from, reaction) => (
					<ReactionChip key={reaction} reaction={reaction} from={from} />
				))
			),
		[reactionGroup]
	);

	return (
		<ReactionChipContainer
			orientation="horizontal"
			mainAlignment="flex-start"
			padding={{ right: 'small' }}
			gap="0.5em"
			width="fit"
		>
			{reactionsList}
		</ReactionChipContainer>
	);
};

export default MessageReactionsList;
