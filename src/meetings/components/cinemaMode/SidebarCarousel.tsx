/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import React, { ReactElement, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import TilesBar from './TilesBar';
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import { getMeetingCarouselVisibility } from '../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../store/Store';

const SidebarContainer = styled(Container)`
	position: relative;
`;

const ChangeSidebarStatusButton = styled.div`
	position: absolute;
	left: calc(-1rem - 2.25rem);
	top: calc(50% - (15.09375rem / 2));
	z-index: 999;
`;

const SidebarIconButton = styled(IconButton)`
	width: 2.25rem;
	height: 15rem;
`;

const SidebarCarousel = (): ReactElement => {
	const { meetingId }: MeetingRoutesParams = useParams();

	const [t] = useTranslation();
	const collapseCarouselLabel = t(
		'meeting.collapseParticipantsMeetingTooltip',
		'Collapse participants list'
	);
	const expandCarouselLabel = t(
		'meeting.expandParticipantsListTooltip',
		'Expand participants list'
	);

	const carouselIsVisible = useStore((store) => getMeetingCarouselVisibility(store, meetingId));
	const setIsCarouselVisible = useStore((store) => store.setIsCarouseVisible);

	const toggleCarousel = useCallback(() => {
		setIsCarouselVisible(meetingId, !carouselIsVisible);
	}, [carouselIsVisible, meetingId, setIsCarouselVisible]);

	return (
		<SidebarContainer
			background="gray0"
			width={carouselIsVisible ? '35%' : '0'}
			minWidth={carouselIsVisible ? '10.375rem' : '0'}
			maxWidth="18.75rem"
		>
			<ChangeSidebarStatusButton>
				<Tooltip
					label={carouselIsVisible ? collapseCarouselLabel : expandCarouselLabel}
					placement="left"
				>
					<SidebarIconButton
						iconColor="gray6"
						backgroundColor="text"
						icon={carouselIsVisible ? 'ChevronRightOutline' : 'ChevronLeftOutline'}
						onClick={toggleCarousel}
						size="large"
					/>
				</Tooltip>
			</ChangeSidebarStatusButton>
			{carouselIsVisible && <TilesBar />}
		</SidebarContainer>
	);
};

export default SidebarCarousel;
