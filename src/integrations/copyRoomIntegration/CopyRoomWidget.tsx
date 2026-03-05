/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import styled from '@emotion/styled';
import {
	Button,
	Container,
	CreateSnackbarFn,
	Icon,
	Modal,
	Text,
	Tooltip,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { filter, size } from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { CHATS_ROUTE } from '../../constants/appConstants';
import { addRoom } from '../../network';
import { getDuplicatedRoom } from '../../store/selectors/RoomsSelectors';
import useStore from '../../store/Store';
import { MemberBe, RoomType } from '../../types/network/models/roomBeTypes';

type CopyRoomWidgetProps = {
	type: 'group' | 'space' | 'channel';
	name: string;
	members: MemberBe[];
	topic?: string;
};

const ItalicText = styled(Text)`
	font-style: italic;
`;

const CopyRoomWidget: FC<CopyRoomWidgetProps> = ({ name, members, topic, type }) => {
	const duplicatedRoom = useStore((store) => getDuplicatedRoom(store, name, members));
	const navigate = useNavigate();
	const createSnackbar: CreateSnackbarFn = useSnackbar();
	const [t] = useTranslation();

	const [open, setOpen] = useState(false);

	const membersWithoutMe = useMemo(
		() => filter(members, (member) => member.userId !== useStore.getState().session.id),
		[members]
	);

	const widgetTitle = useMemo(() => {
		if (type === 'group') {
			if (!duplicatedRoom) return t('readOnly.toBeMigrate.title', 'Duplicate to new Chats module');
			return t('readOnly.alreadyMigrate.title', 'This group is already duplicated');
		}
		if (!duplicatedRoom)
			return t('readOnly.room.toBeMigrate.title', 'Convert to Group in new module');
		return t('readOnly.room.alreadyMigrate.title', 'This item has already been converted');
	}, [duplicatedRoom, t, type]);

	const widgetDescription = useMemo(() => {
		if (size(membersWithoutMe) < 2)
			return t(
				'readOnly.room.toBeMigrate.moreMembersNeeded',
				'To convert this item into a group, it must have at least two other members besides you.'
			);
		if (type === 'group') {
			if (!duplicatedRoom)
				return t(
					'readOnly.toBeMigrate.description',
					'This action creates a copy of the group, including its title, members, and moderator role.'
				);
			return t(
				'readOnly.alreadyMigrate.description',
				'Click the button to be redirected to the new module and use the duplicate of this group.'
			);
		}
		if (!duplicatedRoom)
			return t(
				'readOnly.room.toBeMigrate.description',
				'This action converts this item into a group, copying its tile, topic, members and moderator role.'
			);
		return t(
			'readOnly.room.alreadyMigrate.description',
			'Click the button to be redirected to the new module and use he duplicate of this item.'
		);
	}, [duplicatedRoom, membersWithoutMe, t, type]);

	const widgetButton = useMemo(() => {
		if (type === 'group') {
			if (!duplicatedRoom) return t('readOnly.toBeMigrate.callToAction', 'COPY GROUP');
			return t('readOnly.alreadyMigrate.callToAction', 'VIEW IN NEW CHATS MODULE');
		}
		if (!duplicatedRoom) return t('readOnly.room.toBeMigrate.callToAction', 'CONVERT TO GROUP');
		return t('readOnly.alreadyMigrate.callToAction', 'VIEW IN NEW CHATS MODULE');
	}, [duplicatedRoom, t, type]);

	const modalTitle = useMemo(() => {
		if (type === 'group')
			return t('readOnly.modal.title', 'Create a copy of the group "{{roomName}}"', {
				roomName: name
			});
		return t('readOnly.room.modal.title', 'Convert "{{roomName}}" to a Group', {
			roomName: name
		});
	}, [name, t, type]);

	const modalDescription1 = useMemo(() => {
		if (type === 'group')
			return t(
				'readOnly.modal.subtitle',
				'You are about to create a copy of the group in the new Chats module.'
			);
		return t(
			'readOnly.room.modal.subtitle',
			'You are about to convert this item to a group in the new Chats module.'
		);
	}, [t, type]);

	const modalDescription2 = useMemo(() => {
		if (type === 'group')
			return (
				<Trans
					i18nKey="readOnly.modal.warning"
					defaults="Important: You are copying the group and with it the title, members and moderators. This action <strong>does not create</strong> a copy of the <strong>conversation history</strong>."
				/>
			);
		return (
			<Trans
				i18nKey="readOnly.room.modal.warning"
				defaults="Important: You are creating a new group that will have the same title, topic, members and moderator role as the original item. However, this action <strong>does not create</strong> a copy of the <strong>conversation history</strong>."
			/>
		);
	}, [type]);

	const modalDescription3 = useMemo(() => {
		if (type === 'group')
			return t(
				'readOnly.modal.caption',
				'Once the copy is complete, you will be automatically redirected to the new module.'
			);
		return t(
			'readOnly.room.modal.caption',
			'Once the conversion is complete, you will be automatically redirected to the new module.'
		);
	}, [t, type]);

	const modalButton = t('readOnly.modal.callToAction', 'CONTINUE');
	const closeModalLabel = t('action.close', 'Close');
	const snackbarErrorLabel = t(
		'readOnly.feedback.error',
		'Something went wrong, please try again or reload the page'
	);
	const twoMembersTooltip = t(
		'readonly.room.toBeMigrate.tooltip',
		'There must be at least two members besides you.'
	);

	const buttonAction = useCallback(() => {
		if (!duplicatedRoom) {
			setOpen(true);
		} else {
			navigate(`/${CHATS_ROUTE}/${duplicatedRoom.id}`);
		}
	}, [duplicatedRoom, navigate]);

	const onClickModalButton = useCallback(() => {
		addRoom({
			type: RoomType.GROUP,
			name,
			description: topic ?? '',
			members: membersWithoutMe
		})
			.then((response) => {
				setOpen(false);
				navigate(`/${CHATS_ROUTE}/${response.id}`);
			})
			.catch(() => {
				createSnackbar({
					key: new Date().toLocaleString(),
					severity: 'warning',
					label: snackbarErrorLabel
				});
			});
	}, [createSnackbar, membersWithoutMe, name, navigate, snackbarErrorLabel, topic]);

	return (
		<Container crossAlignment="flex-start" gap="0.5rem">
			<Text>{widgetTitle}</Text>
			<Text size="small" color="gray1" overflow="break-word">
				{widgetDescription}
			</Text>
			<Tooltip label={twoMembersTooltip} disabled={size(membersWithoutMe) > 2}>
				<Button
					width="fill"
					type="outlined"
					label={widgetButton}
					icon="WscOutline"
					iconPlacement="left"
					onClick={buttonAction}
					disabled={size(membersWithoutMe) < 2}
				/>
			</Tooltip>
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
					<ItalicText overflow="break-word">{modalDescription3}</ItalicText>
				</Modal>
			)}
		</Container>
	);
};

export default CopyRoomWidget;
