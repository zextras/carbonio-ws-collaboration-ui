/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, {
	Dispatch,
	ReactElement,
	SetStateAction,
	useCallback,
	useContext,
	useMemo
} from 'react';

import { Tooltip } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';

import { MultiActionButton } from './MultiActionButton';
import useMediaDevices from '../../../hooks/useMediaDevices';
import { updateAudioStreamStatus } from '../../../network';
import { getSelectedAudioDeviceId } from '../../../store/selectors/ActiveMeetingSelectors';
import { getParticipantAudioStatus } from '../../../store/selectors/MeetingSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import { getAudioStream } from '../../../utils/UserMediaManager';
import { RouterContext } from '../../contexts/routerContext';

type MicButtonProps = {
	audioDropdownRef: React.RefObject<HTMLDivElement>;
	isAudioListOpen: boolean;
	setIsAudioListOpen: Dispatch<SetStateAction<boolean>>;
};

const MicrophoneButton = ({
	audioDropdownRef,
	isAudioListOpen,
	setIsAudioListOpen
}: MicButtonProps): ReactElement => {
	const [t] = useTranslation();

	const disableMicLabel = t('meeting.interactions.disableMicrophone', 'Disable microphone');
	const enableMicLabel = t('meeting.interactions.enableMicrophone', 'Enable microphone');
	const giveMediaPermissionSnackbar = t(
		'meeting.interactions.browserPermission',
		'Grant browser permissions to enable resources'
	);
	const disableButtonLabel = t(
		'meeting.interactions.disabled',
		'There are connection problems, please try again later.'
	);
	const unknownDeviceLabel = t('meeting.interactions.unknownDevice', 'Unknown device');

	const { meetingId } = useContext(RouterContext);
	const myUserId = useStore(getUserId);
	const audioStatus = useStore((store) => getParticipantAudioStatus(store, meetingId, myUserId));
	const selectedAudioDeviceId = useStore(getSelectedAudioDeviceId);
	const setSelectedDeviceId = useStore((store) => store.setSelectedDeviceId);
	const bidirectionalAudioConn = useStore((store) => store.activeMeeting?.bidirectionalAudioConn);
	const websocketNetworkStatus = useStore(({ connections }) => connections.status.websocket);
	const messageBrokerStatus = useStore(({ connections }) => connections.status.messageBroker);

	const { permission, deviceList, noDevices } = useMediaDevices('audio');

	const onClickAudioItem = useCallback(
		(audioItem: MediaDeviceInfo) => {
			if (audioStatus) {
				getAudioStream(audioItem.deviceId).then((stream) => {
					bidirectionalAudioConn?.updateLocalStreamTrack(stream);
					setSelectedDeviceId(STREAM_TYPE.AUDIO, audioItem.deviceId);
				});
			} else {
				setSelectedDeviceId(STREAM_TYPE.AUDIO, audioItem.deviceId);
			}
		},
		[audioStatus, bidirectionalAudioConn, setSelectedDeviceId]
	);

	const mediaAudioList = useMemo(
		() =>
			map(deviceList, (audioItem: MediaDeviceInfo, i) => ({
				id: `device-${i}`,
				label: audioItem.label ? audioItem.label : unknownDeviceLabel,
				onClick: (): void => onClickAudioItem(audioItem),
				selected: audioItem.deviceId === selectedAudioDeviceId,
				value: audioItem.deviceId
			})),
		[deviceList, unknownDeviceLabel, selectedAudioDeviceId, onClickAudioItem]
	);

	const toggleAudioStream = useCallback(
		(event: { stopPropagation: () => void }) => {
			event.stopPropagation();
			if (!audioStatus) {
				getAudioStream(selectedAudioDeviceId)
					.then((stream) => {
						bidirectionalAudioConn?.updateLocalStreamTrack(stream).then(() => {
							updateAudioStreamStatus(meetingId!, !audioStatus);
						});
					})
					.catch((e) => {
						console.log(e);
					});
			} else {
				bidirectionalAudioConn?.closeRtpSenderTrack();
				updateAudioStreamStatus(meetingId!, !audioStatus);
			}
		},
		[audioStatus, bidirectionalAudioConn, meetingId, selectedAudioDeviceId]
	);

	const tooltipLabel = useMemo(() => {
		if (!websocketNetworkStatus) return disableButtonLabel;
		return audioStatus ? disableMicLabel : enableMicLabel;
	}, [websocketNetworkStatus, disableButtonLabel, audioStatus, disableMicLabel, enableMicLabel]);

	const disabled = useMemo(
		() => !websocketNetworkStatus || !messageBrokerStatus || permission !== 'granted' || noDevices,
		[messageBrokerStatus, noDevices, permission, websocketNetworkStatus]
	);

	return (
		<Tooltip
			placement="top"
			label={permission !== 'granted' ? giveMediaPermissionSnackbar : tooltipLabel}
		>
			<MultiActionButton
				showItems={isAudioListOpen}
				setShowItems={setIsAudioListOpen}
				onClick={toggleAudioStream}
				items={mediaAudioList}
				disabled={disabled}
				data-testid="microphone-button"
				icon={audioStatus ? 'Mic' : 'MicOff'}
				listRef={audioDropdownRef}
			/>
		</Tooltip>
	);
};

export default MicrophoneButton;
