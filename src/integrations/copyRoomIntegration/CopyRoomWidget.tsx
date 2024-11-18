/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useState } from 'react';

import {
	Button,
	Container,
	CreateSnackbarFn,
	Icon,
	Modal,
	Text,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { replaceHistory } from '@zextras/carbonio-shell-ui';
import { filter } from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { CHATS_ROUTE } from '../../constants/appConstants';
import { RoomsApi } from '../../network';
import { getDuplicatedRoom } from '../../store/selectors/RoomsSelectors';
import useStore from '../../store/Store';
import { MemberBe, RoomType } from '../../types/network/models/roomBeTypes';

type CopyRoomWidgetProps = {
	name: string;
	members: MemberBe[];
};

const ItalicText = styled(Text)`
	font-style: italic;
`;

const CopyRoomWidget: FC<CopyRoomWidgetProps> = ({ name, members }) => {
	const [t] = useTranslation();
	const duplicateTitle = t('readOnly.toBeMigrate.title', 'Duplicate to new Chats module');
	const duplicateDescription = t(
		'readOnly.toBeMigrate.description',
		'This action creates a copy of the group, including its title, members, and moderator role.'
	);
	const duplicateButton = t('readOnly.toBeMigrate.callToAction', 'COPY GROUP');
	const alreadyDuplicateTitle = t(
		'readOnly.alreadyMigrate.title',
		'This group is already duplicated'
	);
	const alreadyDuplicateDescription = t(
		'readOnly.alreadyMigrate.description',
		'Click the button to be redirected to the new module and use the duplicate of this group.'
	);
	const alreadyDuplicateButton = t(
		'readOnly.alreadyMigrate.callToAction',
		'VIEW IN NEW CHATS MODULE'
	);
	const modalTitle = t('readOnly.modal.title', 'Create a copy of the group {{groupName}}', {
		groupName: name
	});
	const modalDescription1 = t(
		'readOnly.modal.subtitle',
		'You are about to create a copy of the group in the new Chats module.'
	);
	const modalDescription3 = t(
		'readOnly.modal.caption',
		'Once the copy is complete, you will be automatically redirected to the new module.'
	);
	const modalButton = t('readOnly.modal.callToAction', 'CONTINUE');
	const closeModalLabel = t('action.close', 'Close');
	const snackbarErrorLabel = t(
		'readOnly.feedback.error',
		'Something went wrong, please try again or reload the page'
	);

	const duplicatedGroup = useStore((store) => getDuplicatedRoom(store, name, members));

	const createSnackbar: CreateSnackbarFn = useSnackbar();

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
		})
			.then((response) => {
				setOpen(false);
				replaceHistory({
					path: `/${response.id}`,
					route: CHATS_ROUTE
				});
			})
			.catch(() => {
				createSnackbar({
					key: new Date().toLocaleString(),
					severity: 'warning',
					label: snackbarErrorLabel
				});
			});
	}, [createSnackbar, members, name, snackbarErrorLabel]);

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
						<Text overflow="break-word">
							<Trans
								i18nKey="readOnly.modal.warning"
								defaults="Important: You are copying the group and with it the title, members and moderators. This action <strong>does not create</strong> a copy of the <strong>conversation history</strong>."
							/>
						</Text>
					</Container>
					<ItalicText overflow="break-word">{modalDescription3}</ItalicText>
				</Modal>
			)}
		</Container>
	);
};

export default CopyRoomWidget;
