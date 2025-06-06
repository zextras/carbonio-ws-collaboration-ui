/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types */
/**
 * Zextras Carbonio Workstream Collaboration API
 * Zextras Carbonio Workstream Collaboration HTTP APIs definition.
 * OpenAPI spec version: 1.6.0
 */
/**
 * Error object returned from requests with developer mode active
 */
export type Error = {
	/** random hash used to identify the error within logs */
	readonly traceId?: string;
	/** a message describing the error */
	readonly message?: string;
};

/**
 * Health status of the service and its dependencies
 */
export type HealthStatus = {
	/** describes if the service is alive */
	readonly isLive?: boolean;
	status?: HealthStatusType;
	/** health of this service dependencies */
	dependencies?: DependencyHealth[];
};

/**
 * Health status types
 */
export type HealthStatusType = (typeof HealthStatusType)[keyof typeof HealthStatusType];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const HealthStatusType = {
	ok: 'ok',
	warn: 'warn',
	error: 'error'
} as const;

/**
 * Health status of a service dependency
 */
export type DependencyHealth = {
	name?: DependencyHealthType;
	/** whether the dependency is available and operative */
	readonly isHealthy?: boolean;
};

/**
 * Health dependency types
 */
export type DependencyHealthType = (typeof DependencyHealthType)[keyof typeof DependencyHealthType];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const DependencyHealthType = {
	database: 'database',
	xmpp_server: 'xmpp_server',
	event_dispatcher: 'event_dispatcher',
	storage_service: 'storage_service',
	previewer_service: 'previewer_service',
	authentication_service: 'authentication_service',
	profiling_service: 'profiling_service',
	videoserver_service: 'videoserver_service'
} as const;

/**
 * Identifier object
 */
export type Id = {
	/** identifier */
	readonly id: string;
};

export type ClearedDate = {
	/** date since messages were cleared */
	readonly clearedAt: string;
};

export type Capabilities = {
	/** indicates whether it can see if the messages have been read */
	canSeeMessageReads: boolean;
	/** indicates whether it can see the presence of the other users */
	canSeeUsersPresence: boolean;
	/** indicates whether it can access video calls */
	canVideoCall: boolean;
	/** indicates whether it can record video calls */
	canVideoCallRecord: boolean;
	/** indicates whether it can use a virtual background */
	canUseVirtualBackground: boolean;
	/** limit of minutes within which a message can be edited */
	editMessageTimeLimitInMinutes: number;
	/** limit of minutes within which a message can be deleted */
	deleteMessageTimeLimitInMinutes: number;
	/** maximum number of users who can be members of a group */
	maxGroupMembers: number;
	/** maximum size for a room image in kB */
	maxRoomImageSizeInKb: number;
	/** maximum size for a user image in kB */
	maxUserImageSizeInKb: number;
};

/**
 * user type
 */
export type UserType = (typeof UserType)[keyof typeof UserType];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const UserType = {
	internal: 'internal',
	guest: 'guest'
} as const;

/**
 * User data
 */
export type User = {
	/** user's id */
	readonly id: string;
	/** user's email */
	readonly email: string;
	/** user's name */
	readonly name: string;
	/** user type */
	readonly type?: UserType;
	/** the user's status message */
	statusMessage?: string;
};

/**
 * Managed room types
 */
export type RoomType = (typeof RoomType)[keyof typeof RoomType];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const RoomType = {
	group: 'group',
	one_to_one: 'one_to_one',
	temporary: 'temporary'
} as const;

/**
 * Room fields that can be updated
 */
export type RoomEditableFields = {
	/**
	 * room name
	 * @minLength 1
	 * @maxLength 128
	 */
	name?: string;
	/**
	 * room description
	 * @minLength 0
	 * @maxLength 256
	 */
	description?: string;
};

export type RoomCreationFieldsAllOf = {
	type?: RoomType;
};

/**
 * Room fields for its creation
 */
