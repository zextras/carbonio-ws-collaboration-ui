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
	useEffect,
	useMemo,
	useState
} from 'react';

import { MultiButton, Tooltip } from '@zextras/carbonio-design-system';
import { filter, map } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { MeetingRoutesParams } from '../../../hooks/useRouting';
import { MeetingsApi } from '../../../network';
import { getSelectedAudioDeviceId } from '../../../store/selectors/ActiveMeetingSelectors';
import { getParticipantAudioStatus } from '../../../store/selectors/MeetingSelectors';
import { getUserId } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { STREAM_TYPE } from '../../../types/store/ActiveMeetingTypes';
import { getAudioStream } from '../../../utils/UserMediaManager';

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

	const { meetingId }: MeetingRoutesParams = useParams();
	const myUserId = useStore(getUserId);
	const audioStatus = useStore((store) => getParticipantAudioStatus(store, meetingId, myUserId));
	const selectedAudioDeviceId = useStore((store) => getSelectedAudioDeviceId(store, meetingId));
	const setSelectedDeviceId = useStore((store) => store.setSelectedDeviceId);
	const bidirectionalAudioConn = useStore(
		(store) => store.activeMeeting[meetingId]?.bidirectionalAudioConn
	);

	const [audioMediaList, setAudioMediaList] = useState<[] | MediaDeviceInfo[]>([]);

	const mediaAudioList = useMemo(
		() =>
			map(audioMediaList, (audioItem: MediaDeviceInfo, i) => ({
				id: `device-${i}`,
				label: audioItem.label ? audioItem.label : `device-${i}`,
				onClick: (): void => {
					if (audioStatus) {
						getAudioStream(true, true, audioItem.deviceId).then((stream) => {
							bidirectionalAudioConn?.updateLocalStreamTrack(stream);
							setSelectedDeviceId(meetingId, STREAM_TYPE.AUDIO, audioItem.deviceId);
						});
					} else {
						setSelectedDeviceId(meetingId, STREAM_TYPE.AUDIO, audioItem.deviceId);
					}
				},
				selected: audioItem.deviceId === selectedAudioDeviceId,
				value: audioItem.deviceId
			})),
		[
			audioMediaList,
			selectedAudioDeviceId,
			audioStatus,
			bidirectionalAudioConn,
			setSelectedDeviceId,
			meetingId
		]
	);

	const toggleAudioDropdown = useCallback(() => {
		setIsAudioListOpen((prevState) => !prevState);
	}, [setIsAudioListOpen]);

	const toggleAudioStream = useCallback(
		(event) => {
			event.stopPropagation();
			if (!audioStatus) {
				getAudioStream(true, true, selectedAudioDeviceId).then((stream) => {
					bidirectionalAudioConn?.updateLocalStreamTrack(stream).then(() => {
						MeetingsApi.updateAudioStreamStatus(meetingId, !audioStatus);
					});
				});
			} else {
				bidirectionalAudioConn?.closeRtpSenderTrack();
				MeetingsApi.updateAudioStreamStatus(meetingId, !audioStatus);
			}
		},
		[audioStatus, bidirectionalAudioConn, meetingId, selectedAudioDeviceId]
	);

	const updateListOfDevices = useCallback(() => {
		navigator.mediaDevices
			.enumerateDevices()
			.then((devices) => {
				const audioInputs: [] | MediaDeviceInfo[] | any = filter(
					devices,
					(device) => device.kind === 'audioinput' && device
				);
				setAudioMediaList(audioInputs);
			})
			.catch();
	}, []);

	/**
	 * This useEffect check when the user connects a new mic device and update the list of resources
	 * on Firefox to be able to works it needs to have a device already in use otherwise if user is muted
	 * it will not show the new device
	 */
	useEffect(() => {
		updateListOfDevices();
		navigator.mediaDevices.addEventListener('devicechange', updateListOfDevices);

		return (): void => {
			navigator.mediaDevices.removeEventListener('devicechange', updateListOfDevices);
		};
	}, [updateListOfDevices]);

	return (
		<Tooltip placement="top" label={audioStatus ? disableMicLabel : enableMicLabel}>
			<MultiButton
				data-testid="microphone-button"
				background="primary"
				primaryIcon={audioStatus ? 'Mic' : 'MicOff'}
				icon={isAudioListOpen ? 'ChevronDown' : 'ChevronUp'}
				onClick={toggleAudioStream}
				items={mediaAudioList}
				size="large"
				shape="regular"
				dropdownProps={{
					forceOpen: isAudioListOpen,
					onClick: toggleAudioDropdown,
					dropdownListRef: audioDropdownRef,
					items: mediaAudioList
				}}
			/>
		</Tooltip>
	);
};

export default MicrophoneButton;
