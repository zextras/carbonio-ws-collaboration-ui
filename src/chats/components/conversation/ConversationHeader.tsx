/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, {
	Dispatch,
	ReactElement,
	SetStateAction,
	useCallback,
	useEffect,
	useState
} from 'react';

import {
	Container,
	IconButton,
	Row,
	TextWithTooltip,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled, { css, FlattenSimpleInterpolation } from 'styled-components';

import { useIsWritingLabel } from '../../../hooks/useIsWritingLabel';
import useMediaQueryCheck from '../../../hooks/useMediaQueryCheck';
import ConversationHeaderMeetingButton from '../../../meetings/components/headerMeetingButton/ConversationHeaderMeetingButton';
import { getIsPlaceholderRoom, getRoomNameSelector } from '../../../store/selectors/RoomsSelectors';
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

const CustomTextWithTooltip = styled(TextWithTooltip)<{
	$isWritingIsVisible: boolean;
}>`
	@keyframes slideUp {
		0% {
			transform: translateY(0.44rem);
		}

		100% {
			transform: translateY(0);
		}
	}

	@keyframes slideDown {
		0% {
			transform: translateY(-0.44rem);
		}

		100% {
			transform: translateY(0);
		}
	}

	${({
		$isWritingIsVisible
	}: {
		$isWritingIsVisible: boolean;
	}): false | FlattenSimpleInterpolation =>
		$isWritingIsVisible
			? css`
					animation: slideUp 0.4s ease forwards;
				`
			: css`
					animation: slideDown 0.4s ease 0.3s;
				`};
`;

const CustomIsWritingText = styled(Text)`
	opacity: 0;
	transition: opacity 0.2s ease;
	${({ $isWritingIsVisible }: { $isWritingIsVisible: boolean }): string | false =>
		$isWritingIsVisible && 'opacity: 1;'}
`;

const ConversationHeader = ({
	roomId,
	setInfoPanelOpen
}: ConversationHeaderProps): ReactElement => {
	const [t] = useTranslation();
	const infoTooltip = t('conversationInfo.info', 'Info');
	const roomName = useStore((state) => getRoomNameSelector(state, roomId)) || '';
	const canVideoCall = useStore((store) => getCapability(store, CapabilityType.CAN_VIDEO_CALL));
	const isPlaceholderRoom = useStore((state) => getIsPlaceholderRoom(state, roomId));

	const isWritingLabel = useIsWritingLabel(roomId);
	const [isWritingIsDefined, setIsWritingIsDefined] = useState(false);
	const [writingLabel, setWritingLabel] = useState('');

	useEffect(() => {
		if (isWritingLabel === undefined) {
			setIsWritingIsDefined(false);
			setTimeout(() => setWritingLabel(''), 300);
		} else {
			setIsWritingIsDefined(true);
			setWritingLabel(isWritingLabel);
		}
	}, [isWritingLabel]);

	const isDesktopView = useMediaQueryCheck();

	const toggleInfoPanel = useCallback(() => {
		setInfoPanelOpen(true);
	}, [setInfoPanelOpen]);

	return (
		<RoomInfoHeader
			height="3rem"
			minHeight="3rem"
			background="gray5"
			borderRadius="none"
			orientation="horizontal"
			mainAlignment="space-between"
			padding={{ vertical: 'medium', horizontal: 'large' }}
		>
			<Row takeAvailableSpace mainAlignment="flex-start">
				<Container orientation="vertical" width="fit" height=" fit" crossAlignment="flex-start">
					<CustomTextWithTooltip overflow="ellipsis" $isWritingIsVisible={isWritingIsDefined}>
						{roomName}
					</CustomTextWithTooltip>
					<CustomIsWritingText
						size="small"
						color="secondary"
						$isWritingIsVisible={isWritingIsDefined}
						data-testid="is_writing_text"
					>
						{writingLabel}
					</CustomIsWritingText>
				</Container>
			</Row>
			<Container orientation="horizontal" width="fit" style={{ minWidth: 'fit-content' }}>
				{canVideoCall && !isPlaceholderRoom && <ConversationHeaderMeetingButton roomId={roomId} />}
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
			</Container>
		</RoomInfoHeader>
	);
};

export default ConversationHeader;
