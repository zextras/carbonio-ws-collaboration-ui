/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AccountSettingsAttrs } from '@zextras/carbonio-shell-ui/lib/types/account';

import { UserType } from './UserTypes';
import { IChatExporter } from '../../settings/components/chatExporter/ChatExporter';

export type SessionStoreSlice = {
	session: Session;
	setLoginInfo: (id: string, name: string, displayName?: string, userType?: UserType) => void;
	setAttributes: (attrs: AccountSettingsAttrs) => void;
	setQueueId: (queueId: string) => void;
	setSelectedRoom: (roomId?: string) => void;
	setCustomLogo: (logo: string | false) => void;
	setChatExporting: (roomId?: string) => void;
	setChatExportStatus: (status: ExportStatus) => void;
};

export type Session = {
	id?: string;
	email?: string;
	name?: string;
	displayName?: string;
	queueId?: string;
	userType?: UserType;
	attributes?: AttributesList;
	selectedRoom?: string;
	customLogo?: string | false;
	chatExporting?: {
		roomId: string;
		exporter: IChatExporter;
		status: ExportStatus;
	};
};

export type AttributesList = {
	privateChatCreation: boolean;
	groupChatCreation: boolean;
	maxGroupMembers: number;
	messageDeleteTimeLimit: number;
	messageEditTimeLimit: number;
	maxRoomPictureSize: number;
	attachmentUpload: boolean;
	maxAttachmentSize: number;
	showMessageReads: boolean;
	showUsersPresence: boolean;
	videoCallEnabled: boolean;
	recordingEnabled: boolean;
	virtualBackgroundEnabled: boolean;
};

export enum ExportStatus {
	EXPORTING = 'exporting',
	DOWNLOADING = 'downloading'
}
