/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useContext, useEffect, useState } from 'react';

import styled from '@emotion/styled';
import { Button, Container, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import usePiPWindow from '../../../hooks/usePipWindow';
import useRouting from '../../../hooks/useRouting';
import { MeetingsApi } from '../../../network';
import { PAGE_INFO_TYPE, RouterContext } from '../../contexts/routerContext';

const CustomContainer = styled(Container)`
	> div > button > div {
		text-transform: capitalize !important;
		font-size: 0.9rem !important;
	}
`;

const CustomButton = styled(Button)<{ $active: boolean }>`
	transition: max-width 1s ease 0s;
	height: 2.25rem;
	max-width: ${({ $active }): string => ($active ? '20rem;' : '2.5rem')};
`;

type LeaveMeetingButtonProps = {
	isHoovering: boolean;
	oneClickLeave?: boolean;
	isPip?: boolean;
};

const LeaveMeetingButton = ({
	isHoovering,
	oneClickLeave,
	isPip
}: LeaveMeetingButtonProps): ReactElement => {
	const [t] = useTranslation();
	const leaveMeetingLabel = t('meeting.interactions.leaveMeeting', 'Leave Meeting');
	const leaveMeetingButtonLabel = t('meeting.interactions.leaveConfirmation', 'Leave Meeting?');

	const { closePipWindow } = usePiPWindow();
	const { goToInfoPage } = useRouting();
	const { meetingId } = useContext(RouterContext);

	const [active, setActive] = useState(false);
	const [buttonLabel, setButtonLabel] = useState('');

	const activeButton = useCallback(
		(event: React.MouseEvent<HTMLButtonElement, MouseEvent> | KeyboardEvent) => {
			event.stopPropagation();
			setActive(true);
			setButtonLabel(leaveMeetingButtonLabel);
		},
		[leaveMeetingButtonLabel]
	);

	const leaveMeeting = useCallback(
		(event: React.MouseEvent<HTMLButtonElement, MouseEvent> | KeyboardEvent) => {
			event.stopPropagation();
			MeetingsApi.leaveMeeting(meetingId!).then(() => {
				goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED);
				if (isPip) {
					closePipWindow();
				}
			});
		},
		[meetingId, goToInfoPage, isPip, closePipWindow]
	);

	useEffect(() => {
		const handleClick = (): void => {
			setActive(false);
			setTimeout(() => {
				if (buttonLabel.length !== 0) {
					setButtonLabel('');
				}
			}, 800);
		};
		document.addEventListener('click', handleClick);
		return (): void => {
			document.removeEventListener('click', handleClick);
		};
	}, [buttonLabel]);

	useEffect(() => {
		if (!isHoovering) {
			setActive(false);
			setTimeout(() => setButtonLabel(''), 800);
		}
	}, [isHoovering]);

	return (
		<CustomContainer width="fit" height="fit">
			<Tooltip placement="top" label={leaveMeetingLabel}>
				<CustomButton
					label={buttonLabel}
					size="large"
					color="error"
					icon="LogOutOutline"
					onClick={active || oneClickLeave ? leaveMeeting : activeButton}
					$active={active}
				/>
			</Tooltip>
		</CustomContainer>
	);
};

export default LeaveMeetingButton;