export type RoomCreationFields = RoomEditableFields &
	RoomCreationFieldsAllOf & {
		/** list of users to add to the room */
		members?: Member[];
	} & Required<
		Pick<
			RoomEditableFields &
				RoomCreationFieldsAllOf & {
					/** list of users to add to the room */
					members?: Member[];
				},
			'type'
		>
	>;

export type RoomAllOf = {
	/** room identifier */
	readonly id?: string;
	/** identifier of associated meeting */
	readonly meetingId?: string;
	/** entity creation date */
	readonly createdAt?: string;
	/** entity update date */
	readonly updatedAt?: string;
	/** room profile picture update timestamp,
returned only if the room picture was set at least once
 */
	readonly pictureUpdatedAt?: string;
	userSettings?: RoomUserSettings;
};

/**
 * Room data
 */
export type Room = RoomCreationFields &
	RoomAllOf &
	Required<Pick<RoomCreationFields & RoomAllOf, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Preferences that an user has set for a room
 */
export type RoomUserSettings = {
	/** indicates whether the user has muted */
	muted: boolean;
	/** room clear history date,
returned only if the room clear history has been cleared at least once
 */
	clearedAt: string;
};

/**
 * Room extra fields
 */
export type RoomExtraField = (typeof RoomExtraField)[keyof typeof RoomExtraField];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const RoomExtraField = {
	members: 'members',
	settings: 'settings'
} as const;

/**
 * room member list
 */
export type Members = Member[];

/**
 * Information about a user's role in the room
 */
export type Member = {
	/** user identifier */
	userId: string;
	/** indicates whether it is the owner */
	owner?: boolean;
};

/**
 * members to insert in the room
 */
export type MembersToInsert = MemberToInsert[];

export type MemberToInsertAllOf = {
	/** indicates whether it can see previous messages,
after it has been added to the room
 */
	historyCleared: boolean;
};

/**
 * Information about the members to insert in the room
 */
export type MemberToInsert = Member &
	MemberToInsertAllOf &
	Required<Pick<Member & MemberToInsertAllOf, 'owner'>>;

/**
 * members inserted in the room
 */
export type MembersInserted = MemberInserted[];

export type MemberInsertedAllOf = {
	/** room clear history timestamp,
returned only if the room history has been cleared at least once
 */
	clearedAt: string;
};

/**
 * Information about the member to inserted in the room
 */
export type MemberInserted = Member &
	MemberInsertedAllOf &
	Required<Pick<Member & MemberInsertedAllOf, 'owner'>>;

/**
 * Attachment of a message
 */
export type Attachment = {
	/** identifier */
	readonly id: string;
	/** file name */
	name: string;
	/** file length */
	readonly size: number;
	/** mime type */
	readonly mimeType: string;
	/** identifier of updated user */
	readonly userId: string;
	/** identifier of destination room */
	readonly roomId: string;
	/** creation date */
	readonly createdAt?: string;
	/** attachment's area */
	readonly area?: string;
};

/**
 * Attachment pagination
 */
export type AttachmentsPagination = {
	/** filter for the next page */
	filter?: string;
	/** paged list of attachments metadata */
	attachments?: Attachment[];
};

/**
 * authenticated tokens
 */
export type Token = {
	/** ZM token */
	zmToken?: string;
};

/**
 * Class representing all the image quality accepted values
 */
export type ImageQualityEnum = (typeof ImageQualityEnum)[keyof typeof ImageQualityEnum];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const ImageQualityEnum = {
	Lowest: 'Lowest',
	Low: 'Low',
	Medium: 'Medium',
	High: 'High',
	Highest: 'Highest'
} as const;

/**
 * Class representing all the image type accepted values
 */
export type ImageTypeEnum = (typeof ImageTypeEnum)[keyof typeof ImageTypeEnum];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const ImageTypeEnum = {
	Jpeg: 'Jpeg',
	Png: 'Png',
	Gif: 'Gif'
} as const;

/**
 * Class representing all the image shape accepted values
 */
export type ImageShapeEnum = (typeof ImageShapeEnum)[keyof typeof ImageShapeEnum];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const ImageShapeEnum = {
	Rounded: 'Rounded',
	Rectangular: 'Rectangular'
} as const;

