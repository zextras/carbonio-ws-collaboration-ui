/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, {
	Dispatch,
	FC,
	SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useState
} from 'react';

import {
	Container,
	Text,
	Divider,
	Padding,
	Button,
	FileLoader,
	Shimmer,
	Tooltip,
	IconButton,
	CreateSnackbarFn,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled, { css, DefaultTheme, FlattenInterpolation, ThemeProps } from 'styled-components';

import { UsersApi } from '../../network';
import { getCapability } from '../../store/selectors/SessionSelectors';
import {
	getUserEmail,
	getUserName,
	getUserPictureUpdatedAt
} from '../../store/selectors/UsersSelectors';
import useStore from '../../store/Store';
import { CapabilityType } from '../../types/store/SessionTypes';
import { calculateAvatarColor } from '../../utils/styleUtils';

type ProfileSettingsProps = {
	picture: File | false;
	setPicture: Dispatch<SetStateAction<File | false>>;
	sessionId: string | undefined;
	setToDelete: Dispatch<SetStateAction<boolean>>;
	toDelete: boolean;
};

const HoverContainer = styled(Container)`
	opacity: 0;
`;

const BackgroundContainer = styled(Container)<{
	$hasHoverGradient: boolean;
	$color: keyof DefaultTheme['avatarColors'];
}>`
	border-radius: 0;
	background-color: ${({ $color, theme }): string | false => `${theme.avatarColors[$color]}`};
	&:hover {
		background: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)),
			${({ $color, $hasHoverGradient, theme }): string | false =>
				$hasHoverGradient && `${theme.avatarColors[$color]}`};
		background: -webkit-linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)),
			${({ $color, $hasHoverGradient, theme }): string | false =>
				$hasHoverGradient && `${theme.avatarColors[$color]}`};
		background: -moz-linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)),
			${({ $color, $hasHoverGradient, theme }): string | false =>
				$hasHoverGradient && `${theme.avatarColors[$color]}`};
		${HoverContainer} {
			opacity: 1;
		}
	}
`;

const PictureContainer = styled(Container)<{ $picture: string; $hasHover: boolean }>`
	border-radius: 0;
	background-image: url(${({ $picture }): string => $picture});
	background-size: cover;
	background-position: center;
	aspect-ratio: 1/1;
	z-index: 2;

	&:after {
		background-color: ${({ theme }): string => `${theme.palette.gray6.regular}`};
		z-index: 1;
	}

	//  TODO: remove hasHover when the preview of the image is implemented
	${({ $hasHover, $picture }): false | FlattenInterpolation<ThemeProps<DefaultTheme>> =>
		$hasHover &&
		css`
			&:hover {
				background-image: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url(${$picture});
				background-image: -webkit-linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)),
					url(${$picture});
				background-image: -moz-linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)),
					url(${$picture});
				background-size: cover;
				background-position: center;
				aspect-ratio: 1/1;

				${HoverContainer} {
					opacity: 1;
				}
			}
		`}
`;

const GradientContainer = styled(Container)`
	background: linear-gradient(0deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0) 45%);
`;

const NameWrapText = styled(Text)<{ $hasPicture: boolean }>`
	white-space: unset;
	overflow: unset;
	text-overflow: unset;
	word-break: break-word;
	text-shadow: ${({ $hasPicture }): string | false =>
		$hasPicture && '0.063rem 0.063rem 0.25rem #111'};
`;

const CustomText = styled(Text)`
	text-overflow: ellipsis;
`;

const CustomButton = styled(Button)`
	border-radius: 0.125rem;
`;

const CustomFileLoader = styled(FileLoader)`
	border-radius: 0.125rem;
`;

