/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import { Button, Container, Padding, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useMuteForAll from '../../../hooks/useMuteForAll';
import usePinnedTile from '../../../hooks/usePinnedTile';
import MuteForAllModal from '../sidebar/ParticipantsAccordion/MuteForAllModal';

export const HoverContainer = styled(Container)`
	aspect-ratio: 16/9;
	border-radius: 0.5rem;
	height: auto;
	opacity: 0;
	position: absolute;
	background-color: rgba(255, 255, 255, 0.7);
	z-index: 1;
	-webkit-transition: opacity 200ms linear 300ms;
	-moz-transition: opacity 200ms linear 300ms;
	-o-transition: opacity 200ms linear 300ms;
	transition: opacity 100ms linear 200ms;
`;

const CustomButton = styled(Button)`
	padding: 0.75rem;
	& > svg {
		width: 1.5rem;
		min-width: 1.5rem;
		height: 1.5rem;
		min-height: 1.5rem;
	}
`;

type tileHoverContainerProps = {
	meetingId: string | undefined;
	userId: string | undefined;
	isScreenShare: boolean | undefined;
	isHoovering: boolean;
};

const TileHoverContainer: FC<tileHoverContainerProps> = ({
	meetingId,
	userId,
	isScreenShare,
	isHoovering
}) => {
	const [t] = useTranslation();
	const pinVideoLabel = t('tooltip.pinVideo', 'Pin video');
	const unpinVideoLabel = t('tooltip.unpinVideo', 'Unpin video');
	const muteForAllLabel = t('tooltip.muteForAll', 'Mute for all');

	const [muteForAllModalIsOpen, setMuteForAllModalIsOpen] = useState(false);

	const { muteForAllHasToAppear, muteForAll } = useMuteForAll(meetingId, userId);

	const { canUsePinFeature, isPinned, switchPinnedTile } = usePinnedTile(
		meetingId || '',
		userId || '',
		isScreenShare
	);

	const canUseMuteForAll = useMemo(
		() => !isScreenShare && muteForAllHasToAppear,
		[isScreenShare, muteForAllHasToAppear]
	);

	const openMuteForAllModal = useCallback(() => {
		setMuteForAllModalIsOpen(true);
	}, []);

	const closeMuteForAllModal = useCallback(() => {
		setMuteForAllModalIsOpen(false);
	}, []);

	return (
		<HoverContainer width="100%" data-testid="hover_container" orientation="horizontal">
			{canUseMuteForAll && (
				<Tooltip label={muteForAllLabel} disabled={!isHoovering}>
					<CustomButton
						icon="MicOffOutline"
						backgroundColor="text"
						labelColor="gray6"
						size="large"
						shape="round"
						onClick={openMuteForAllModal}
					/>
				</Tooltip>
			)}
			{canUseMuteForAll && canUsePinFeature && <Padding right="1rem" />}
			{canUsePinFeature && (
				<Tooltip label={isPinned ? unpinVideoLabel : pinVideoLabel} disabled={!isHoovering}>
					<CustomButton
						icon={!isPinned ? 'Pin3Outline' : 'Unpin3Outline'}
						color="text"
						size="large"
						shape="round"
						onClick={switchPinnedTile}
					/>
				</Tooltip>
			)}
			{muteForAllModalIsOpen && (
				<MuteForAllModal
					isOpen={muteForAllModalIsOpen}
					closeModal={closeMuteForAllModal}
					muteForAll={muteForAll}
				/>
			)}
		</HoverContainer>
	);
};

export default TileHoverContainer;
