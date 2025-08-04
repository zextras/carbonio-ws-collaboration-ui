/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useMemo } from 'react';

import styled from '@emotion/styled';
import { Container } from '@zextras/carbonio-design-system';
import { forEach, some } from 'lodash';

import SpeakingElement from './SpeakingElement';
import { getTalkingList } from '../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../store/Store';
import { STREAM_TYPE, TileData } from '../../../types/store/ActiveMeetingTypes';

const SpeakingListContainer = styled(Container)<{ $customStyle?: string }>`
	position: absolute;
	top: 1rem;
	right: 1rem;
	z-index: 40;
	${({ $customStyle }): string => $customStyle ?? ''}
`;

type WhoIsSpeakingProps = {
	visibleTiles: TileData[];
	customStyle?: string;
};

const WhoIsSpeaking = ({ visibleTiles, customStyle }: WhoIsSpeakingProps): ReactElement => {
	const talkingMap = useStore(getTalkingList);

	const speakingList = useMemo(() => {
		const list: ReactElement[] = [];
		forEach(talkingMap, (talkingId) => {
			const talkingUserIsVisible = some(
				visibleTiles,
				(tile) => tile.userId === talkingId && tile.type === STREAM_TYPE.VIDEO
			);
			if (!talkingUserIsVisible) {
				list.push(<SpeakingElement key={`${talkingId}-isTalking`} userId={talkingId} />);
			}
		});
		return list;
	}, [talkingMap, visibleTiles]);

	return (
		<SpeakingListContainer
			height="fit"
			width="fit"
			mainAlignment="flex-end"
			crossAlignment="flex-end"
			gap="0.5rem"
			$customStyle={customStyle}
		>
			{speakingList}
		</SpeakingListContainer>
	);
};

export default WhoIsSpeaking;
