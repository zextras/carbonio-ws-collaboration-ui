/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Accordion } from '@zextras/carbonio-design-system';
import React, { FC, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import ParticipantsList from './ParticipantsList';
import { getParticipantsAccordionStatus } from '../../../../store/selectors/ActiveConversationsSelectors';
import { getNumbersOfRoomMembers } from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';

const CustomAccordion = styled(Accordion)`
	-webkit-user-select: none;
	user-select: none;
`;

type ParticipantsAccordionProps = {
	roomId: string;
};

export const ParticipantsAccordion: FC<ParticipantsAccordionProps> = ({ roomId }) => {
	const [t] = useTranslation();
	const oneMemberAccordionTitle = t('participantsList.oneMemberAccordionTitle', 'One member');
	const moreMembersAccordionTitle = t('participantsList.moreMembersAccordionTitle', `members`);
	const numberOfMembers: number = useStore((state) => getNumbersOfRoomMembers(state, roomId));
	const accordionStatus: boolean = useStore((state) =>
		getParticipantsAccordionStatus(state, roomId)
	);
	const setParticipantsAccordionStatus = useStore((state) => state.setParticipantsAccordionStatus);

	const toggleAccordionStatus = useCallback(
		() => setParticipantsAccordionStatus(roomId, !accordionStatus),
		[accordionStatus, roomId, setParticipantsAccordionStatus]
	);

	const participantsAccordionTitle = useMemo(() => {
		if (numberOfMembers === 1) {
			return oneMemberAccordionTitle;
		}
		return `${numberOfMembers} ${moreMembersAccordionTitle}`;
	}, [moreMembersAccordionTitle, numberOfMembers, oneMemberAccordionTitle]);

	const infoDetails = useMemo(() => {
		const arrayOfActions = [
			{
				id: '1',
				disableHover: true,
				background: 'gray6',
				label: 'title',
				CustomComponent: () => <ParticipantsList roomId={roomId} />
			}
		];
		return [
			{
				id: 'ParticipantAccordion',
				label: participantsAccordionTitle,
				open: accordionStatus,
				items: arrayOfActions,
				onOpen: toggleAccordionStatus,
				onClose: toggleAccordionStatus
			}
		];
	}, [accordionStatus, participantsAccordionTitle, roomId, toggleAccordionStatus]);

	return (
		<CustomAccordion data-testid="participantAccordion" items={infoDetails} borderRadius="none" />
	);
};
