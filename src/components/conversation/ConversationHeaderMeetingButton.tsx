/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IconButton } from '@zextras/carbonio-design-system';
import React, { ReactElement, useCallback } from 'react';

type ConversationHeaderMeetingButtonProps = {
	roomId: string;
};

const ConversationHeaderMeetingButton = ({
	roomId
}: ConversationHeaderMeetingButtonProps): ReactElement => {
	const openMeeting = useCallback(() => window.open(`external/${roomId}`), [roomId]);

	return (
		<IconButton onClick={openMeeting} iconColor="secondary" size="large" icon="VideoOutline" />
	);
};

export default ConversationHeaderMeetingButton;
