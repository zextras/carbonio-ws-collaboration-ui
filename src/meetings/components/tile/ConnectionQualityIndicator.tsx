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
	rttScore,
	uplinkLossScore
} from '../../../network/webRTC/connectionQualityScore';
import {
	getParticipantAbsoluteQuality,
	getParticipantConnectionQuality
} from '../../../store/selectors/MeetingSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { AbsoluteScoreDetail } from '../../../types/store/ActiveMeetingTypes';

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

const ConnectionQualityIndicator: FC<{
	meetingId?: string;
	userId?: string;
	variant?: 'relative' | 'absolute';
}> = ({ meetingId, userId, variant = 'relative' }) => {
	const [t] = useTranslation();
	const theme = useTheme();
	const quality = useStore((state) =>
		variant === 'absolute'
			? getParticipantAbsoluteQuality(state, meetingId, userId)
			: getParticipantConnectionQuality(state, meetingId, userId)
	);
	const isOwn = useStore((store) => userId != null && userId === getUserId(store));
	const ownDetail = useStore((store) =>
		isOwn ? store.activeMeeting?.connectionScoreDetail : undefined
	);
	const absoluteDetail = useStore((store): AbsoluteScoreDetail | undefined =>
		isOwn ? store.activeMeeting?.connectionAbsoluteDetail : undefined
	);

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
		if (!isOwn) return tooltipLabel;

		if (variant === 'absolute') {
			if (absoluteDetail == null) return tooltipLabel;
			const fmtPenalty = (p: number | null): string => (p != null ? `-${p.toFixed(1)}` : '—');
			const lines = [
				tooltipLabel,
				`Uplink: ${fmtPenalty(absoluteDetail.uplinkPenalty)}`,
				`Downlink: ${fmtPenalty(absoluteDetail.downlinkPenalty)}`,
				absoluteDetail.absoluteScore != null
					? `Score: ${absoluteDetail.absoluteScore.toFixed(1)}/10`
					: 'Score: —'
			];
			return <div style={{ whiteSpace: 'pre-line' }}>{lines.join('\n')}</div>;
		}

		// variant='relative'
		if (ownDetail == null) return tooltipLabel;
		const fmt = (v: number, unit: 'ms' | '%'): string =>
			unit === 'ms' ? `${Math.round(v)} ms` : `${(v * 100).toFixed(1)}%`;
		const line = (
			name: string,
			raw: number | undefined,
			score: (v: number) => number,
			unit: 'ms' | '%'
		): string =>
			raw !== undefined ? `${name}: ${score(raw).toFixed(1)}/10 (${fmt(raw, unit)})` : `${name}: —`;
		const lines = [
			tooltipLabel,
			line('RTT', ownDetail.rttMs, rttScore, 'ms'),
			line('Jitter', ownDetail.jitterMs, jitterScore, 'ms'),
			line('Uplink loss', ownDetail.lossUp, uplinkLossScore, '%'),
			absoluteDetail?.relativeScore != null
				? `Score: ${absoluteDetail.relativeScore.toFixed(1)}/10`
				: 'Score: —'
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
