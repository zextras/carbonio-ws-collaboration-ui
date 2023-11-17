/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useRef, useMemo, useCallback, useEffect } from 'react';

import { Container, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import TilesBar from './TilesBar';
import useContainerDimensions from '../../../hooks/useContainerDimensions';
import { MeetingRoutesParams } from '../../../hooks/useRouting';
import useTilesOrder from '../../../hooks/useTilesOrder';
import {
	getMeetingCarouselVisibility,
	getVideoScreenIn
} from '../../../store/selectors/ActiveMeetingSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { STREAM_TYPE, SubscriptionMap } from '../../../types/store/ActiveMeetingTypes';
import { mapToSubscriptionMap } from '../../../utils/MeetingsUtils';
import Tile from '../Tile';
import WhoIsSpeaking from '../WhoIsSpeaking/WhoIsSpeaking';

const CustomContainer = styled(Container)`
	overflow: hidden;
`;

const CinemaContainer = styled(Container)`
	min-width: 18.75rem;
	padding: 3.25rem;
`;

const CarouselContainer = styled(Container)`
	position: relative;
`;

const ChangeSidebarStatusButton = styled.div`
	position: absolute;
	left: -2.25rem;
	top: calc(50% - (15.09375rem / 2));
	z-index: 39;
`;

const SidebarIconButton = styled(IconButton)`
	width: 2.25rem;
	height: 15rem;
`;

const CinemaMode = (): ReactElement => {
	const { meetingId }: MeetingRoutesParams = useParams();

	const carouselIsVisible = useStore((store) => getMeetingCarouselVisibility(store, meetingId));
	const setIsCarouselVisible = useStore((store) => store.setIsCarouseVisible);
	const videoScreenIn = useStore((store) => getVideoScreenIn(store, meetingId));
	const myUserId = useStore(getUserId);

	const [t] = useTranslation();
	const collapseCarouselLabel = t(
		'meeting.collapseParticipantsMeetingTooltip',
		'Collapse participants list'
	);
	const expandCarouselLabel = t(
		'meeting.expandParticipantsListTooltip',
		'Expand participants list'
	);

	const cinemaModeRef = useRef<null | HTMLDivElement>(null);

	const { centralTile, carouselTiles } = useTilesOrder(meetingId);
	const cinemaModeDimensions = useContainerDimensions(cinemaModeRef);

	const centralTileWidth = useMemo(() => {
		const tileHeight = (cinemaModeDimensions.width / 16) * 9;
		let tileWidth;
		tileWidth = cinemaModeDimensions.width;
		if (tileHeight >= cinemaModeDimensions.height) {
			tileWidth = (cinemaModeDimensions.height / 9) * 16;
		}
		return `${tileWidth / 16}rem`;
	}, [cinemaModeDimensions]);

	const toggleCarousel = useCallback(() => {
		setIsCarouselVisible(meetingId, !carouselIsVisible);
	}, [carouselIsVisible, meetingId, setIsCarouselVisible]);

	useEffect(() => {
		if (!carouselIsVisible && myUserId !== centralTile.userId) {
			const tilesDataToSubscribe: SubscriptionMap = {};
			mapToSubscriptionMap(tilesDataToSubscribe, centralTile.userId, centralTile.type);
			videoScreenIn?.subscriptionManager.updateSubscription(tilesDataToSubscribe);
		}
	}, [carouselIsVisible, centralTile, myUserId, videoScreenIn]);

	return (
		<Container orientation="horizontal">
			<CustomContainer ref={cinemaModeRef}>
				<WhoIsSpeaking centralTile={centralTile} />
				<CinemaContainer data-testid="cinemaModeView" width={centralTileWidth} height="fit">
					<Tile
						userId={centralTile?.userId}
						meetingId={meetingId}
						isScreenShare={centralTile?.type === STREAM_TYPE.SCREEN}
					/>
				</CinemaContainer>
			</CustomContainer>
			<CarouselContainer
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
				{carouselIsVisible && <TilesBar carouselTiles={carouselTiles} centralTile={centralTile} />}
			</CarouselContainer>
		</Container>
	);
};

export default CinemaMode;