const ProfileSettings: FC<ProfileSettingsProps> = ({
	picture,
	setPicture,
	sessionId,
	setToDelete,
	toDelete
}) => {
	const memberName: string | undefined = useStore((state) => getUserName(state, sessionId ?? ''));
	const memberEmail: string | undefined = useStore((state) => getUserEmail(state, sessionId ?? ''));
	const userPictureUpdatedAt: string | undefined = useStore((state) =>
		getUserPictureUpdatedAt(state, sessionId ?? '')
	);
	const maxUserImageSize = useStore((store) =>
		getCapability(store, CapabilityType.MAX_USER_IMAGE_SIZE)
	);

	const createSnackbar: CreateSnackbarFn = useSnackbar();

	const [t] = useTranslation();
	const imageSizeTooLargeSnackbar = t(
		'settings.profile.pictureSizeTooLarge',
		`Something went wrong, remember that the maximum size for an avatar image is ${maxUserImageSize}kb`,
		{ size: maxUserImageSize }
	);
	const uploadPictureLabel = t('tooltip.userAvatar.uploadAvatar', 'Upload avatar');
	const updatePictureLabel = t('tooltip.userAvatar.updateAvatar', 'Update avatar');
	const resetPictureLabel = t('tooltip.userAvatar.resetAvatar', 'Reset avatar');
	const sectionTitle = t('settings.profile.title', 'Profile');
	const statusLabel = t('settings.profile.statusLabel', 'Your status will appear here');
	const sectionDescription = t(
		'settings.profile.description',
		'Choose an avatar that other users will see, the image will be centered automatically.'
	);
	const sectionDescription2 = t(
		'settings.profile.maximumDimension',
		`Maximum dimension: ${maxUserImageSize}kb`,
		{ size: maxUserImageSize }
	);

	const [tempPicture, setTempPicture] = useState<false | string>(false);

	useEffect(() => {
		if (!picture && !toDelete) {
			if (userPictureUpdatedAt != null) {
				setTempPicture(`${UsersApi.getURLUserPicture(sessionId ?? '')}?${userPictureUpdatedAt}`);
			} else {
				setTempPicture(false);
			}
		}
	}, [picture, sessionId, toDelete, userPictureUpdatedAt]);

	const onChangeUserImage = useCallback(
		(e) => {
			if (
				typeof maxUserImageSize === 'number' &&
				e.target.files[0].size / 1000 < maxUserImageSize
			) {
				setTempPicture(URL.createObjectURL(e.target.files[0]));
				setPicture(e.target.files[0]);
			} else {
				createSnackbar({
					key: new Date().toLocaleString(),
					type: 'error',
					label: imageSizeTooLargeSnackbar,
					hideButton: true,
					autoHideTimeout: 5000
				});
			}
		},
		[createSnackbar, imageSizeTooLargeSnackbar, maxUserImageSize, setPicture]
	);

	const onResetUserImage = useCallback(() => {
		setTempPicture(false);
		setPicture(false);
		if (userPictureUpdatedAt != null) setToDelete(true);
	}, [setPicture, setToDelete, userPictureUpdatedAt]);

	const userInfo = useMemo(
		() => (
			<Container orientation="horizontal">
				<Container
					crossAlignment="flex-start"
					padding={{ left: 'large', bottom: 'large', right: 'large' }}
					mainAlignment="flex-end"
				>
					<NameWrapText color="gray6" size="medium" $hasPicture={!!tempPicture}>
						{memberName ?? memberEmail ?? ''}
					</NameWrapText>
					<Padding top="extrasmall" />
					<Container orientation="horizontal" mainAlignment="flex-start" height="fit">
						<CustomText size="small" color="gray6">
							{statusLabel}
						</CustomText>
					</Container>
				</Container>
			</Container>
		),
		[memberEmail, memberName, statusLabel, tempPicture]
	);

	const hoverContainer = useMemo(
		() => (
			<Container height="fit">
				<HoverContainer
					orientation="horizontal"
					mainAlignment="flex-end"
					crossAlignment="flex-start"
					padding={{ top: 'small', right: 'small' }}
					height="fit"
					data-testid="hover_container"
				>
					<Tooltip placement="bottom" label={tempPicture ? updatePictureLabel : uploadPictureLabel}>
						<FileLoader
							onClick={(): null => null}
							onChange={onChangeUserImage}
							icon="Upload"
							iconColor="gray6"
							size="large"
							data-testid="upload_button_hover"
						/>
					</Tooltip>
					{!!picture && (
						<Tooltip placement="bottom" label={resetPictureLabel}>
							<IconButton
								icon="RefreshOutline"
								iconColor="gray6"
								size="large"
								onClick={onResetUserImage}
								data-testid="delete_button_hover"
							/>
						</Tooltip>
					)}
				</HoverContainer>

				{/* TODO: this is for the preview handling of the image
				hasPicture && (
					<HoverContainer
						mainAlignment="flex-end"
						crossAlignment="center"
						// TODO: check this measures and convert them to rem
						height={roomType === RoomType.Group ? (iAmOwner ? '103px' : '147px') : '147px'}
					>
						<IconButton icon="EyeOutline" iconColor="gray6" size="extralarge" />
					</HoverContainer>
				) */}
			</Container>
		),
		[
			onChangeUserImage,
			onResetUserImage,
			picture,
			resetPictureLabel,
			tempPicture,
			updatePictureLabel,
			uploadPictureLabel
		]
	);

	const userPicture = useMemo(
		() =>
			tempPicture ? (
				<PictureContainer
					$picture={tempPicture}
					$hasHover
					mainAlignment="flex-end"
					minHeight="15.625rem"
					maxHeight="15.625rem"
					minWidth="22.938rem"
					maxWidth="22.938rem"
					data-testid="picture_container"
				>
					<GradientContainer>
						{hoverContainer}
						{userInfo}
					</GradientContainer>
				</PictureContainer>
			) : (
				<BackgroundContainer
					$color={calculateAvatarColor(memberName ?? '')}
					$hasHoverGradient
					minHeight="10rem"
					maxHeight="10rem"
					minWidth="22.938rem"
					maxWidth="22.938rem"
					data-testid="background_container"
				>
					<GradientContainer>
						{hoverContainer}
						{userInfo}
					</GradientContainer>
				</BackgroundContainer>
			),
		[hoverContainer, memberName, tempPicture, userInfo]
	);

	return (
		<Container background={'gray6'} padding={{ horizontal: 'medium', bottom: 'medium' }}>
			<Container crossAlignment="flex-start">
				<Padding top="large" bottom="medium">
					<Text weight="bold">{sectionTitle}</Text>
				</Padding>
				<Divider color="gray2" />
				<Padding vertical="large">
					<Container orientation="horizontal" mainAlignment="flex-start">
						{memberName == null && memberEmail == null ? (
							<Container width="fit" height="fit" data-testid="shimmer_container">
								<Shimmer.Logo height="10rem" width="22.938rem" radius="0" />
							</Container>
						) : (
							userPicture
						)}
						<Padding right="large" />
						<Container width="fill" mainAlignment="flex-start" crossAlignment="flex-start">
							<Container crossAlignment="flex-start" mainAlignment="flex-start" height="fit">
								<Text overflow="break-word" size={'small'}>
									{sectionDescription}
								</Text>
								<Text overflow="break-word" size={'small'}>
									{sectionDescription2}
								</Text>
							</Container>
							<Padding top="large" />
							<Container
								orientation="horizontal"
								mainAlignment="flex-start"
								crossAlignment="flex-start"
							>
								<Tooltip
									placement="bottom"
									label={tempPicture ? updatePictureLabel : uploadPictureLabel}
								>
									<CustomFileLoader
										onClick={(): null => null}
										onChange={onChangeUserImage}
										label="Upload Avatar"
										type="outlined"
										icon="UploadOutline"
										iconColor="primary"
										data-testid="upload_button"
									/>
								</Tooltip>
								<Padding right="medium" />
								<Tooltip placement="bottom" label={resetPictureLabel}>
									<CustomButton
										label="Reset Avatar"
										type="outlined"
										onClick={onResetUserImage}
										disabled={!tempPicture}
										data-testid="reset_button"
										color="secondary"
										icon="RefreshOutline"
										iconPlacement="right"
									/>
								</Tooltip>
							</Container>
						</Container>
					</Container>
				</Padding>
			</Container>
		</Container>
	);
};

export default ProfileSettings;
