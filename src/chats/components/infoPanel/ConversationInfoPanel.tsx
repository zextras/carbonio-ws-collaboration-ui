/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo } from 'react';

import { Container, Divider, TabBar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { gte } from 'semver';

import { ActionsTabContent } from './conversationActionsAccordion/ActionsTabContent';
import ConversationInfo from './conversationInfo/ConversationInfo';
import ConversationInfoDetails from './conversationInfo/ConversationInfoDetails';
import MemberList from './conversationParticipantsAccordion/MemberList';
import { MediaGalleryTab } from './mediaGallery/MediaGalleryTab';
import { getSelectedInfoTab } from '../../../store/selectors/ActiveConversationsSelectors';
import { getRoomTypeSelector, getIsPlaceholderRoom } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { InfoPanelTab } from '../../../types/store/ActiveConversationTypes';
import { RoomType } from '../../../types/store/RoomTypes';

const MEDIA_GALLERY_MIN_API_VERSION = '1.6.12';

type ConversationProps = {
	roomId: string;
	goToChatView: () => void;
};

const ConversationInfoPanel: FC<ConversationProps> = ({ roomId, goToChatView }) => {
	const [t] = useTranslation();
	const actionsTabLabel = t('conversationInfo.actionAccordionTitle', 'Actions');
	const membersTabLabel = t('conversationInfo.membersTab', 'Members');
	const mediaGalleryTabLabel = t('conversationInfo.mediaGalleryTab', 'Media Gallery');

	const roomType: string = useStore((state) => getRoomTypeSelector(state, roomId));
	const isPlaceholderRoom = useStore((state) => getIsPlaceholderRoom(state, roomId));
	const selectedInfoTab = useStore((state) => getSelectedInfoTab(state, roomId));
	const setSelectedInfoTab = useStore((state) => state.setSelectedInfoTab);
	const apiVersion = useStore((state) => state.session.apiVersion);

	const isMediaGallerySupported = !!apiVersion && gte(apiVersion, MEDIA_GALLERY_MIN_API_VERSION);

	const tabs = useMemo(() => {
		const items = [{ id: InfoPanelTab.ACTIONS, label: actionsTabLabel }];
		if (roomType !== RoomType.ONE_TO_ONE) {
			items.push({ id: InfoPanelTab.MEMBERS, label: membersTabLabel });
		}
		if (isMediaGallerySupported) {
			items.push({ id: InfoPanelTab.MEDIA_GALLERY, label: mediaGalleryTabLabel });
		}
		return items;
	}, [actionsTabLabel, isMediaGallerySupported, mediaGalleryTabLabel, membersTabLabel, roomType]);

	const handleTabChange = useCallback(
		(_ev: React.MouseEvent<HTMLDivElement> | KeyboardEvent, tabId: string) => {
			setSelectedInfoTab(roomId, tabId as InfoPanelTab);
		},
		[roomId, setSelectedInfoTab]
	);

	return (
		<Container mainAlignment="flex-start">
			<ConversationInfo roomId={roomId} roomType={roomType} goToChatView={goToChatView} />
			<ConversationInfoDetails roomId={roomId} roomType={roomType} />
			{!isPlaceholderRoom && (
				<>
					<TabBar
						data-testid="infoPanelTabBar"
						items={tabs}
						selected={selectedInfoTab}
						onChange={handleTabChange}
						background="gray6"
						height="3rem"
						minHeight="3rem"
						flexShrink={0}
						forceWidthEquallyDistributed
					/>
					<Divider />
					<Container mainAlignment="flex-start" style={{ overflowY: 'auto' }}>
						{selectedInfoTab === InfoPanelTab.ACTIONS && <ActionsTabContent roomId={roomId} />}
						{selectedInfoTab === InfoPanelTab.MEMBERS && <MemberList roomId={roomId} />}
						{isMediaGallerySupported && selectedInfoTab === InfoPanelTab.MEDIA_GALLERY && (
							<MediaGalleryTab roomId={roomId} />
						)}
					</Container>
				</>
			)}
		</Container>
	);
};

export default ConversationInfoPanel;
