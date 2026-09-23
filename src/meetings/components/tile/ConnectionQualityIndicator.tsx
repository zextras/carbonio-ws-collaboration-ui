/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import styled from '@emotion/styled';
import { Icon, Row, Tooltip, useTheme } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import {
	ConnectionQuality,
	isUnstableQuality,
	jitterScore,
	K_DOWN,
	K_UP,
	round1,
	rttScore,
	uplinkLossScore
} from '../../../network/webRTC/connectionQualityScore';
import { getParticipantNetworkQuality } from '../../../store/selectors/MeetingSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';

const CustomContainer = styled(Row)`
	border-radius: 0.25rem;
`;

const BarsContainer = styled.div`
	display: flex;
	align-items: flex-end;
	justify-content: center;
	gap: 0.0625rem;
	width: 1rem;
	height: 1rem;
`;

const Bar = styled.div<{ $color: string; $height: string }>`
	width: 0.125rem;
	height: ${({ $height }): string => $height};
	background-color: ${({ $color }): string => $color};
	border-radius: 0.0625rem;
`;

// 5 bar heights, shortest to tallest, sized to a 1rem square so the badge matches a medium icon
const BAR_HEIGHTS = ['0.25rem', '0.4375rem', '0.625rem', '0.8125rem', '1rem'] as const;

// Filled bar count per level (0-5). 'lost' renders the WifiOff icon instead of bars.
const LEVEL_BARS: Record<Exclude<ConnectionQuality, 'lost'>, number> = {
	terrible: 1,
	poor: 2,
	medium: 3,
	high: 4,
	optimal: 5
};

const TIER_NAMES = ['LOW', 'MED', 'HIGH'] as const;

const ConnectionQualityIndicator: FC<{
	meetingId?: string;
	userId?: string;
}> = ({ meetingId, userId }) => {
	const [t] = useTranslation();
	const theme = useTheme();
	const quality = useStore((state) => getParticipantNetworkQuality(state, meetingId, userId));
	const isOwn = useStore((store) => userId != null && userId === getUserId(store));
	const ownDetail = useStore((store) =>
		isOwn ? store.activeMeeting?.connectionScoreDetail : undefined
	);
	const tierWeightedDetail = useStore((store) =>
		isOwn ? store.activeMeeting?.connectionTierWeightedDetail : undefined
	);
	const maxUplinkTier = useStore((store) => {
		if (!meetingId || !userId) return undefined;
		const { activeMeeting } = store;
		if (!activeMeeting || activeMeeting.meetingId !== meetingId) return undefined;
		return activeMeeting.connectionQuality[userId]?.maxUplinkTier;
	});

	// Own tile: always visible; remote tiles: hidden unless link is unstable.
	if (!quality) return null;
	if (!isOwn && !isUnstableQuality(quality)) return null;

	const { error, warning, success, gray6 } = theme.palette;

	const barColor = ((): string => {
		switch (quality) {
			case 'poor':
			case 'terrible':
				return error.regular;
			case 'medium':
				return warning.regular;
			default:
				return success.regular;
		}
	})();
	const filled = quality === 'lost' ? 0 : LEVEL_BARS[quality];
	const barColors = BAR_HEIGHTS.map((_, index) => (index < filled ? barColor : gray6.regular));

	const tooltipLabel = ((): string => {
		switch (quality) {
			case 'optimal':
				return t('meeting.connectionQuality.optimal', 'Optimal connection');
			case 'high':
				return t('meeting.connectionQuality.high', 'Good connection');
			case 'medium':
				return t('meeting.connectionQuality.medium', 'Fair connection');
			case 'poor':
				return t('meeting.connectionQuality.poor', 'Poor connection');
			case 'terrible':
				return t('meeting.connectionQuality.terrible', 'Terrible connection');
			default:
				return t('meeting.connectionQuality.lost', 'Connection lost');
		}
	})();

	// An unmeasurable signal (undefined) renders '—' and does not drag the vote.
	const label = ((): string | React.ReactElement => {
		if (!isOwn) {
			// Lean tooltip for others: quality label + uplink tier if known
			const tierLabel =
				maxUplinkTier != null ? `Uplink: ${TIER_NAMES[maxUplinkTier] ?? maxUplinkTier}` : undefined;
			if (!tierLabel) return tooltipLabel;
			return <div style={{ whiteSpace: 'pre-line' }}>{[tooltipLabel, tierLabel].join('\n')}</div>;
		}

		// Self: merged tooltip
		const fmt = (v: number, unit: 'ms' | '%'): string =>
			unit === 'ms' ? `${Math.round(v)} ms` : `${(v * 100).toFixed(1)}%`;
		const line = (
			name: string,
			raw: number | undefined,
			score: (v: number) => number,
			unit: 'ms' | '%'
		): string =>
			raw !== undefined ? `${name}: ${score(raw).toFixed(1)}/10 (${fmt(raw, unit)})` : `${name}: —`;

		const rttLine = line('RTT', ownDetail?.rttMs, rttScore, 'ms');
		const jitterLine = line('Jitter', ownDetail?.jitterMs, jitterScore, 'ms');
		const lossLine = line('Uplink loss', ownDetail?.lossUp, uplinkLossScore, '%');

		// Tier difference: how many tiers the network forced below the ceiling, as 0 / -1 / -2 (never -0).
		const diff = (shortfall: number): string => (shortfall === 0 ? '0' : `-${shortfall}`);

		const uplinkDiffLine =
			tierWeightedDetail?.uplinkPenalty == null
				? 'Uplink tier difference: -'
				: `Uplink tier difference: ${diff(round1(tierWeightedDetail.uplinkPenalty / K_UP))}`;

		const downlinkDiffLine =
			tierWeightedDetail?.downlinkPenalty == null
				? 'Downlink avg tier difference: -'
				: `Downlink avg tier difference: ${diff(round1(tierWeightedDetail.downlinkPenalty / K_DOWN))}`;

		// Score line
		const scoreLine =
			tierWeightedDetail?.tierWeightedNetworkScore != null
				? `Score: ${tierWeightedDetail.tierWeightedNetworkScore.toFixed(1)}/10`
				: 'Score: —';

		const lines = [
			tooltipLabel,
			rttLine,
			jitterLine,
			lossLine,
			uplinkDiffLine,
			downlinkDiffLine,
			scoreLine
		];
		return <div style={{ whiteSpace: 'pre-line' }}>{lines.join('\n')}</div>;
	})();

	return (
		<Tooltip label={label}>
			<CustomContainer background="gray0" height="fit" width="fit" padding="0.5rem">
				{quality === 'lost' ? (
					<Icon icon="WifiOff" color="error" size="medium" />
				) : (
					<BarsContainer>
						{BAR_HEIGHTS.map((height, index) => (
							<Bar key={height} $color={barColors[index]} $height={height} />
						))}
					</BarsContainer>
				)}
			</CustomContainer>
		</Tooltip>
	);
};

export default ConnectionQualityIndicator;
