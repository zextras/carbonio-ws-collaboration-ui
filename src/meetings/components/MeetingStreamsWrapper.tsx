/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import React, { ReactElement, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import MeetingActions from './MeetingActions';
import { getSidebarStatus } from '../../store/selectors/MeetingSelectors';
import { getCustomLogo } from '../../store/selectors/SessionSelectors';
import useStore from '../../store/Store';
import defaultLogo from '../assets/Logo.png';

const SidebarIconButton = styled(IconButton)`
	height: 240px;
`;

const BoxContainer = styled(Container)`
	position: relative;
	overflow-y: hidden;
`;

const LogoApp = styled(Container)`
	position: absolute;
	top: 1.25rem;
	left: 1rem;
	background-size: contain;
	height: 1.3125rem;
	background-repeat: no-repeat;
	background-image: url(${({ customLogo }): string => customLogo || defaultLogo});
	width: 9.625rem;
`;

const MeetingStreamsWrapper = (): ReactElement => {
	const [t] = useTranslation();
	const collapseSidebarLabel = t('tooltip.collapseSidebar', 'Collapse sidebar');
	const expandSidebarLabel = t('tooltip.expandSidebar', 'Expand sidebar');

	const { meetingId }: Record<string, string> = useParams();
	const sidebarStatus: boolean | undefined = useStore((store) =>
		getSidebarStatus(store, meetingId)
	);
	const customLogo = useStore(getCustomLogo);
	const toggleSidebarStatus = useStore((store) => store.toggleSidebarStatus);

	const streamsWrapperRef = useRef<HTMLDivElement>(null);

	const toggleSidebar = useCallback(
		() => toggleSidebarStatus(meetingId, !sidebarStatus),
		[toggleSidebarStatus, meetingId, sidebarStatus]
	);

	return (
		<BoxContainer
			ref={streamsWrapperRef}
			background="gray0"
			width={sidebarStatus ? 'fill' : '100%'}
			borderRadius="none"
			padding={{ all: 'large' }}
			crossAlignment="flex-start"
		>
			<LogoApp customLogo={customLogo} />
			<Tooltip label={sidebarStatus ? collapseSidebarLabel : expandSidebarLabel}>
				<SidebarIconButton
					iconColor="gray6"
					backgroundColor="text"
					icon={sidebarStatus ? 'ChevronLeftOutline' : 'ChevronRightOutline'}
					onClick={toggleSidebar}
					size="large"
				/>
			</Tooltip>
			<MeetingActions streamsWrapperRef={streamsWrapperRef} />
		</BoxContainer>
	);
};

export default MeetingStreamsWrapper;
