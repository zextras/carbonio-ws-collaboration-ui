/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import styled from '@emotion/styled';
import { Icon, Row, Tooltip, useTheme } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

const CustomContainer = styled(Row)`
	border-radius: 0.25rem;
`;

// Horizontal, wider-than-tall form factor: 3 flat segments in a row (a level meter laid flat) so the badge
// reads as a short pill next to the arrow instead of a cramped vertical stack.
const BarsContainer = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 0.125rem;
`;

const Bar = styled.div<{ $color: string }>`
	width: 0.5rem;
	height: 0.25rem;
	background-color: ${({ $color }): string => $color};
	border-radius: 0.0625rem;
`;

// Three equal segments; the number FILLED encodes the tier (1=LOW, 2=MEDIUM, 3=HIGH).
const SEGMENTS = [0, 1, 2] as const;

const TIER_NAME: Record<number, string> = { 0: 'LOW', 1: 'MEDIUM', 2: 'HIGH' };

type TierIndicatorProps = {
	tier?: number;
	direction: 'up' | 'down';
};

const TierIndicator: FC<TierIndicatorProps> = ({ tier, direction }) => {
	const [t] = useTranslation();
	const theme = useTheme();

	if (tier == null) return null;

	const filled = tier + 1;
	const { success, gray6 } = theme.palette;
	const barColors = SEGMENTS.map((i) => (i < filled ? success.regular : gray6.regular));

	const tierName = TIER_NAME[tier] ?? String(tier);
	const label =
		direction === 'up'
			? t('meeting.tier.uplink', 'Sending: {{tier}}', { tier: tierName })
			: t('meeting.tier.downlink', 'Showing: {{tier}}', { tier: tierName });

	return (
		<Tooltip label={label}>
			<CustomContainer background="gray0" height="fit" width="fit" padding="0.25rem">
				<Row gap="0.1875rem" crossAlignment="center">
					<Icon icon={direction === 'up' ? 'ArrowUp' : 'ArrowDown'} size="small" color="gray6" />
					<BarsContainer>
						{SEGMENTS.map((i) => (
							<Bar key={i} $color={barColors[i]} />
						))}
					</BarsContainer>
				</Row>
			</CustomContainer>
		</Tooltip>
	);
};

export default TierIndicator;
