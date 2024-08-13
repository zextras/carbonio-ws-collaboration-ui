/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { forEach, map } from 'lodash';

import ReactionChip from './ReactionChip';
import { getReactionFastenings } from '../../../../store/selectors/FasteningsSelectors';
import useStore from '../../../../store/Store';
import { TextMessage } from '../../../../types/store/MessageTypes';

type BubbleReactionsProps = {
	message: TextMessage;
};

const MessageReactionsList: FC<BubbleReactionsProps> = ({ message }) => {
	const reactions = useStore((store) =>
		getReactionFastenings(store, message.roomId, message.stanzaId)
	);

	const reactionGroup = useMemo(() => {
		const reactionGroup: { [reaction: string]: string[] } = {};
		forEach(reactions, (reaction) => {
			if (reaction.value !== undefined) {
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
			map(reactionGroup, (from, reaction) => (
				<ReactionChip key={reaction} reaction={reaction} from={from} />
			)),
		[reactionGroup]
	);

	return (
		<Container
			orientation="horizontal"
			mainAlignment="flex-start"
			padding={{ right: 'small' }}
			gap="0.5em"
		>
			{reactionsList}
		</Container>
	);
};

export default MessageReactionsList;
