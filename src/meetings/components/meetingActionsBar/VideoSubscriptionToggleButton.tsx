/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback } from 'react';

import styled from '@emotion/styled';
import { Container, Icon, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { getVideoSubscriptionsEnabled } from '../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../store/Store';

const ClickableContainer = styled(Container)`
	cursor: pointer;
`;

const VideoSubscriptionToggleButton: FC = () => {
	const [t] = useTranslation();

	const videoSubscriptionsEnabled = useStore(getVideoSubscriptionsEnabled);
	const setVideoSubscriptionsEnabled = useStore((store) => store.setVideoSubscriptionsEnabled);
	const setManualVideoSubEnabled = useStore((store) => store.setManualVideoSubEnabled);

	const handleClick = useCallback(() => {
		setVideoSubscriptionsEnabled(!videoSubscriptionsEnabled);
		setManualVideoSubEnabled(videoSubscriptionsEnabled);
	}, [setVideoSubscriptionsEnabled, setManualVideoSubEnabled, videoSubscriptionsEnabled]);

	const tooltipLabel = videoSubscriptionsEnabled
		? t('meeting.videoSubscriptions.unsubscribe', 'Unsubscribe from all video streams')
		: t('meeting.videoSubscriptions.subscribe', 'Subscribe to all video streams');

	return (
		<Tooltip label={tooltipLabel} placement="top">
			<ClickableContainer
				orientation="horizontal"
				width="fit"
				height="fit"
				crossAlignment="center"
				data-testid="video_subscription_toggle_button"
				onClick={handleClick}
			>
				<Icon
					icon={videoSubscriptionsEnabled ? 'Video' : 'VideoOff'}
					color={videoSubscriptionsEnabled ? 'gray6' : 'error'}
					size="medium"
				/>
			</ClickableContainer>
		</Tooltip>
	);
};

export default VideoSubscriptionToggleButton;
