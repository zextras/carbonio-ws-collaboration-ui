/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import styled from '@emotion/styled';
import { Container, Icon, Tooltip, useTheme } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import {
	ConnectionQuality,
	isConnectionQualitySupported,
	isUnstableQuality
} from '../../../network/webRTC/connectionQualityScore';
import { getParticipantNetworkQuality } from '../../../store/selectors/MeetingSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import { getUserName } from '../../../store/selectors/UsersSelectors';
import useStore from '../../../store/Store';

type IndicatorLevel = 'good' | 'fair' | 'poor' | 'lost';

const toIndicatorLevel = (quality: ConnectionQuality): IndicatorLevel => {
	switch (quality) {
		case 'optimal':
		case 'high':
			return 'good';
		case 'medium':
			return 'fair';
		case 'lost':
			return 'lost';
		default:
			return 'poor';
	}
};

// Paths of the design system Wifi icon, split per arc (innermost first) so each arc can be colored
const WIFI_ARCS = [
	'M12 14a5 5 0 0 0-3.47 1.4 1 1 0 1 0 1.39 1.44 3.08 3.08 0 0 1 4.16 0 1 1 0 1 0 1.39-1.44A5 5 0 0 0 12 14',
	'M12 9a9 9 0 0 0-6.47 2.75A1 1 0 0 0 7 13.14a7 7 0 0 1 10.08 0 1 1 0 0 0 .71.3 1 1 0 0 0 .72-1.69A9 9 0 0 0 12 9',
	'M21.72 7.93a14 14 0 0 0-19.44 0 1 1 0 0 0 1.38 1.44 12 12 0 0 1 16.68 0 1 1 0 0 0 .69.28 1 1 0 0 0 .72-.31 1 1 0 0 0-.03-1.41'
] as const;

const LEVEL_ARCS: Record<Exclude<IndicatorLevel, 'lost'>, number> = { good: 3, fair: 2, poor: 1 };
const LEVEL_COLOR: Record<Exclude<IndicatorLevel, 'lost'>, 'success' | 'warning' | 'error'> = {
	good: 'success',
	fair: 'warning',
	poor: 'error'
};

const BadgeContainer = styled(Container)`
	border-radius: 0.25rem;
`;

const WifiLevelIcon: FC<{ level: Exclude<IndicatorLevel, 'lost'>; size: string }> = ({
	level,
	size
}) => {
	const theme = useTheme();
	const activeColor = theme.palette[LEVEL_COLOR[level]].regular;
	const inactiveColor = theme.palette.gray1.regular;
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			width={size}
			height={size}
			data-testid={`connection_quality_${level}`}
		>
			<circle cx={12} cy={19} r={1} fill={activeColor} />
			{WIFI_ARCS.map((d, index) => (
				<path key={d} d={d} fill={index < LEVEL_ARCS[level] ? activeColor : inactiveColor} />
			))}
		</svg>
	);
};

const ConnectionQualityIndicator: FC<{
	meetingId?: string;
	userId?: string;
}> = ({ meetingId, userId }) => {
	const [t] = useTranslation();
	const quality = useStore((store) => getParticipantNetworkQuality(store, meetingId, userId));
	const isOwn = useStore((store) => userId != null && userId === getUserId(store));
	const userName = useStore((store) => getUserName(store, userId ?? ''));
	const isSupported = useStore((store) => isConnectionQualitySupported(store.session.apiVersion));

	// Own indicator is always visible, a remote one only while that participant's link is unstable
	if (!isSupported || !quality) return null;
	if (!isOwn && !isUnstableQuality(quality)) return null;

	const level = toIndicatorLevel(quality);

	const ownLabels: Record<IndicatorLevel, string> = {
		good: t('meeting.connectionQuality.stable', 'Your connection is stable'),
		fair: t('meeting.connectionQuality.bitUnstable', 'Your connection is a bit unstable'),
		poor: t('meeting.connectionQuality.unstable', 'Your connection is unstable'),
		lost: t('meeting.connectionQuality.lost', 'Connection lost')
	};
	const remoteLabel =
		level === 'lost'
			? t('meeting.connectionQuality.participantLost', "{{name}}'s connection is lost", {
					name: userName
				})
			: t('meeting.connectionQuality.participantUnstable', "{{name}}'s connection is unstable", {
					name: userName
				});

	// The remote badge matches the size of the other tile status icons
	return (
		<Tooltip label={isOwn ? ownLabels[level] : remoteLabel}>
			<BadgeContainer
				background={isOwn ? undefined : 'gray0'}
				width={isOwn ? '2.25rem' : '2rem'}
				height={isOwn ? '2.25rem' : '2rem'}
				data-testid="connection_quality_indicator"
			>
				{level === 'lost' ? (
					<Icon icon="WifiOff" color="gray1" size={isOwn ? 'large' : 'medium'} />
				) : (
					<WifiLevelIcon level={level} size={isOwn ? '1.5rem' : '1rem'} />
				)}
			</BadgeContainer>
		</Tooltip>
	);
};

export default ConnectionQualityIndicator;
