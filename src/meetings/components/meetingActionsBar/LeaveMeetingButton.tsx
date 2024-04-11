/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useEffect, useState } from 'react';

import { Button, Container, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import useRouting, { MeetingRoutesParams, PAGE_INFO_TYPE } from '../../../hooks/useRouting';
import { MeetingsApi } from '../../../network';

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
};

const LeaveMeetingButton = ({ isHoovering }: LeaveMeetingButtonProps): ReactElement => {
	const [t] = useTranslation();
	const leaveMeetingLabel = t('meeting.interactions.leaveMeeting', 'Leave Meeting');
	const leaveMeetingButtonLabel = t('meeting.interactions.leaveConfirmation', 'Leave Meeting?');

	const { goToInfoPage } = useRouting();
	const { meetingId }: MeetingRoutesParams = useParams();

	const [active, setActive] = useState(false);
	const [buttonLabel, setButtonLabel] = useState('');

	const activeButton = useCallback(
		(event) => {
			event.stopPropagation();
			setActive(true);
			setButtonLabel(leaveMeetingButtonLabel);
		},
		[leaveMeetingButtonLabel]
	);

	const leaveMeeting = useCallback(
		(event) => {
			event.stopPropagation();
			MeetingsApi.leaveMeeting(meetingId).then(() => {
				goToInfoPage(PAGE_INFO_TYPE.MEETING_ENDED);
			});
		},
		[meetingId, goToInfoPage]
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
		return () => {
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
		<CustomContainer width="fit">
			<Tooltip placement="top" label={leaveMeetingLabel}>
				<CustomButton
					label={buttonLabel}
					size="large"
					color="error"
					icon="LogOutOutline"
					onClick={active ? leaveMeeting : activeButton}
					$active={active}
				/>
			</Tooltip>
		</CustomContainer>
	);
};

export default LeaveMeetingButton;
