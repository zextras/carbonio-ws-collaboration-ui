/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useRef, useMemo, useCallback, useEffect, useContext } from 'react';

import styled from '@emotion/styled';
import { Button, Container, Tooltip } from '@zextras/carbonio-design-system';
import { concat } from 'lodash';
import { useTranslation } from 'react-i18next';

import TilesBar from './TilesBar';
import useContainerDimensions from '../../../hooks/useContainerDimensions';
import useTilesOrder from '../../../hooks/useTilesOrder';
import { getMeetingCarouselVisibility } from '../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../store/Store';
import { STREAM_TYPE, Subscription } from '../../../types/store/ActiveMeetingTypes';
import { calcScaleDivisor } from '../../../utils/styleUtils';
import { RouterContext } from '../../contexts/routerContext';
import { MeetingViewProps } from '../../views/MeetingSkeleton';
import Tile from '../tile/Tile';
import WhoIsSpeaking from '../whoIsSpeaking/WhoIsSpeaking';

const CustomContainer = styled(Container)`
	overflow: hidden;
	position: relative;
`;

const CinemaContainer = styled(Container)`
	min-width: 18.75rem;
	padding: 3.25rem;
`;

const CarouselContainer = styled(Container)`
	position: relative;
	transition:
		width 0.3s ease,
		min-width 0.3s ease;
`;

const ChangeSidebarStatusButton = styled.div`
	position: absolute;
	left: -2.25rem;
	top: calc(50% - (15.09375rem / 2));
	z-index: 39;
`;

const SidebarButton = styled(Button)`
	width: 2.25rem;
	height: 15rem;
`;

const CinemaMode = ({ children }: MeetingViewProps): ReactElement => {
	const { meetingId } = useContext(RouterContext);

	const carouselIsVisible = useStore(getMeetingCarouselVisibility);
	const setIsCarouselVisible = useStore((store) => store.setIsCarouseVisible);
	const setUpdateSubscription = useStore((store) => store.setUpdateSubscription);

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

	const { centralTile, carouselTiles } = useTilesOrder(meetingId!);
	const cinemaModeDimensions = useContainerDimensions(cinemaModeRef);

	const centralTileWidth = useMemo(() => {
		const tileHeight = (cinemaModeDimensions.width / 16) * 9;
		let tileWidth;
		tileWidth = cinemaModeDimensions.width;
		if (tileHeight >= cinemaModeDimensions.height) {
			tileWidth = (cinemaModeDimensions.height / 9) * 16;
		}
		return `${tileWidth / calcScaleDivisor()}rem`;
	}, [cinemaModeDimensions]);

	const toggleCarousel = useCallback(() => {
		setIsCarouselVisible(!carouselIsVisible);
	}, [carouselIsVisible, setIsCarouselVisible]);

	useEffect(() => {
		if (!carouselIsVisible) {
			const subscription: Subscription = { userId: centralTile.userId, type: centralTile.type };
			setUpdateSubscription(meetingId!, [subscription]);
		}
	}, [carouselIsVisible, centralTile, meetingId, setUpdateSubscription]);

	return (
		<Container orientation="horizontal">
			<CustomContainer ref={cinemaModeRef} padding={{ vertical: '3.25rem' }}>
				{!carouselIsVisible && <WhoIsSpeaking visibleTiles={[centralTile]} />}
				<WhoIsSpeaking visibleTiles={concat(carouselTiles, centralTile)} />
				<CinemaContainer data-testid="cinemaModeView" width={centralTileWidth} height="fit">
					<Tile
						userId={centralTile?.userId}
						meetingId={meetingId}
						isScreenShare={centralTile?.type === STREAM_TYPE.SCREEN}
					/>
				</CinemaContainer>
				{children}
			</CustomContainer>
			<CarouselContainer
				background={'gray0'}
				width={carouselIsVisible ? '35%' : '0'}
				minWidth={carouselIsVisible ? '10.375rem' : '0'}
				maxWidth="18.75rem"
			>
				<ChangeSidebarStatusButton>
					<Tooltip
						label={carouselIsVisible ? collapseCarouselLabel : expandCarouselLabel}
						placement="left"
					>
						<SidebarButton
							labelColor="gray6"
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
