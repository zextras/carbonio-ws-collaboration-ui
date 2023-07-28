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
import { getMeetingViewSelected } from '../../../../store/selectors/ActiveMeetingSelectors';
import useStore from '../../../../store/Store';
import { MeetingViewType } from '../../../../types/store/ActiveMeetingTypes';
import { getAudioStream } from '../../../../utils/UserMediaManager';

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

	const meetingViewSelected = useStore((store) => getMeetingViewSelected(store, meetingId));
	const setMeetingViewSelected = useStore((store) => store.setMeetingViewSelected);
	const closeBidirectionalAudioConn = useStore((store) => store.closeBidirectionalAudioConn);
	const bidirectionalAudioConn = useStore(
		(store) => store.activeMeeting[meetingId].bidirectionalAudioConn
	);

	const [isHoovering, setIsHoovering] = useState<boolean>(false);
	const [isHoverActions, setIsHoverActions] = useState<boolean>(false);
	const [videoStatus, setVideoStatus] = useState<boolean>(false);
	const [audioStatus, setAudioStatus] = useState<boolean>(false);
	const [shareStatus, setShareStatus] = useState<boolean>(false);
	const [audioMediaList, setAudioMediaList] = useState<[] | MediaDeviceInfo[]>([]);
	const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<undefined | string>(undefined);
	let timeout: string | number | NodeJS.Timeout | undefined;

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
		MeetingsApi.updateVideoStreamStatus(meetingId, !videoStatus).then(() =>
			setVideoStatus(!videoStatus)
		);
	}, [videoStatus, meetingId]);

	const toggleAudioStream = useCallback(() => {
		if (!audioStatus) {
			getAudioStream(true, true, selectedAudioDeviceId).then((stream) => {
				bidirectionalAudioConn?.updateLocalStreamTrack(stream).then(() => {
					MeetingsApi.updateAudioStreamStatus(meetingId, !audioStatus).then(() => {
						setAudioStatus(!audioStatus);
					});
				});
			});
		} else {
			bidirectionalAudioConn?.closeRtpSenderTrack();
			MeetingsApi.updateAudioStreamStatus(meetingId, !audioStatus).then(() =>
				setAudioStatus(!audioStatus)
			);
		}
	}, [audioStatus, bidirectionalAudioConn, meetingId, selectedAudioDeviceId]);

	const toggleShareStream = useCallback(() => {
		MeetingsApi.updateScreenStreamStatus(meetingId, !shareStatus).then(() =>
			setShareStatus(!shareStatus)
		);
	}, [shareStatus, meetingId]);

	const leaveMeeting = useCallback(() => {
		closeBidirectionalAudioConn(meetingId);
		MeetingsApi.leaveMeeting(meetingId)
			.then(() => goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED))
			.catch(() => console.log('Error on leave'));
	}, [closeBidirectionalAudioConn, meetingId, goToInfoPage]);

	const deleteMeeting = useCallback(() => {
		closeBidirectionalAudioConn(meetingId);
		MeetingsApi.deleteMeeting(meetingId)
			.then(() => goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED))
			.catch(() => console.log('Error on leave'));
	}, [closeBidirectionalAudioConn, meetingId, goToInfoPage]);

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
					setSelectedAudioDeviceId(audioItem.deviceId);
					getAudioStream(true, true, audioItem.deviceId).then((stream) => {
						bidirectionalAudioConn?.updateLocalStreamTrack(stream);
					});
					if (!audioStatus) {
						MeetingsApi.updateAudioStreamStatus(meetingId, !audioStatus).then(() => {
							setAudioStatus(!audioStatus);
						});
					}
				},
				value: audioItem.deviceId
			})),
		[audioMediaList, audioStatus, bidirectionalAudioConn, meetingId]
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
				setAudioMediaList(audioInputs);
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
			<IconButton
				size="large"
				backgroundColor="primary"
				iconColor="gray6"
				icon={meetingViewSelected === MeetingViewType.GRID ? 'Grid' : 'CinemaView'}
				onClick={toggleMeetingView}
			/>
			<Padding right="16px" />
			<IconButton
				iconColor="gray6"
				backgroundColor="primary"
				icon="Headphones"
				onClick={deleteMeeting}
				size="large"
			/>
			<Padding right="16px" />
			<IconButton
				iconColor="gray6"
				backgroundColor="primary"
				icon={videoStatus ? 'Video' : 'VideoOff'}
				onClick={toggleVideoStream}
				size="large"
			/>
			<Padding right="16px" />
			<IconButton
				iconColor="gray6"
				backgroundColor="primary"
				icon={shareStatus ? 'ScreenSharingOn' : 'ScreenSharingOff'}
				onClick={toggleShareStream}
				size="large"
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
