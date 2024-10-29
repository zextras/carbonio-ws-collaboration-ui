/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useState } from 'react';

import { Button, Container, Icon, Modal, Text } from '@zextras/carbonio-design-system';
import { replaceHistory } from '@zextras/carbonio-shell-ui';
import { filter } from 'lodash';
import { useTranslation } from 'react-i18next';

import { CHATS_ROUTE } from '../../constants/appConstants';
import { RoomsApi } from '../../network';
import { getDuplicatedRoom } from '../../store/selectors/RoomsSelectors';
import useStore from '../../store/Store';
import { MemberBe, RoomType } from '../../types/network/models/roomBeTypes';

type CopyRoomWidgetProps = {
	name: string;
	members: MemberBe[];
};

const CopyRoomWidget: FC<CopyRoomWidgetProps> = ({ name, members }) => {
	const [t] = useTranslation();
	const duplicateTitle = t('', 'Duplicate to new Chats module');
	const duplicateDescription = t(
		'',
		'This action creates a copy of the group, including its title, topic, members, and moderators.'
	);
	const duplicateButton = t('', 'COPY GROUP');
	const alreadyDuplicateTitle = t('', 'Group already duplicated');
	const alreadyDuplicateDescription = t(
		'',
		'Click the button to be redirected to the new form and use the duplicate of this group.'
	);
	const alreadyDuplicateButton = t('', 'VIEW IN NEW CHATS MODULE');
	const modalTitle = t('', 'Create a copy of the group {{groupName}}', { groupName: name });
	const modalDescription1 = t(
		'',
		'You are about to create a copy of the group in the new Chats module.'
	);
	const modalDescription2 = t(
		'',
		'Important: You are copying the group and with it the title, topic, members and moderators. This action does not create a copy of the conversation history.'
	);
	const modalDescription3 = t(
		'',
		'Once the copy is complete, you will be automatically redirected to the new module.'
	);
	const modalButton = t('', 'CONTINUE');
	const closeModalLabel = t('action.close', 'Close');

	const duplicatedGroup = useStore((store) => getDuplicatedRoom(store, name, members));

	const [open, setOpen] = useState(false);

	const buttonAction = useCallback(() => {
		if (!duplicatedGroup) {
			setOpen(true);
		} else {
			replaceHistory({
				path: `/${duplicatedGroup.id}`,
				route: CHATS_ROUTE
			});
		}
	}, [duplicatedGroup]);

	const onClickModalButton = useCallback(() => {
		const membersWithoutMe = filter(
			members,
			(member) => member.userId !== useStore.getState().session.id
		);
		RoomsApi.addRoom({
			type: RoomType.GROUP,
			name,
			description: '',
			members: membersWithoutMe
		}).then((response) => {
			setOpen(false);
			replaceHistory({
				path: `/${response.id}`,
				route: CHATS_ROUTE
			});
		});
	}, [members, name]);

	return (
		<Container crossAlignment="flex-start" gap="0.5rem">
			<Text>{!duplicatedGroup ? duplicateTitle : alreadyDuplicateTitle}</Text>
			<Text size="small" color="gray1" overflow="break-word">
				{!duplicatedGroup ? duplicateDescription : alreadyDuplicateDescription}
			</Text>
			<Button
				width="fill"
				type="outlined"
				label={!duplicatedGroup ? duplicateButton : alreadyDuplicateButton}
				icon="WscOutline"
				iconPlacement="left"
				onClick={buttonAction}
			/>
			{open && (
				<Modal
					open={open}
					size="medium"
					title={modalTitle}
					confirmLabel={modalButton}
					onConfirm={onClickModalButton}
					showCloseIcon
					closeIconTooltip={closeModalLabel}
					onClose={() => setOpen(false)}
				>
					<Text overflow="break-word">{modalDescription1}</Text>
					<Container padding={{ vertical: 'large' }} orientation="horizontal">
						<Container width="fit" padding={{ right: 'medium' }}>
							<Icon icon="AlertCircleOutline" size="large" />
						</Container>
						<Text overflow="break-word">{modalDescription2}</Text>
					</Container>
					<Text overflow="break-word">{modalDescription3}</Text>
				</Modal>
			)}
		</Container>
	);
};

export default CopyRoomWidget;
