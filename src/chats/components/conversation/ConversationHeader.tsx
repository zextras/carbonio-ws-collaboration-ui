/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { Dispatch, ReactElement, SetStateAction, useCallback } from 'react';

import {
	Container,
	IconButton,
	Row,
	TextWithTooltip,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import useMediaQueryCheck from '../../../hooks/useMediaQueryCheck';
import ConversationHeaderMeetingButton from '../../../meetings/components/headerMeetingButton/ConversationHeaderMeetingButton';
import { getRoomNameSelector } from '../../../store/selectors/RoomsSelectors';
import { getCapability } from '../../../store/selectors/SessionSelectors';
import useStore from '../../../store/Store';
import { CapabilityType } from '../../../types/store/SessionTypes';

type ConversationHeaderProps = {
	roomId: string;
	setInfoPanelOpen: Dispatch<SetStateAction<boolean>>;
};

const RoomInfoHeader = styled(Container)`
	border-bottom: 0.0625rem solid ${({ theme }): string => theme.palette.gray3.regular};
	-webkit-user-select: none;
	user-select: none;
`;

const ConversationHeader = ({
	roomId,
	setInfoPanelOpen
}: ConversationHeaderProps): ReactElement => {
	const [t] = useTranslation();
	const infoTooltip = t('conversationInfo.info', 'Info');
	const roomName = useStore((state) => getRoomNameSelector(state, roomId)) || '';
	const canVideoCall = useStore((store) => getCapability(store, CapabilityType.CAN_VIDEO_CALL));

	const isDesktopView = useMediaQueryCheck();

	const toggleInfoPanel = useCallback(() => {
		setInfoPanelOpen(true);
	}, [setInfoPanelOpen]);

	return (
		<RoomInfoHeader
			height="3rem"
			background="gray5"
			borderRadius="none"
			orientation="horizontal"
			padding={{ vertical: 'medium', horizontal: 'large' }}
		>
			<Row takeAvailableSpace mainAlignment="flex-start">
				<TextWithTooltip>{roomName}</TextWithTooltip>
			</Row>
			<Row>
				{!canVideoCall && ( // TODO change check in canVideoCall &&
					<ConversationHeaderMeetingButton roomId={roomId} />
				)}
				{!isDesktopView && (
					<Tooltip label={infoTooltip}>
						<IconButton
							data-testid="infoPanelToggle"
							onClick={toggleInfoPanel}
							iconColor="secondary"
							size="large"
							icon="InfoOutline"
						/>
					</Tooltip>
				)}
			</Row>
		</RoomInfoHeader>
	);
};

export default ConversationHeader;
