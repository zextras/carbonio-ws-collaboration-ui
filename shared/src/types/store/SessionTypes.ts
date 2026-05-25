/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Message } from './ChatsRegistryTypes';
import { UserType } from './UserTypes';

export type AccountSettings = {
	attrs: { [key: string]: string };
};

export type SessionStoreSlice = {
	session: Session;
	setLoginInfo: (session: Session) => void;
	setAttributes: (attrs: AccountSettings['attrs']) => void;
	setCapabilities: (capabilities: AttributesList) => void;
	setQueueId: (queueId: string) => void;
	setSelectedRoom: (roomId?: string) => void;
	setCustomLogo: (logo: string) => void;
	setChatExporting: (roomId?: string, chatExporter?: IChatExporter) => void;
	setChatExportStatus: (status: ExportStatus) => void;
	setApiVersion: (apiVersion: Version) => void;
	setSupportedVersions: (versions: Version[]) => void;
	reset: () => void;
};

export type Session = {
	id?: string;
	email?: string;
	name?: string;
	displayName?: string;
	queueId?: string;
	apiVersion?: Version;
	supportedVersions?: Version[];
	userType?: UserType;
	attributes?: AttributesList;
	selectedRoom?: string;
	customLogo?: string;
	chatExporting?: {
		roomId: string;
		exporter: IChatExporter;
		status: ExportStatus;
	};
	zmAuthToken?: string; // Mobile field
	zxAuthToken?: string; // Mobile field
	server?: string; // Mobile field
	_persistedAt?: number;
};

export type Version = `${number}.${number}.${number}`;

export type AttributesList = {
	privateChatCreationEnabled: boolean;
	groupChatCreationEnabled: boolean;
	maxGroupMembers: number;
	messageDeleteTimeLimit: number;
	messageEditTimeLimit: number;
	maxRoomPictureSize: number;
	attachmentUploadEnabled: boolean;
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

export interface IChatExporter {
	addMessagesToFullHistory(messages: Message[]): void;
	continueExporting(): void;
	exportHistory(): void;
}
