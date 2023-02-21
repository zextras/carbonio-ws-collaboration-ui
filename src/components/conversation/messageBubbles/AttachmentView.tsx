/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { FC, useEffect } from 'react';

import { AttachmentsApi } from '../../../network';
import { AttachmentMessageType } from '../../../types/store/MessageTypes';

type AttachmentViewProps = {
	attachment: AttachmentMessageType;
};

const AttachmentView: FC<AttachmentViewProps> = ({ attachment }) => {
	useEffect(() => {
		AttachmentsApi.getAttachmentInfo(attachment.id).then((resp) => console.log(resp));
	}, [attachment]);

	return <Container>attachment</Container>;
};

export default AttachmentView;
