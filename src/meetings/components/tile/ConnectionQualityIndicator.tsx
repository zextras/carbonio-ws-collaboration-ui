/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import styled from '@emotion/styled';
import { Icon, Row, Tooltip, useTheme } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { isUnstableQuality } from '../../../network/webRTC/connectionQualityScore';
import { getParticipantConnectionQuality } from '../../../store/selectors/MeetingSelectors';
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

const ConnectionQualityIndicator: FC<{ meetingId?: string; userId?: string }> = ({
	meetingId,
	userId
}) => {
	const [t] = useTranslation();
	const theme = useTheme();
	const quality = useStore((state) => getParticipantConnectionQuality(state, meetingId, userId));
	const ownDetail = useStore((store) =>
		userId != null && userId === getUserId(store)
			? store.activeMeeting?.connectionScoreDetail
			: undefined
	);

	// Only surface the badge on an UNSTABLE link (quality below 'medium'); a stable link shows nothing so
	// the tiles stay clean until the connection is actually in trouble.
	if (!quality || !isUnstableQuality(quality)) return null;

	const { error, gray6 } = theme.palette;

	// After the isUnstableQuality guard above, quality is only 'poor' | 'terrible' | 'lost' — the higher
	// levels are unreachable here. 'lost' renders the WifiOff path (not bars), so it falls to the default.
	const barColors = ((): [string, string, string, string, string] => {
		switch (quality) {
			case 'poor':
				return [error.regular, error.regular, gray6.regular, gray6.regular, gray6.regular];
			case 'terrible':
				return [error.regular, gray6.regular, gray6.regular, gray6.regular, gray6.regular];
			default:
				return [gray6.regular, gray6.regular, gray6.regular, gray6.regular, gray6.regular];
		}
	})();

	const tooltipLabel = ((): string => {
		switch (quality) {
			case 'poor':
				return t('meeting.connectionQuality.poor', 'Poor connection');
			case 'terrible':
				return t('meeting.connectionQuality.terrible', 'Terrible connection');
			default:
				return t('meeting.connectionQuality.lost', 'Connection lost');
		}
	})();

	// On the current user's own tile, expand the tooltip with the RAW absolute link measures the monitor
	// refreshes every tick (rtt/jitter in ms, loss up/down in %). No 0–10 votes — these are the numbers
	// behind the estimate. An absent value means it was not measurable this window.
	const label = ((): string | React.ReactElement => {
		if (ownDetail == null) return tooltipLabel;
		const ms = (v: number | undefined): string => (v !== undefined ? `${Math.round(v)} ms` : '—');
		const pct = (v: number | undefined): string =>
			v !== undefined ? `${(v * 100).toFixed(1)}%` : '—';
		const lines = [
			tooltipLabel,
			`RTT: ${ms(ownDetail.rttMs)}`,
			`Jitter: ${ms(ownDetail.jitterMs)}`,
			`Loss ↑: ${pct(ownDetail.lossUp)}`,
			`Loss ↓: ${pct(ownDetail.lossDown)}`
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
