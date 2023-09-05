/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, IconButton, MultiButton, Padding } from '@zextras/carbonio-design-system';
import { filter, map } from 'lodash';
import React, { ReactElement, RefObject, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled, { FlattenSimpleInterpolation } from 'styled-components';

import useRouting, { PAGE_INFO_TYPE } from '../../../../hooks/useRouting';
import { MeetingsApi } from '../../../../network';
import {
	getMeetingViewSelected,
	getSelectedAudioDeviceId,
	getSelectedVideoDeviceId
} from '../../../../store/selectors/ActiveMeetingSelectors';
import {
	getMeetingByMeetingId,
	getParticipantAudioStatusByMeetingId,
	getParticipantScreenStatusByMeetingId,
	getParticipantVideoStatusByMeetingId
} from '../../../../store/selectors/MeetingSelectors';
import { getUserId } from '../../../../store/selectors/SessionSelectors';
import useStore from '../../../../store/Store';
import { MeetingViewType, STREAM_TYPE } from '../../../../types/store/ActiveMeetingTypes';
import { getAudioStream, getVideoStream } from '../../../../utils/UserMediaManager';

const ActionsWrapper = styled(Container)`
	position: absolute;
	bottom: 0;
	left: calc(50% - 180px);
	transform: translateY(
		${({ isHoovering }): string | FlattenSimpleInterpolation => (isHoovering ? '-1rem' : '5rem')}
	);
	transition: transform 200ms linear;
	z-index: 40;
	padding: 1rem;
	border-radius: 0.5rem;
`;

type MeetingActionsProps = {
	streamsWrapperRef: RefObject<HTMLDivElement>;
};

const MeetingActions = ({ streamsWrapperRef }: MeetingActionsProps): ReactElement => {
	const { goToInfoPage } = useRouting();
	const { meetingId }: Record<string, string> = useParams();

	const setLocalStreams = useStore((store) => store.setLocalStreams);
	const removeLocalStreams = useStore((store) => store.removeLocalStreams);
	const changeStreamStatus = useStore((store) => store.changeStreamStatus);
	const setMeetingViewSelected = useStore((store) => store.setMeetingViewSelected);
	const setSelectedDeviceId = useStore((store) => store.setSelectedDeviceId);
	const closeVideoOutConn = useStore((store) => store.closeVideoOutConn);
	const createVideoOutConn = useStore((store) => store.createVideoOutConn);
	const myUserId = useStore(getUserId);
	const meeting = useStore((store) => getMeetingByMeetingId(store, meetingId));
	const audioStatus = useStore((store) =>
		getParticipantAudioStatusByMeetingId(store, meeting?.roomId, myUserId)
	);
	const videoStatus = useStore((store) =>
		getParticipantVideoStatusByMeetingId(store, meeting?.roomId, myUserId)
	);
	const shareStatus = useStore((store) =>
		getParticipantScreenStatusByMeetingId(store, meeting?.roomId, myUserId)
	);
	const meetingViewSelected = useStore((store) => getMeetingViewSelected(store, meetingId));
	const selectedAudioDeviceId = useStore((store) => getSelectedAudioDeviceId(store, meetingId));
	const selectedVideoDeviceId = useStore((store) => getSelectedVideoDeviceId(store, meetingId));
	const videoOutConn = useStore((store) => store.activeMeeting[meetingId]?.videoOutConn);
	const bidirectionalAudioConn = useStore(
		(store) => store.activeMeeting[meetingId].bidirectionalAudioConn
	);

	const [isHoovering, setIsHoovering] = useState<boolean>(false);
	const [isHoverActions, setIsHoverActions] = useState<boolean>(false);
	const [audioMediaList, setAudioMediaList] = useState<[] | MediaDeviceInfo[]>([]);
	const [videoMediaList, setVideoMediaList] = useState<[] | MediaDeviceInfo[]>([]);
	let timeout: string | number | NodeJS.Timeout | undefined;

	useEffect(() => {
		if (selectedAudioDeviceId != null) {
			getAudioStream(true, true, selectedAudioDeviceId).then((stream) => {
				bidirectionalAudioConn?.updateLocalStreamTrack(stream).then(() => {
					MeetingsApi.updateAudioStreamStatus(meetingId, true);
				});
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleHoverMouseMove = useCallback(
		(e) => {
			clearTimeout(timeout);
			if (!isHoovering) {
				setIsHoovering(true);
				if (!isHoverActions) {
					// eslint-disable-next-line react-hooks/exhaustive-deps
					timeout = setTimeout(() => {
						const NewEvent = new CustomEvent('mouseStop', { bubbles: true, cancelable: true });
						e.target.dispatchEvent(NewEvent);
					}, 2000);
				}
			}
		},
		[isHoovering, isHoverActions]
	);

	const handleHoverMouseStop = useCallback(() => {
		streamsWrapperRef?.current?.removeEventListener('mousemove', handleHoverMouseMove);
		if (!isHoverActions) setIsHoovering(false);
	}, [streamsWrapperRef, isHoverActions, handleHoverMouseMove]);

	const handleMouseEnter = useCallback(() => {
		setIsHoverActions(true);
	}, []);

	const handleMouseLeave = useCallback(() => {
		setIsHoverActions(false);
	}, []);

	const toggleVideoStream = useCallback(() => {
		if (!videoStatus) {
			if (!videoOutConn) {
				createVideoOutConn(meetingId, true, selectedVideoDeviceId);
			} else {
				getVideoStream(selectedVideoDeviceId).then((stream) => {
					videoOutConn?.updateLocalStreamTrack(stream).then(() => {
						MeetingsApi.updateMediaOffer(meetingId, STREAM_TYPE.VIDEO, true).then();
					});
				});
			}
		} else {
			// TODO ASK BE TO IMPROVE AND TEST IF IT IS POSSIBLE TO ALLOW NOT RECREATE THE CONNECTION BUT SIMPLY SET THE SOURCE TO ENABLED
			// videoOutConn?.closeRtpSenderTrack();
			closeVideoOutConn(meetingId);
			MeetingsApi.updateMediaOffer(meetingId, STREAM_TYPE.VIDEO, !videoStatus).then(() => {
				if (myUserId != null) {
					removeLocalStreams(meetingId, STREAM_TYPE.VIDEO);
				}
			});
		}
	}, [
		videoStatus,
		videoOutConn,
		createVideoOutConn,
		meetingId,
		selectedVideoDeviceId,
		closeVideoOutConn,
		myUserId,
		removeLocalStreams
	]);

	const toggleAudioStream = useCallback(() => {
		if (!audioStatus) {
			getAudioStream(true, true, selectedAudioDeviceId).then((stream) => {
				bidirectionalAudioConn?.updateLocalStreamTrack(stream).then(() => {
					MeetingsApi.updateAudioStreamStatus(meetingId, !audioStatus).then();
				});
			});
		} else {
			bidirectionalAudioConn?.closeRtpSenderTrack();
			MeetingsApi.updateAudioStreamStatus(meetingId, !audioStatus).then();
		}
	}, [audioStatus, bidirectionalAudioConn, meetingId, selectedAudioDeviceId]);

	const toggleShareStream = useCallback(() => {
		// MeetingsApi.updateVideoShareOffer(meetingId, !shareStatus).then(() => {
		// 	if (myUserId != null) {
		// 		changeStreamStatus(meetingId, myUserId, 'screen', !shareStatus);
		// 	}
		// });
	}, []);

	const leaveMeeting = useCallback(() => {
		MeetingsApi.leaveMeeting(meetingId)
			.then(() => goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED))
			.catch(() => console.log('Error on leave'));
	}, [meetingId, goToInfoPage]);

	const deleteMeeting = useCallback(() => {
		MeetingsApi.deleteMeeting(meetingId)
			.then(() => goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED))
			.catch(() => console.log('Error on leave'));
	}, [meetingId, goToInfoPage]);

	const toggleMeetingView = useCallback(() => {
		setMeetingViewSelected(
			meetingId,
			meetingViewSelected === MeetingViewType.GRID ? MeetingViewType.CINEMA : MeetingViewType.GRID
		);
	}, [meetingId, meetingViewSelected, setMeetingViewSelected]);

	const mediaAudioList = useMemo(
		() =>
			map(audioMediaList, (audioItem: MediaDeviceInfo, i) => ({
				id: `device-${i}`,
				label: audioItem.label ? audioItem.label : `device-${i}`,
				onClick: (): void => {
					setSelectedDeviceId(meetingId, STREAM_TYPE.AUDIO, audioItem.deviceId);
					getAudioStream(true, true, audioItem.deviceId).then((stream) => {
						bidirectionalAudioConn?.updateLocalStreamTrack(stream);
						if (myUserId != null) {
							changeStreamStatus(meetingId, myUserId, STREAM_TYPE.AUDIO, true);
						}
					});
					if (!audioStatus) {
						MeetingsApi.updateAudioStreamStatus(meetingId, !audioStatus).then();
					}
				},
				selected: audioItem.deviceId === selectedAudioDeviceId,
				value: audioItem.deviceId
			})),
		[
			audioMediaList,
			selectedAudioDeviceId,
			setSelectedDeviceId,
			meetingId,
			audioStatus,
			bidirectionalAudioConn,
			myUserId,
			changeStreamStatus
		]
	);

	const mediaVideoList = useMemo(
		() =>
			map(videoMediaList, (videoItem: MediaDeviceInfo, i) => ({
				id: `device-${i}`,
				label: videoItem.label ? videoItem.label : `device-${i}`,
				onClick: (): void => {
					setSelectedDeviceId(meetingId, STREAM_TYPE.VIDEO, videoItem.deviceId);
					if (!videoOutConn) {
						createVideoOutConn(meetingId, true, videoItem.deviceId);
					} else {
						getVideoStream(videoItem.deviceId).then((stream) => {
							const videoStream = stream;
							videoOutConn?.updateLocalStreamTrack(stream).then(() => {
								setLocalStreams(meetingId, STREAM_TYPE.VIDEO, videoStream);
							});
						});
					}
				},
				value: videoItem.deviceId
			})),
		[
			videoMediaList,
			setSelectedDeviceId,
			meetingId,
			videoOutConn,
			createVideoOutConn,
			setLocalStreams
		]
	);

	useEffect(() => {
		let elRef: React.RefObject<HTMLDivElement> | null = streamsWrapperRef;
		if (elRef?.current && !isHoverActions) {
			elRef.current.addEventListener('mousemove', (e: MouseEvent) => handleHoverMouseMove(e));
			elRef.current.addEventListener('mouseStop', handleHoverMouseStop);
		}

		return (): void => {
			if (elRef?.current) {
				elRef.current.removeEventListener('mousemove', handleHoverMouseMove);
				elRef.current.removeEventListener('mouseStop', handleHoverMouseStop);
				elRef = null;
			}
		};
	}, [handleHoverMouseMove, handleHoverMouseStop, isHoverActions, streamsWrapperRef]);

	const updateListOfDevices = useCallback(() => {
		navigator.mediaDevices
			.enumerateDevices()
			.then((devices) => {
				const audioInputs: [] | MediaDeviceInfo[] | any = filter(
					devices,
					(device) => device.kind === 'audioinput' && device
				);
				const videoInputs: [] | MediaDeviceInfo[] | any = filter(
					devices,
					(device) => device.kind === 'videoinput' && device
				);
				setAudioMediaList(audioInputs);
				setVideoMediaList(videoInputs);
			})
			.catch();
	}, []);

	/**
	 * This useEffect check when the user connects a new mic/webcam device and update the list of resources
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
		<ActionsWrapper
			background={'text'}
			width="fit"
			height="fit"
			orientation="horizontal"
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			isHoovering={isHoovering}
		>
			<MultiButton
				iconColor="gray6"
				backgroundColor="primary"
				primaryIcon={audioStatus ? 'Mic' : 'MicOff'}
				icon="ChevronUp"
				onClick={toggleAudioStream}
				items={mediaAudioList}
				size="large"
				shape="regular"
			/>
			<Padding right="16px" />
			<MultiButton
				iconColor="gray6"
				backgroundColor="primary"
				primaryIcon={videoStatus ? 'Video' : 'VideoOff'}
				icon="ChevronUp"
				onClick={toggleVideoStream}
				items={mediaVideoList}
				size="large"
				shape="regular"
			/>
			<Padding right="16px" />
			<IconButton
				iconColor="gray6"
				backgroundColor="primary"
				icon={shareStatus ? 'ScreenSharingOn' : 'ScreenSharingOff'}
				onClick={toggleShareStream}
				size="large"
				disabled // TODO: enable when screen sharing will be available
			/>
			<Padding right="16px" />
			<IconButton
				size="large"
				backgroundColor="primary"
				iconColor="gray6"
				icon={meetingViewSelected === MeetingViewType.GRID ? 'Grid' : 'CinemaView'}
				onClick={toggleMeetingView}
				disabled // TODO: enable when grid mode will be available
			/>
			<Padding right="16px" />
			<IconButton
				iconColor="gray6"
				backgroundColor="primary"
				icon="MoreVertical"
				onClick={deleteMeeting}
				size="large"
			/>
			<Padding right="48px" />
			<IconButton
				iconColor="gray6"
				backgroundColor="error"
				icon="Hangup"
				onClick={leaveMeeting}
				size="large"
			/>
		</ActionsWrapper>
	);
};

export default MeetingActions;