/**
 * Room data
 */
export type ForwardMessagesList = ForwardMessage[];

/**
 * Message to forward
 */
export type ForwardMessage = {
	/** XML message to forward */
	originalMessage: string;
	/** date and time the original message was sent */
	originalMessageSentAt?: string;
	/** description of the forwarded message */
	description?: string;
};

export type NewMeetingData = {
	name: string;
	roomId?: string;
	meetingType: MeetingType;
	/** This field is only used for scheduled meetings to indicate when the meeting will no more be necessary */
	expiration?: string;
};

export type JoinMeetingResult = {
	status?: JoinStatus;
};

export type QueuedUsers = {
	users?: string[];
};

/**
 * Defines a user in the access list of a meeting
 */
export type MeetingUser = {
	/** user identifier */
	userId?: string;
	userType?: MeetingUserType;
};

/**
 * Defines the type of meeting, if permanent it will never be automatically deleted, if scheduled it will be removed after the expiration is passed
 */
export type MeetingType = (typeof MeetingType)[keyof typeof MeetingType];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const MeetingType = {
	permanent: 'permanent',
	scheduled: 'scheduled'
} as const;

export type MeetingUserType = (typeof MeetingUserType)[keyof typeof MeetingUserType];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const MeetingUserType = {
	moderator: 'moderator',
	registered: 'registered'
} as const;

export type QueueUpdateStatus = (typeof QueueUpdateStatus)[keyof typeof QueueUpdateStatus];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const QueueUpdateStatus = {
	ACCEPTED: 'ACCEPTED',
	REJECTED: 'REJECTED'
} as const;

export type JoinStatus = (typeof JoinStatus)[keyof typeof JoinStatus];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const JoinStatus = {
	ACCEPTED: 'ACCEPTED',
	WAITING: 'WAITING'
} as const;

export type ParticipantAllOf = {
	/** Reference to the user queue of the user */
	readonly queueId?: string;
	/** indicates the audio stream status */
	readonly audioStreamEnabled?: boolean;
	/** indicates the video stream status */
	readonly videoStreamEnabled?: boolean;
	/** indicates the screen share stream status */
	readonly screenStreamEnabled?: boolean;
	/** participant joining timestamp */
	readonly joinedAt?: string;
	/** participant hand raising timestamp */
	readonly handRaisedAt?: string;
};

/**
 * Meeting participant data
 */
export type Participant = MeetingUser & ParticipantAllOf;

/**
 * Meeting data
 */
export type Meeting = {
	/** meeting identifier */
	readonly id?: string;
	/** The meeting name */
	name?: string;
	/** room identifier */
	readonly roomId?: string;
	/** Indicates if the meeting is active */
	active?: boolean;
	participants?: Participant[];
	/** entity creation date */
	readonly createdAt?: string;
	/** meeting starting time */
	readonly startedAt?: string;
	meetingType?: MeetingType;
	/** start recording timestamp */
	readonly recStartedAt?: string;
	/** user who started the recording */
	readonly recUserId?: string;
};

/**
 * public Meeting data
 */
export type PublicMeeting = {
	/** the Meeting name */
	name?: string;
};

/**
 * user's streams settings to join a meeting
 */
export type JoinSettings = {
	/** indicates the audio stream status to join the meeting */
	audioStreamEnabled: boolean;
	/** indicates the video stream status to join the meeting */
	videoStreamEnabled: boolean;
};

/**
 * indicates the media stream type
 */
export type MediaStreamSettingsType =
	(typeof MediaStreamSettingsType)[keyof typeof MediaStreamSettingsType];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const MediaStreamSettingsType = {
	video: 'video',
	screen: 'screen'
} as const;

/**
 * settings to apply on user's media stream
 */
export type MediaStreamSettings = {
	/** indicates the media stream type */
	type: MediaStreamSettingsType;
	/** indicates the status to change the media stream to */
	enabled: boolean;
	/** indicates the descriptor of the session */
	sdp?: string;
};

/**
 * settings to apply on user's audio stream
 */
