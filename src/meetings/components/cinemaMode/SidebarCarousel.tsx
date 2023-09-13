/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import React, { ReactElement, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import StreamsBar from './StreamsBar';
import { getMeetingCarouselVisibility } from '../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../store/Store';

const SidebarIconButton = styled(IconButton)`
	height: 15rem;
	width: 2.25rem;
`;

const SidebarCarousel = (): ReactElement => {
	const { meetingId }: Record<string, string> = useParams();

	const isCarouselVisible = useStore((store) => getMeetingCarouselVisibility(store, meetingId));
	const setIsCarouselVisible = useStore((store) => store.setIsCarouseVisible);

	const toggleCarousel = useCallback(() => {
		setIsCarouselVisible(meetingId, !isCarouselVisible);
	}, [isCarouselVisible, meetingId, setIsCarouselVisible]);

	return (
		<Container orientation="horizontal" width="fit" height="fill">
			<Container padding={{ horizontal: 'large' }}>
				<Tooltip label={'needed to add'}>
					<SidebarIconButton
						onClick={toggleCarousel}
						iconColor="gray6"
						backgroundColor="text"
						icon={isCarouselVisible ? 'ChevronRightOutline' : 'ChevronLeftOutline'}
						size="large"
					/>
				</Tooltip>
			</Container>
			{isCarouselVisible && <StreamsBar />}
		</Container>
	);
};

export default SidebarCarousel;
