/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import styled from '@emotion/styled';
import { Icon, Row, Tooltip, useTheme } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

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

	if (!quality) return null;

	const { success, warning, error, gray6 } = theme.palette;

	// Returns an array of 5 colors, active bars filled, inactive bars gray
	const barColors = ((): [string, string, string, string, string] => {
		switch (quality) {
			case 'optimal':
				return [
					success.regular,
					success.regular,
					success.regular,
					success.regular,
					success.regular
				];
			case 'high':
				return [success.regular, success.regular, success.regular, success.regular, gray6.regular];
			case 'medium':
				return [warning.regular, warning.regular, warning.regular, gray6.regular, gray6.regular];
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
			case 'optimal':
				return t('meeting.connectionQuality.optimal', 'Optimal connection');
			case 'high':
				return t('meeting.connectionQuality.high', 'High connection');
			case 'medium':
				return t('meeting.connectionQuality.medium', 'Medium connection');
			case 'poor':
				return t('meeting.connectionQuality.poor', 'Poor connection');
			case 'terrible':
				return t('meeting.connectionQuality.terrible', 'Terrible connection');
			default:
				return t('meeting.connectionQuality.lost', 'Connection lost');
		}
	})();

	// On the current user's own tile, expand the tooltip with the per-stream uplink votes the monitor
	// refreshes every tick. An absent key means the stream is not being published.
	const label = ((): string | React.ReactElement => {
		if (ownDetail == null) return tooltipLabel;
		const vote = (v: number | undefined): string => (v !== undefined ? v.toFixed(1) : '—');
		const lines = [
			tooltipLabel,
			`Webcam: ${vote(ownDetail.webcam)}`,
			`Screen: ${vote(ownDetail.screen)}`,
			`Audio: ${vote(ownDetail.audio)}`
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