export type AudioStreamSettings = {
	/** indicates the status to change the audio stream to */
	enabled: boolean;
	/** optional user to mute if i'm a moderator, only works if enabled is false */
	userToModerate?: string;
};

/**
 * contains sdp descriptor needed for a media stream to perform WebRTC negotiation
 */
export type SessionDescriptionProtocol = {
	/** indicates the descriptor of the session */
	sdp: string;
};

/**
 * subscriptions updates related to media streams
 */
export type SubscriptionUpdates = {
	/** indicates the media streams which user wants to subscribe to */
	subscribe: MediaStream[];
	/** indicates the media streams which user wants to unsubscribe to */
	unsubscribe: MediaStream[];
};

/**
 * indicates the media stream type
 */
export type MediaStreamType = (typeof MediaStreamType)[keyof typeof MediaStreamType];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const MediaStreamType = {
	video: 'video',
	screen: 'screen'
} as const;

/**
 * representation of meeting media stream
 */
export type MediaStream = {
	/** user identifier which owns the related media stream */
	userId: string;
	/** indicates the media stream type */
	type: MediaStreamType;
};

/**
 * Queued user update data
 */
export type QueuedUserUpdate = {
	status?: QueueUpdateStatus;
};

/**
 * Recording data used to upload it on Files service
 */
export type RecordingFields = {
	/**
	 * recording name
	 * @minLength 1
	 * @maxLength 128
	 */
	name: string;
	/** folder id where the recording will be saved */
	folderId: string;
};

/**
 * the hand action the user wants to perform
 */
export type HandStatus = {
	/** indicates the status to change the hand to */
	raised: boolean;
	/** optionally lower the user's hand if I'm a moderator, only works if raised is false */
	userToModerate?: string;
};

/**
 * General status of the service and its dependencies
 */
export type N200HealthStatusResponse = HealthStatus;

/**
 * The service is alive
 */
export type N204IsLiveResponse = void;

/**
 * The service is ready to receive requests
 */
export type N204IsReadyResponse = void;

/**
 * The service is ready but some non-fundamental dependencies are not reachable
 */
export type N429IsReadyResponse = void;

/**
 * The service is not yet ready to receive requests
 */
export type N500IsReadyResponse = void;

/**
 * List of every room that the user has access to
 */
export type N200ListRoomsResponse = Room[];

/**
 * The newly created room
 */
export type N201InsertRoomResponse = Room;

/**
 * Requested room
 */
export type N200GetRoomResponse = Room;

/**
 * Updated room
 */
export type N200UpdateRoomResponse = Room;

/**
 * Room was deleted correctly or it never existed
 */
export type N204DeleteRoomResponse = void;

/**
 * The requested picture
 */
export type N200GetRoomPictureResponse = Blob;

/**
 * Room picture was changed correctly
 */
export type N204UpdateRoomPictureResponse = void;

/**
 * Room picture was deleted correctly
 */
export type N204DeleteRoomPictureResponse = void;

/**
 * Room was muted correctly
 */
export type N204MuteRoomResponse = void;

/**
 * Room was unmuted correctly
 */
export type N204UnmuteRoomResponse = void;

/**
 * Cleaning date of messages
 */
export type N200ClearRoomResponse = ClearedDate;

/**
 * The room members list
 */
export type N200ListRoomMembersResponse = Member[];

/**
 * The members added or invited
 */
export type N200InsertRoomMembersResponse = MembersInserted;

/**
 * The list of the room members updated
 */
export type N200UpdateRoomOwnersResponse = Member[];

/**
 * The member was deleted correctly or it never existed
 */
export type N204DeleteRoomMemberResponse = void;

/**
 * The member was promoted
 */
export type N204InsertOwnerResponse = void;

/**
 * The member was demoted
 */
export type N204DeleteOwnerResponse = void;

/**
 * User capabilities
 */
export type N200GetCapabilities = Capabilities;

/**
 * Requested user
 */
export type N200GetUserResponse = User;

/**
 * The requested users list
 */
export type N200GetUsersByIdsResponse = User[];

