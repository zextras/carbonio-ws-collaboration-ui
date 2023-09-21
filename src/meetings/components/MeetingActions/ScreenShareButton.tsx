/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { IconButton, Tooltip } from '@zextras/carbonio-design-system';
import React, { ReactElement, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { getParticipantScreenStatus } from '../../../store/selectors/MeetingSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';

const ScreenShareButton = (): ReactElement => {
	const [t] = useTranslation();

	const disableScreenLabel = t('meeting.interactions.disableScreen', 'Disable screen share');
	const enableScreenLabel = t('meeting.interactions.enableScreen', 'Enable screen share');

	const { meetingId }: Record<string, string> = useParams();
	const myUserId = useStore(getUserId);
	const screenStatus = useStore((store) => getParticipantScreenStatus(store, meetingId, myUserId));

	const toggleScreenStream = useCallback(() => {
		if (!screenStatus) {
			// if (!videoOutConn) {
			// 	createVideoOutConn(meetingId, true, selectedVideoDeviceId);
			// } else {
			// 	getVideoStream(selectedVideoDeviceId).then((stream) => {
			// 		videoOutConn
			// 			?.updateLocalStreamTrack(stream)
			// 			.then(() => MeetingsApi.updateMediaOffer(meetingId, STREAM_TYPE.VIDEO, true));
			// 	});
			// }
		} else {
			// closeVideoOutConn(meetingId);
			// MeetingsApi.updateMediaOffer(meetingId, STREAM_TYPE.SCREEN, false).then(() =>
			// 	removeLocalStreams(meetingId, STREAM_TYPE.SCREEN)
			// );
		}
	}, [screenStatus]);

	return (
		<Tooltip placement="top" label={screenStatus ? disableScreenLabel : enableScreenLabel}>
			<IconButton
				iconColor="gray6"
				backgroundColor="primary"
				icon={screenStatus ? 'ScreenSharingOn' : 'ScreenSharingOff'}
				onClick={toggleScreenStream}
				size="large"
			/>
		</Tooltip>
	);
};

export default ScreenShareButton;
