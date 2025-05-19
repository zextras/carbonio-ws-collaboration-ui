/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { forEach, map, reverse } from 'lodash';

import ReactionChip from './ReactionChip';
import { useReactionFastenings } from '../../../../store/selectors/chatsRegistrySelectors/useReactionFastenings';

type BubbleReactionsProps = {
	roomId: string;
	stanzaId: string;
};

const MessageReactionsList: FC<BubbleReactionsProps> = ({ roomId, stanzaId }) => {
	const reactions = useReactionFastenings(roomId, stanzaId);

	const reactionGroup = useMemo(() => {
		const reactionGroup: { [reaction: string]: string[] } = {};
		forEach(reactions, (reaction) => {
			if (reaction.value) {
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
				map(reactionGroup, (from: string[], reaction: string) => (
					<ReactionChip
						key={reaction}
						reaction={reaction}
						from={from}
						roomId={roomId}
						stanzaId={stanzaId}
					/>
				))
			),
		[reactionGroup, roomId, stanzaId]
	);

	return (
		<Container
			orientation="horizontal"
			mainAlignment="flex-start"
			padding={{ right: 'small' }}
			gap="0.5em"
			width="fit"
			wrap="wrap"
		>
			{reactionsList}
		</Container>
	);
};

export default MessageReactionsList;