/**
 * File identifier
 */
export type N201InsertAttachmentResponse = Id;

/**
 * Paged list of metadata of every attachment uploaded to the room
 */
export type N200ListRoomAttachmentsInfoResponse = AttachmentsPagination;

/**
 * The file was deleted correctly
 */
export type N204DeleteAttachmentResponse = void;

/**
 * Attachment informations
 */
export type N200GetAttachmentInfoResponse = Attachment;

/**
 * The requested file
 */
export type N200GetAttachmentResponse = Blob;

/**
 * The preview of the requested file
 */
export type N200PreviewFileResponse = Blob;

/**
 * The authenticated tokens.
 */
export type N200GetTokensResponse = Token;

/**
 * Gets the requested meeting data
 */
export type N200GetRoomMeetingResponse = Meeting;

/**
 * successfully forwarded the messages
 */
export type N204ForwardMessagesResponse = void;

/**
 * The meeting just created
 */
export type N200CreateMeetingResponse = Meeting;

/**
 * List of every meeting that the user has access to
 */
export type N200ListMeetingResponse = Meeting[];

/**
 * The result of the join operation for the meeting
 */
export type N200JoinMeetingResponse = JoinMeetingResult;

/**
 * Gets the requested meeting data
 */
export type N200GetMeetingResponse = Meeting;

/**
 * Gets the public data of a meeting
 */
export type N200GetPublicMeetingResponse = PublicMeeting;

/**
 * The meeting was started successfully
 */
export type N200StartMeetingResponse = Meeting;

/**
 * The meeting was stopped successfully
 */
export type N200StopMeetingResponse = Meeting;

/**
 * The list of queued users
 */
export type N200QueueResponse = QueuedUsers;

/**
 * The queued user was updated successfully
 */
export type N204UpdateQueuedUserResponse = void;

/**
 * The meeting was deleted successfully
 */
export type N204DeleteMeetingResponse = void;

/**
 * The user exited the meeting successfully
 */
export type N204LeaveMeetingResponse = void;

/**
 * The status of audio stream changed successfully
 */
export type N204AudioStreamResponse = void;

/**
 * The offer related to the audio stream has been processed and sent successfully
 */
export type N204OfferAudioStreamResponse = void;

/**
 * The status of media stream changed successfully
 */
export type N204MediaStreamResponse = void;

/**
 * The answer related to the media stream has been processed and sent successfully
 */
export type N204AnswerMediaStreamResponse = void;

/**
 * The user subscribed to media streams successfully
 */
export type N204SubscribeMediaStreamResponse = void;

/**
 * The recording has been started successfully
 */
export type N204StartMeetingRecordingResponse = void;

/**
 * The recording has been stopped successfully
 */
export type N204StopMeetingRecordingResponse = void;

/**
 * The hand action has been performed successfully
 */
export type N204HandStatusResponse = void;

/**
 * The request had wrong or missing parameters
 */
export type N400BadRequestResponse = void;

/**
 * User not authorized
 */
export type N401UnauthorizedResponse = void;

/**
 * The requester could not access the resource
 */
export type N403ForbiddenResponse = void;

/**
 * The requested resource was not found
 */
export type N404NotFoundResponse = void;

/**
 * The request conflict with the current state
 */
export type N409Conflict = void;

/**
 * The request had a payload that was too big
 */
export type N413PayloadTooLargeResponse = void;

/**
 * The service was unavailable
 */
export type N502BadGatewayResponse = void;

/**
 * room to insert
 */
export type InsertRoomRequestBody = RoomCreationFields;

/**
 * room fields to update
 */
export type UpdateRoomRequestBody = RoomEditableFields;

/**
 * image to set
 */
export type UpdateRoomPictureRequestBody = Blob;

/**
 * members to add or invite
 */
export type InsertRoomMembersRequestBody = MembersToInsert;

/**
 * members to update
 */
export type UpdateRoomOwnersRequestBody = Members;

/**
 * file stream
 */
export type InsertAttachmentRequestBody = Blob;

/**
 * Messages forwarding request
 */
