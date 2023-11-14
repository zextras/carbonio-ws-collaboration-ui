# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.0.2](https://github.com/zextras/carbonio-ws-collaboration-ui/compare/v0.0.1...v0.0.2) (2023-10-31)


### Features

* added component for who is speaking refs: WSC-1087 ([#137](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/137)) ([7eca184](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/7eca1842d843156aadf157123173a6082bd0a3bd))
* change default meeting view to grid view ref: WSC-1121 ([#150](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/150)) ([2b99570](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/2b995709a26af905395fb96d9450eb6e1af98313))
* changed presence string in member list refs: WSC-690 ([#140](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/140)) ([5061f6b](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/5061f6baf06dbf2657414f3c8b5e5d9ceb15424f))
* changed remove member label refs: WSC-1095 ([#142](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/142)) ([9b3d00d](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/9b3d00de53f4e21291808a257476456e3533b5c5))
* check on active meeting ([#141](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/141)) ([436a1fc](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/436a1fc9515c55af44ea15c3dc1c273028f25685))
* grid view for meetings ref: WSC-900 ([#138](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/138)) ([3236da4](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/3236da470f979570dc9b27c9e7a33c44e28ad4bf))
* handle isTalking border on tiles refs: WSC-1067 ([#126](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/126)) ([7518680](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/7518680615b331c955f6e4ab4606ca95913ec4b6)), closes [#3](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/3) [#9](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/9) [#48](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/48) [#53](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/53) [#55](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/55)
* improve removal of topic in group conversation WSC-910 ([#139](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/139)) ([ae20a9a](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/ae20a9ae0312dd28ea68b0811f62f8e165e8d2e6))
* meetings implementation ([#132](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/132)) ([eaa27ed](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/eaa27ed9990defb7f270d0b69c494ae0d60f673a)), closes [#3](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/3) [#9](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/9) [#48](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/48) [#53](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/53) [#55](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/55)
* screen-share ref: WSC-977 ([#124](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/124)) ([2e8d11d](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/2e8d11db3ee254f4892a8fae5f9d44b71b07477e)), closes [#3](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/3) [#9](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/9) [#48](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/48) [#53](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/53) [#55](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/55)
* set email value to be selectable from the user refs: WSC-1071 ([#135](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/135)) ([fe9690f](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/fe9690fe8af9231809c1591479e291bbbe644f7e))


### Bug Fixes

* ellipse attachment name ([#151](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/151)) ([fedce39](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/fedce3969a3b509eb27900dd8d2e710365df247b))
* fix enter button disabled while selecting resource in access meeting modal refs: WSC-1098 ([#147](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/147)) ([c07cfc2](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/c07cfc293c9404a0dd722192b968ffb272cbe701))
* fixed background on meeting avatar refs: WSC-1113 ([#146](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/146)) ([7a0dc75](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/7a0dc75401f24888ad2ff112a98fc42e8345241c))
* resolve background color by using darkreader from shell refs:WSC-1091 ([#145](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/145)) ([b8123fb](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/b8123fb77eeea6c8e4bd419bf44afb4f2c058fe6))

### 0.0.1 (2023-10-02)


### Features

*  hide user presence when the canSeeUsersPresence capability is set ([#11](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/11)) ([d043bc8](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/d043bc821219e83714e9ea506b2afc7c8c57193e))
*  let user to open message on chats by clicking the browser notification ref: CHATS-457 ([#12](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/12)) ([7cb7581](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/7cb7581fb0400509070dee99a5e51b073c58e169))
* add check on max number of user to add in a conversation refs: … ([#74](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/74)) ([50cc8d0](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/50cc8d018c1d96cce08ca3637c97cbf2e2a35bc3))
* add edit message functionality refs: CHATS-296 ([#23](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/23)) ([76062d7](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/76062d7db4fbbca2a16517e51433c8328a004d77))
* add pending message into the store before xmpp confirmation refs: WSC-864 ([#94](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/94)) ([ed4d827](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/ed4d82727e57d9e24df88adae044ab1fad57fe3b))
* add translation repo refs: CHATS-810 ([#60](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/60)) ([38b8724](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/38b872425858a2ad11e4d17eb28aa8bbea40762f))
* added inizialization event handler refs: CHATS-742 ([#38](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/38)) ([b1d16ac](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/b1d16ac98b6ee7cd6cd58aa3d9c7c1b4ded71634))
* added preview of attachments refs: CHATS-700 ([#31](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/31)) ([16c3078](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/16c30785630302b5833f563dfa3ebfee2a8b8fe9))
* added sticky date message inside conversation refs: CHATS-472 ([#10](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/10)) ([20e52e0](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/20e52e0df5c2846dd17c140d77463b52521aabca))
* avoid sending empty messages ref: CHATS-415 ([#5](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/5)) ([e440785](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/e440785ac7d02ad1d11cfab206b6fe9e6bf89060))
* better handling of affiliation and configuration messages refs: CHATS-583 ([#20](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/20)) ([a411b78](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/a411b786180423e3d40f1df88cda7a247d7606d5))
* change composing events timing refs: CHATS-840 ([#66](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/66)) ([684de88](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/684de8847e5ad2ebc876592fe2eeb5ea68bba232))
* chats renaming refs: CHATS-723 ([#39](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/39)) ([cd767df](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/cd767df9a4dd0456b291dde0d8379baf661397ab))
* chats-ui release ([73a800f](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/73a800f4a17984fc7f5a6c14929dd03c1f4c840d))
* completed infoPanel testing refs: CHATS-720 ([#36](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/36)) ([d1da142](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/d1da14288029f20183a386473c5cfdc1704098c2))
* convert affiliation messages to configuration messages ref: WSC-1018 ([#112](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/112)) ([c9f2e77](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/c9f2e772d0c0442b5de6f4df9bbe0c8e85fc4351))
* desktop notification management from settings page refs: CHATS-530 ([#7](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/7)) ([6c76ff9](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/6c76ff9af45be18dc13dd193cbe3b3b597e8cc59))
* enhance connection error snackbar ref:760 ([#44](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/44)) ([ff09840](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/ff0984063c0fa1ef68102c050e0aede998f408d6))
* enhance contact visualization in the creation modal ref: CHATS-698 ([#46](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/46)) ([a2c9da4](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/a2c9da4704f595cedd47b6e4b029568b8af1d380))
* enhance the privacy of deleted messages refs: WSC-950 ([#98](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/98)) ([61704c7](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/61704c786a6f3c311bc1fb37f50c7bb63f0ce978))
* forward attachments ref: 684 ([#40](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/40)) ([72095a0](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/72095a0ecabf091044620a5a51f165b1caf27e49))
* forward message functionality refs: CHATS-242 ([#21](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/21)) ([e66e17d](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/e66e17d62c077dac700a95a1dedd7b2783e43a3c))
* handle retract for deletion of a message refs:CHATS-243 ([33425fc](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/33425fc3fa46df12dcdd4876a95dccc8cad6f7fc))
* highlight color of quoted message follows shell settings refs: CHATS-402 ([#17](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/17)) ([b9c5a5a](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/b9c5a5ae59e70baa87e2111567ec011380822e2c))
* implement attachment upload manager refs: CHATS-262 ([#41](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/41)) ([a9f5865](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/a9f5865de5aab21c39d0bd48a58601fa956dd9a5))
* implemented hover action as trigger for emoji selector refs: CHATS-401  ([#13](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/13)) ([6005b5b](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/6005b5b70dd9a28ac4210b564623118bb9c21265))
* improved previews on attachment bubbles refs: WSC-981 ([#102](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/102)) ([d37f8be](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/d37f8be17ef7fb118622c1d34ead12f33ee9e7eb))
* increased font size of conversation texts refs: CHATS-695 ([#32](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/32)) ([06791d9](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/06791d98ee702d500354f6282e68f13943d733e8))
* let user to edit an attachment description refs: CHATS-759 ([#59](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/59)) ([371b50a](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/371b50a9932a7129a4fd44d76338e616d6b0922d))
* let user to forward a message multiple times refs: WSC-853  ([#79](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/79)) ([5f0c0d3](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/5f0c0d37b669a80cfe6bc07128a308b7756d6d59))
* let user to use special characters refs: WSC-862 ([#99](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/99)) ([59db0b2](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/59db0b2df69111efde8e9b59be3b7f29971481d4))
* multiple users data request ref: CHATS-504 ([#45](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/45)) ([22d076c](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/22d076cff74858d56d504a91bb00135b2fc1eb26))
* new messages label into conversation ref: CHATS-567 ([#30](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/30)) ([2e88a50](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/2e88a50b4272edf5e50daf5afa39af088b5c1bd4))
* performance improvement with equalityFn selectors refs:WSC-911 ([#78](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/78)) ([d3a1f54](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/d3a1f546383c7d2f1137b500d5c650d87c192f3c))
* remove clear caption button from input ref: WSC-806 ([#101](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/101)) ([b9136d3](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/b9136d396047f8e4825f78506db7d01f62e149a5))
* reply to a message by attaching a file ref: CHATS-594 ([#52](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/52)) ([ae4c0dd](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/ae4c0dd3ba830cd30ad1207a93dd25651df7cde5))
* return to the last conversation refs: CHATS-834 ([#58](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/58)) ([4f2b693](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/4f2b6933d2436bbac42e38327043291bb10315bc))
* update preview APIs refs: CHATS-699 ([#43](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/43)) ([a0125e2](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/a0125e2d9369f2a17c8b44ba02aca7043504c439))
* upload attachments functionality ref: CHATS-534 ([#25](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/25)) ([a90763f](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/a90763fc7a6669b56652e76205818932ce4ab19f))
* user can see preview of GIF refs: WSC-1022 ([#104](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/104)) ([fad1207](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/fad12070af60d305c07eaf436eb7f6d4bb9e0c82))
* xmpp reconnection WSC-937 ([#93](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/93)) ([bf5f6c3](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/bf5f6c3092f144b09f0d1859c99e33b750ef8825))


### Bug Fixes

* change control to set history loaded first time refs:CHATS-863 ([#70](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/70)) ([84cc328](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/84cc32820b7139a44d20c8eabffadf682c4e6e36))
* changed lodash function refs: CHATS-804 ([#50](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/50)) ([e0b8931](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/e0b89313cecd129aa4a590c2f951393691a267d8))
* disable creation button while requesting it refs:CHATS-679 ([#24](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/24)) ([ef086f0](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/ef086f0f20dca274acaa3ead0d184da789f81efc))
* encoding/decoding of special characters refs: CHATS-833 ([e34b874](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/e34b874169c09922d4837e9eebe2b805e6b925c5))
* fix double download on click refs: WSC-921 ([#80](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/80)) ([d279937](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/d2799370b3dd562a09f49aedbae98ef71ccd4344))
* fix imports order and tests refs: CHATS-746 ([#42](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/42)) ([30b3d4a](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/30b3d4a9f8291b97e60032e5340f51863b9452e2))
* fix scroll movement on new message refs: CHATS-826 ([#56](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/56)) ([68aff5e](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/68aff5ea6983d494f5a2e5570b34232e5d20e82f))
* fix scroll to bottom bevahiour and is writing visualization refs… ([#33](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/33)) ([fe83148](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/fe83148c6f12e1bc17b9ab7ed9c57cd4fce40e5c))
* fix scrollbra on firefox refs: CHATS-632 ([#62](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/62)) ([cbeee51](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/cbeee518c11928ff9bb69ec08e00718e6f7f1b4a))
* fix search of users using spaces between name and surname refs: CHATS-717 ([#34](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/34)) ([4073378](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/4073378b113bb997c72087699e1214e18b08bb3c))
* fix warning key duplicate refs:WSC-963 ([#91](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/91)) ([2bb5afa](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/2bb5afab014a43cef3e2a14aa4b034f1f9d8fc61))
* fix wrong unread counter reference refs:CHATS-458 ([#16](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/16)) ([bc66a89](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/bc66a891bc0b4b18aac6b9d993d5749696a9fead))
* fixed bug that prevented some files to be uploaded refs: WSC-1063 ([#116](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/116)) ([62e41dd](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/62e41dde62b44378546b4ca53ed93d8d4d469add))
* fixed missing new message inside new conversations refs: CHATS-889 ([#75](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/75)) ([76e6e9e](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/76e6e9e6298524e9320deb68b4904889b877e452))
* fixed permanence of selection refs: CHATS-634 ([#22](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/22)) ([c773ac3](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/c773ac355c4b294a345076946437c1e587562157))
* fixed wrong z-index refs: WSC-1039 ([#111](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/111)) ([f98e888](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/f98e88859952e8b0729c98e0a436b7488a243a1c))
* hovering message status ref: WSC-1036 ([#108](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/108)) ([345c599](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/345c59906a5dedf53b822e9355d5ca56763b33f1))
* improve MessageStoreSlice refs: CHATS-812 ([#67](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/67)) ([2cc5073](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/2cc50736ee2bed661a716eeac47e0ad2483deb73))
* load history after connection is done refs: CHATS-873 ([#71](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/71)) ([a5cc1f3](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/a5cc1f35d2ce0c94b9124ef2976a74fcd8cd13ea))
* mark as read last message when performe clear history refs:WSC-920 ([#83](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/83)) ([adce669](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/adce6699bf15c78f3d5e917fef136f783117e625))
* now input has focus when opening the modal refs: WSC-933 ([#87](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/87)) ([09b2931](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/09b2931cbf5b563bc656c0b0d13751bcc83f2817))
* polishing refs: CHATS-747 ([#49](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/49)) ([20bafb1](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/20bafb1c6bb74098bb5efba3f4d0f5b05af64dfe))
* remove sessionid usage refs:WSC-1040 ([#115](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/115)) ([e61ffd1](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/e61ffd1a614bbf0921b89dfb8406e98a51230751))
* revert check on members on infoPanel refs:WSC-936 ([#81](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/81)) ([082bd36](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/082bd36ae92e92e6076d882e78db473557158c25))
* save draft message after a context change refs: CHATS-843 ([#63](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/63)) ([af1ce7b](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/af1ce7b56efe3f0d7a9a90eb86ede11606b4177f))
* set message as read when there isn't a marker for that conversation refs:CHATS-854 ([#72](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/72)) ([8e7c5f1](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/8e7c5f16eefc0fc212e97e0cfe8f6dd0484ba1ef))
* set read message if last message is affiliation or configuration refs:WSC-912 ([#85](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/85)) ([5b99dbe](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/5b99dbeb4137bf35f521d7f4dad1298611ad7c77))
* solved duplication of messages refs: CHATS-669 ([#37](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/37)) ([6d61fa8](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/6d61fa86dc0729e675a51c00c45bbd762630aa77))
* unread counter not correct if there are more then 50 new messages refs: WSC-891 ([#84](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/84)) ([597a44d](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/597a44d2edfeb093643143d7a99b8d5e79af8f52))
* update onClick handler for ds components refs:CHATS-649 ([#29](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/29)) ([18590df](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/18590dfb4e40d314aa5b0653ca702fd320031de1))
* update some translation strings ref: CHATS-824 ([bf4b2fe](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/bf4b2fecdda5c58ff07b86d5529ac44895887e43))

<!--
SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>

SPDX-License-Identifier: AGPL-3.0-only
-->

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.
