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
import useStore from '../../../store/Store';

const CustomContainer = styled(Row)`
	border-radius: 0.25rem;
`;

const BarsContainer = styled.div`
	display: flex;
	align-items: flex-end;
	gap: 0.125rem;
	height: 1rem;
`;

const Bar = styled.div<{ $color: string; $height: string }>`
	width: 0.1875rem;
	height: ${({ $height }): string => $height};
	background-color: ${({ $color }): string => $color};
	border-radius: 0.0625rem;
`;

const ConnectionQualityIndicator: FC<{ meetingId?: string; userId?: string }> = ({
	meetingId,
	userId
}) => {
	const [t] = useTranslation();
	const theme = useTheme();
	const quality = useStore((state) => getParticipantConnectionQuality(state, meetingId, userId));

	if (!quality) return null;

	const { success, warning, error, gray6 } = theme.palette;

	const barColors: [string, string, string] = ((): [string, string, string] => {
		switch (quality) {
			case 'good':
				return [success.regular, success.regular, success.regular];
			case 'fair':
				return [warning.regular, warning.regular, gray6.regular];
			case 'poor':
				return [error.regular, gray6.regular, gray6.regular];
			default:
				return [gray6.regular, gray6.regular, gray6.regular];
		}
	})();

	const tooltipLabel = ((): string => {
		switch (quality) {
			case 'good':
				return t('meeting.connectionQuality.good', 'Good connection');
			case 'fair':
				return t('meeting.connectionQuality.fair', 'Fair connection');
			case 'poor':
				return t('meeting.connectionQuality.poor', 'Poor connection');
			default:
				return t('meeting.connectionQuality.lost', 'Connection lost');
		}
	})();

	return (
		<Tooltip label={tooltipLabel}>
			<CustomContainer background="gray0" height="fit" width="fit" padding="0.5rem">
				{quality === 'lost' ? (
					<Icon icon="WifiOff" color="error" size="medium" />
				) : (
					<BarsContainer>
						<Bar $color={barColors[0]} $height="0.3125rem" />
						<Bar $color={barColors[1]} $height="0.5625rem" />
						<Bar $color={barColors[2]} $height="0.875rem" />
					</BarsContainer>
				)}
			</CustomContainer>
		</Tooltip>
	);
};

export default ConnectionQualityIndicator;
