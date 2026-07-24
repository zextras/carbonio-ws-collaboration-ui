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
	useEffect,
	useMemo,
	useState
} from 'react';

import { Tooltip } from '@zextras/carbonio-design-system';
import { first, map } from 'lodash';
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

	const [buttonStatus, setButtonStatus] = useState<boolean>(true);

	useEffect(() => {
		setButtonStatus(true);
	}, [audioStatus]);

	const onClickAudioItem = useCallback(
		(audioItem: MediaDeviceInfo) => {
			getAudioStream(audioItem.deviceId)
				.then((stream) => {
					const track = first(stream.getAudioTracks());
					// Disable the track before attaching it to the sender
					// so that no audio frame can leak while muted
					if (!audioStatus && track) {
						track.enabled = false;
					}
					setSelectedDeviceId(STREAM_TYPE.AUDIO, audioItem.deviceId);
					return bidirectionalAudioConn?.updateLocalStreamTrack(stream);
				})
				.catch((reason) => console.error(reason));
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
		async (event: React.MouseEvent<HTMLButtonElement, MouseEvent> | KeyboardEvent) => {
			event.stopPropagation();
			setButtonStatus(false);
			try {
				if (!audioStatus) {
					await bidirectionalAudioConn?.unmuteAudioTrack(selectedAudioDeviceId);
					await updateAudioStreamStatus(meetingId!, !audioStatus);
				} else {
					bidirectionalAudioConn?.muteAudioTrack();
					await updateAudioStreamStatus(meetingId!, !audioStatus);
				}
			} catch {
				// Roll back the local track state to keep it consistent
				// with the server-side status that failed to update
				if (audioStatus) {
					bidirectionalAudioConn?.unmuteAudioTrack(selectedAudioDeviceId).catch(() => undefined);
				} else {
					bidirectionalAudioConn?.muteAudioTrack();
				}
				setButtonStatus(true);
			}
		},
		[audioStatus, bidirectionalAudioConn, meetingId, selectedAudioDeviceId]
	);

	const tooltipLabel = useMemo(() => {
		if (!websocketNetworkStatus) return disableButtonLabel;
		return audioStatus ? disableMicLabel : enableMicLabel;
	}, [websocketNetworkStatus, disableButtonLabel, audioStatus, disableMicLabel, enableMicLabel]);

	const disabled = useMemo(
		() =>
			!buttonStatus ||
			!websocketNetworkStatus ||
			!messageBrokerStatus ||
			permission !== 'granted' ||
			noDevices,
		[buttonStatus, messageBrokerStatus, noDevices, permission, websocketNetworkStatus]
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
