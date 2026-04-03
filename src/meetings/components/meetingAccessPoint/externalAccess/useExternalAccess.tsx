/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useEffect, useState } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MEETINGS_PATH } from '../../../../constants/appConstants';
import useRouting from '../../../../hooks/useRouting';
import { createGuestAccount, getScheduledMeetingName } from '../../../../network';
import { wsClient } from '../../../../network/websocket/WebSocketClient';
import { xmppClient } from '../../../../network/xmpp/XMPPClient';
import useStore from '../../../../store/Store';
import { UserType } from '../../../../types/store/UserTypes';
import { setDateDefault } from '../../../../utils/dateUtils';
import { PAGE_INFO_TYPE } from '../../../contexts/routerContext';

const useExternalAccess = (): {
	meetingName: string;
	createGuestAccount: (guestName: string) => void;
} => {
	const { t, i18n } = useTranslation();
	const generalErrorSnackbar = t(
		'settings.profile.errorGenericResponse',
		'Something went Wrong. Please Retry'
	);

	const [meetingName, setMeetingName] = useState<string>('');

	const { goToInfoPage } = useRouting();
	const createSnackbar = useSnackbar();

	useEffect(() => {
		const browserLanguage = navigator.languages?.[0] || navigator.language;
		const selectedLanguage = ['zh', 'zh-CN', 'zh-HK', 'zh-TW'].includes(browserLanguage)
			? 'zh_CN'
			: browserLanguage.split('-')[0];
		i18n.changeLanguage(selectedLanguage);
		setDateDefault(selectedLanguage);
	}, [i18n]);

	useEffect(() => {
		const meetingId = window.location.pathname.split(MEETINGS_PATH)[1];
		getScheduledMeetingName(meetingId)
			.then((resp) => {
				setMeetingName(resp.name);
			})
			.catch(() => {
				goToInfoPage(PAGE_INFO_TYPE.MEETING_NOT_FOUND);
			});
	}, [goToInfoPage]);

	const createGuestAccountAction = useCallback(
		(guestName: string) => {
			const { setLoginInfo, setChatsBeStatus, setAttributes } = useStore.getState();
			createGuestAccount(guestName)
				.then((res) => {
					document.cookie = `ZM_AUTH_TOKEN=${res.zmToken}; path=/`;
					document.cookie = `ZX_AUTH_TOKEN=${res.zxToken}; path=/`;
					setLoginInfo({ id: res.id, name: guestName, userType: UserType.GUEST });

					setChatsBeStatus(true);
					xmppClient.connect(res.zmToken);
					wsClient.connect();

					setAttributes({
						carbonioWscShowMessageReads: 'TRUE',
						carbonioWscMessageDeleteTimeLimit: '10m',
						carbonioWscMessageEditTimeLimit: '10m'
					});
				})
				.catch(() => {
					setChatsBeStatus(false);
					createSnackbar({
						key: new Date().toLocaleString(),
						severity: 'error',
						label: generalErrorSnackbar,
						hideButton: true,
						autoHideTimeout: 5000
					});
				});
		},
		[createSnackbar, generalErrorSnackbar]
	);

	return { meetingName, createGuestAccount: createGuestAccountAction };
};
export default useExternalAccess;