export type ForwardMessagesRequestBody = ForwardMessagesList;

/**
 * user request containing its streams settings to join a meeting
 */
export type JoinMeetingRequestBody = JoinSettings;

/**
 * Data to create a new meeting
 */
export type CreateMeetingRequestBody = NewMeetingData;

/**
 * user request to update a media stream status
 */
export type UpdateMediaStreamRequestBody = MediaStreamSettings;

/**
 * user request to update a meeting stream status
 */
export type UpdateAudioStreamRequestBody = AudioStreamSettings;

/**
 * user request to send a rtc session description related to media stream for WebRTC negotiation
 */
export type RtcMediaStreamRequestBody = SessionDescriptionProtocol;

/**
 * user request to update subscriptions to the desired media stream
 */
export type UpdateMediaStreamSubscriptionsRequestBody = SubscriptionUpdates;

/**
 * request to approve or reject a user inside a meeting
 */
export type UpdateQueuedUserRequestBody = QueuedUserUpdate;

/**
 * user request to stop recording on a specific meeting
 */
export type StopMeetingRecordingRequestBody = RecordingFields;

/**
 * user request to update hand status during a meeting
 */
export type UpdateHandStatusRequestBody = HandStatus;

/**
 * Class representing all the image quality accepted values
 */
export type QueryImageQualityParameter =
	(typeof QueryImageQualityParameter)[keyof typeof QueryImageQualityParameter];

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const QueryImageQualityParameter = {
	Lowest: 'Lowest',
	Low: 'Low',
	Medium: 'Medium',
	High: 'High',
	Highest: 'Highest'
} as const;

export type QueryImageTypeParameter = ImageTypeEnum;

export type QueryImageCropParameter = boolean;

export type QueryImageShapeParameter = ImageShapeEnum;

export type QueryFirstPageParameter = number;

export type QueryLastPageParameter = number;

/**
 * file name encoded to unicode
 */
export type HeaderFileNameParameter = string;

/**
 * content type
 */
export type HeaderMimeTypeParameter = string;

/**
 * content length
 */
export type HeaderContentLengthParameter = number;

/**
 * description encoded to unicode
 */
export type HeaderDescriptionParameter = string;

/**
 * description
 */
export type HeaderMessageIdParameter = string;

/**
 * identifier of the message being replied to
 */
export type HeaderReplyIdParameter = string;

/**
 * attachment's area
 */
export type HeaderAreaParameter = string;

/**
 * number of page items
 */
export type QueryPageItemsNumberParameter = number;

/**
 * pagination filter
 */
export type QueryPageFilterParameter = string;

/**
 * Rooms extra fields
 */
export type QueryRoomsExtraFieldsParameter = RoomExtraField[];

/**
 * List of ids (max 10) of the users to retrieve
 */
export type QueryUserIdsParameter = string[];

export type ListRoomsParams = {
	/**
	 * Rooms extra fields
	 */
	extraFields?: QueryRoomsExtraFieldsParameter;
};

export type GetUsersParams = {
	/**
	 * List of ids (max 10) of the users to retrieve
	 */
	userIds: QueryUserIdsParameter;
};

export type ListRoomAttachmentsInfoParams = {
	/**
	 * number of page items
	 */
	itemsNumber?: QueryPageItemsNumberParameter;
	/**
	 * pagination filter
	 */
	filter?: QueryPageFilterParameter;
};

export type GetImagePreviewParams = {
	quality?: QueryImageQualityParameter;
	output_format?: QueryImageTypeParameter;
	crop?: QueryImageCropParameter;
};

export type GetImageThumbnailParams = {
	quality?: QueryImageQualityParameter;
	output_format?: QueryImageTypeParameter;
	shape?: QueryImageShapeParameter;
};

export type GetPdfPreviewParams = {
	firstPage?: QueryFirstPageParameter;
	lastPage?: QueryLastPageParameter;
};

export type GetPdfThumbnailParams = {
	quality?: QueryImageQualityParameter;
	output_format?: QueryImageTypeParameter;
	shape?: QueryImageShapeParameter;
};
