/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { Dispatch, FC, SetStateAction, useCallback, useMemo } from 'react';

import { Container, IconButton, Text, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import GroupRoomPictureHandler from './GroupRoomPictureHandler';
import OneToOneRoomPictureHandler from './OneToOneRoomPictureHandler';
import useMediaQueryCheck from '../../../../hooks/useMediaQueryCheck';
import { getRoomMembers } from '../../../../store/selectors/RoomsSelectors';
import useStore from '../../../../store/Store';
import { Member, RoomType } from '../../../../types/store/RoomTypes';

type ConversationInfoProps = {
	roomId: string;
	roomType: string;
	setInfoPanelOpen: Dispatch<SetStateAction<boolean>>;
};

const InfoHeader = styled(Container)`
	border-bottom: 0.0625rem solid ${({ theme }): string => theme.palette.gray3.regular};
	height: 3rem;
	-webkit-user-select: none;
	user-select: none;
`;

const ConversationInfo: FC<ConversationInfoProps> = ({ roomId, roomType, setInfoPanelOpen }) => {
	const [t] = useTranslation();
	const messagesTooltip = t('conversationInfo.messages', 'Messages');
	const infoLabel = t('conversationInfo.info', 'Info');

	const sessionId: string | undefined = useStore((store) => store.session.id);
	const roomMembers: Member[] | undefined = useStore((state) => getRoomMembers(state, roomId));
	const isDesktopView = useMediaQueryCheck();

	const memberId: string = useMemo(() => {
		if (roomType === RoomType.ONE_TO_ONE && roomMembers !== undefined) {
			if (roomMembers[0].userId === sessionId) return roomMembers[1].userId;
			return roomMembers[0].userId;
		}
		return '';
	}, [roomMembers, roomType, sessionId]);

	const infoAvatar = useMemo(() => {
		if (roomType === RoomType.ONE_TO_ONE) {
			return <OneToOneRoomPictureHandler memberId={memberId} />;
		}
		return <GroupRoomPictureHandler roomId={roomId} />;
	}, [roomType, memberId, roomId]);

	const toggleMessageList = useCallback(() => {
		setInfoPanelOpen(false);
	}, [setInfoPanelOpen]);

	return (
		<Container orientation="vertical">
			<InfoHeader
				background="gray5"
				borderRadius="none"
				orientation="horizontal"
				mainAlignment="space-between"
				padding={{ vertical: 'medium', horizontal: 'large' }}
			>
				<Text title={infoLabel} overflow="ellipsis">
					{infoLabel}
				</Text>
				{!isDesktopView && (
					<Tooltip label={messagesTooltip}>
						<IconButton
							data-testid="closeInfoPanel"
							onClick={toggleMessageList}
							iconColor="secondary"
							size="large"
							icon="MessageCircleOutline"
						/>
					</Tooltip>
				)}
			</InfoHeader>
			{infoAvatar}
		</Container>
	);
};

export default ConversationInfo;
