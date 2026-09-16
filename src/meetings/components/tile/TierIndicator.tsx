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

// Same vertical ascending-bar look as the 5-bar score badge, but 3 bars (a touch wider) + a direction arrow.
const BarsContainer = styled.div`
	display: flex;
	align-items: flex-end;
	gap: 0.0625rem;
	height: 1rem;
`;

const Bar = styled.div<{ $color: string; $height: string }>`
	width: 0.1875rem;
	height: ${({ $height }): string => $height};
	background-color: ${({ $color }): string => $color};
	border-radius: 0.0625rem;
`;

// 3 ascending heights (shortest→tallest, tallest = 1rem to match the score badge). Filled count = tier+1.
const BAR_HEIGHTS = ['0.4375rem', '0.6875rem', '1rem'] as const;

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
	const barColors = BAR_HEIGHTS.map((_, i) => (i < filled ? success.regular : gray6.regular));

	const tierName = TIER_NAME[tier] ?? String(tier);
	const label =
		direction === 'up'
			? t('meeting.tier.uplink', 'Sending: {{tier}}', { tier: tierName })
			: t('meeting.tier.downlink', 'Showing: {{tier}}', { tier: tierName });

	return (
		<Tooltip label={label}>
			<CustomContainer background="gray0" height="fit" width="fit" padding="0.5rem">
				<Row gap="0.125rem" crossAlignment="center">
					<BarsContainer>
						{BAR_HEIGHTS.map((height, i) => (
							<Bar key={height} $color={barColors[i]} $height={height} />
						))}
					</BarsContainer>
					<Icon icon={direction === 'up' ? 'ArrowUp' : 'ArrowDown'} size="small" color="gray6" />
				</Row>
			</CustomContainer>
		</Tooltip>
	);
};

export default TierIndicator;
