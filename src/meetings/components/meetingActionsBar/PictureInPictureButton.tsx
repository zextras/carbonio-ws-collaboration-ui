/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback } from 'react';

import { Button, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import usePiPWindow from '../../../hooks/usePipWindow';

const PictureInPictureButton = (): ReactElement | null => {
	const [t] = useTranslation();
	const enablePip = t('meeting.pip.trigger', 'Enable PiP');
	const disablePip = t('meeting.pip.close', 'Disable PiP');

	const { isSupported, requestPipWindow, pipWindow, closePipWindow } = usePiPWindow();

	const togglePip = useCallback(() => {
		if (isSupported && pipWindow == null) {
			requestPipWindow(320, 331);
		} else if (pipWindow != null) {
			closePipWindow();
		}
	}, [closePipWindow, isSupported, pipWindow, requestPipWindow]);

	if (!isSupported) return null;
	return (
		<Tooltip placement="top" label={pipWindow != null ? disablePip : enablePip}>
			<Button
				size="large"
				backgroundColor="primary"
				labelColor="gray6"
				icon={pipWindow != null ? 'CloseSquareOutline' : 'ExternalLinkOutline'}
				onClick={togglePip}
			/>
		</Tooltip>
	);
};

export default PictureInPictureButton;
