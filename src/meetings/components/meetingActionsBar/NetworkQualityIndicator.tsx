/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo, useState } from 'react';

import styled from '@emotion/styled';
import { Container, Icon, Tooltip, Snackbar } from '@zextras/carbonio-design-system';
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
	const rtt = networkStats?.rtt !== undefined ? `${networkStats.rtt.toFixed(1)} ms` : 'N/A';
	const loss =
		networkStats?.fractionLost !== undefined
			? `${(networkStats.fractionLost * 100).toFixed(1)}%`
			: 'N/A';
	const stats = `rtt: ${rtt}, loss: ${loss}`;

	const [showNetworkPoorSnackbar, setShowNetworkPoorSnackbar] = useState(false);
	const [prevQuality, setPrevQuality] = useState<NetworkQualityLevel>(quality);

	// Reset snackbar if quality improves
	if (quality !== NetworkQualityLevel.POOR && prevQuality === NetworkQualityLevel.POOR) {
		setShowNetworkPoorSnackbar(false);
	}
	if (quality !== prevQuality) {
		setPrevQuality(quality);
	}
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
		return `${labels[quality]}\n\n(${stats})`;
	}, [quality, t, stats]);

	// Show connection snackbar if quality is poor
	if (quality === NetworkQualityLevel.POOR) {
		if (!showNetworkPoorSnackbar && prevQuality !== NetworkQualityLevel.POOR) {
			setShowNetworkPoorSnackbar(true);
		}
		return (
			<>
				<Snackbar
					label={t(
						'meeting.networkQuality.poorConnection',
						'Your network connection is poor, which may affect the meeting experience.'
					)}
					severity="warning"
					data-testid="network_quality_snackbar"
					style={{ maxWidth: 'none' }}
					open={showNetworkPoorSnackbar}
					onClose={(): void => setShowNetworkPoorSnackbar(false)}
				/>
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
			</>
		);
	}

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
