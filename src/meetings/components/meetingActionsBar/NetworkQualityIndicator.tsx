/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';

import styled from '@emotion/styled';
import { Container, Icon, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { getNetworkStats } from '../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../store/Store';
import { NetworkQualityLevel } from '../../../types/store/ActiveMeetingTypes';

const ICON_MAP: Record<NetworkQualityLevel, string> = {
	[NetworkQualityLevel.GOOD]: 'Wifi',
	[NetworkQualityLevel.FAIR]: 'WifiOutline',
	[NetworkQualityLevel.POOR]: 'WifiOff',
	[NetworkQualityLevel.UNKNOWN]: 'WifiOutline'
};

const COLOR_MAP: Record<NetworkQualityLevel, string> = {
	[NetworkQualityLevel.GOOD]: 'success',
	[NetworkQualityLevel.FAIR]: 'warning',
	[NetworkQualityLevel.POOR]: 'error',
	[NetworkQualityLevel.UNKNOWN]: 'gray0'
};

const ClickableContainer = styled(Container)`
	cursor: default;
`;

const NetworkQualityIndicator: FC = () => {
	const [t] = useTranslation();
	const networkStats = useStore(getNetworkStats);
	const quality = networkStats?.quality ?? NetworkQualityLevel.UNKNOWN;

	const tooltipLabel = useMemo(() => {
		const labels: Record<NetworkQualityLevel, string> = {
			[NetworkQualityLevel.GOOD]: t('meeting.networkQuality.good', 'Network quality: Good'),
			[NetworkQualityLevel.FAIR]: t('meeting.networkQuality.fair', 'Network quality: Fair'),
			[NetworkQualityLevel.POOR]: t('meeting.networkQuality.poor', 'Network quality: Poor'),
			[NetworkQualityLevel.UNKNOWN]: t(
				'meeting.networkQuality.unknown',
				'Network quality: Checking\u2026'
			)
		};
		return labels[quality];
	}, [quality, t]);

	return (
		<Tooltip label={tooltipLabel} placement="top">
			<ClickableContainer
				orientation="horizontal"
				width="fit"
				height="fit"
				crossAlignment="center"
				data-testid="network_quality_indicator"
			>
				<Icon icon={ICON_MAP[quality]} color={COLOR_MAP[quality]} size="medium" />
			</ClickableContainer>
		</Tooltip>
	);
};

export default NetworkQualityIndicator;
