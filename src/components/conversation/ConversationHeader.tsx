/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, IconButton, Text as DSText, Tooltip } from '@zextras/carbonio-design-system';
import React, { Dispatch, ReactElement, SetStateAction, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { getRoomNameSelector } from '../../store/selectors/RoomsSelectors';
import useStore from '../../store/Store';
import useMediaQueryCheck from '../../utils/useMediaQueryCheck';

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
	const isDesktopView = useMediaQueryCheck();

	const toggleInfoPanel = useCallback(() => {
		setInfoPanelOpen(true);
	}, [setInfoPanelOpen]);

	return (
		<Container height="fit">
			<RoomInfoHeader
				height="3rem"
				background="gray5"
				borderRadius="none"
				orientation="horizontal"
				mainAlignment="space-between"
				padding={{ vertical: 'medium', horizontal: 'large' }}
			>
				<Container crossAlignment="flex-start" maxWidth="94%">
					<DSText title={roomName} overflow="ellipsis">
						{roomName}
					</DSText>
				</Container>
				<Container orientation="horizontal" width="fit" style={{ minWidth: 'fit-content' }}>
					{!isDesktopView && (
						<Tooltip label={infoTooltip}>
							<IconButton
								onClick={toggleInfoPanel}
								iconColor="secondary"
								size="large"
								icon="InfoOutline"
							/>
						</Tooltip>
					)}
				</Container>
			</RoomInfoHeader>
		</Container>
	);
};

export default ConversationHeader;
