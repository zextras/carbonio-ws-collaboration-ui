# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.9.3](https://github.com/zextras/carbonio-ws-collaboration-ui/compare/v0.9.2...v0.9.3) (2024-04-11)


### Features

* add call duration on meeting's layout ref: WSC-193 ([#272](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/272)) ([632c308](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/632c308abccdfe09a5ad347147a15ecd48fce870))
* attach public link from Files refs: WSC-1245 ([#249](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/249)) ([40bfae3](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/40bfae35b187f5965ed6630a9bfb9bf09fe87bee)), closes [#252](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/252)
* create one-to-one conversation only after sending the first message ref: WSC-1299 ([#258](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/258)) ([96a4876](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/96a487610244b9ce798848999f9faab5672ef0ce))
* forward of multiple messages refs: WSC-725 ([#237](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/237)) ([ad83018](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/ad8301878a573c05748ad23cb2d9be8c0934c9f4))
* handled long mimetypes on bubbles refs: WSC-1264 ([#233](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/233)) ([303a255](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/303a2554ef8893ee791f74b062a8d6c727808982))
* improve leave button on meetings ref: WSC-1232 ([#235](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/235)) ([498b7b2](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/498b7b2228c208ad94fb91b86c752f2de77f2271))
* meeting recording ref: WSC-1314 ([#250](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/250)) ([524a912](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/524a912b97e3a5e50df6a8aaa8c74f6f23de5287))
* new is typing implementation refs: WSC-1329 ([#255](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/255)) ([cfd180c](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/cfd180cad690e91de7e22193fd3812eb3070a5e8))
* new meeting access page refs: WSC-1338 ([#269](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/269)) ([b466bcc](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/b466bccb9d4254687b70d37c872b596fc36ec4f0))
* notifications management refs: WSC-1308 ([#244](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/244)) ([20317c6](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/20317c6ff824228778178e6ff239149f535b2434))
* rename delete action on bubble to delete for all refs:WSC-1297 ([#271](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/271)) ([fdd9664](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/fdd9664493697e06b3b343f196ef31d190c349aa))
* unathenticated user who access a virtual room is now redirect to error auth page refs:WSC-1311 ([#245](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/245)) ([382e1bf](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/382e1bf24aadb1ae62fd34a671a823adf280b7f0))
* waiting room user journey ref: WSC-1011 ([#228](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/228)) ([e3ba585](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/e3ba5856d3a4df5cf052db14d2acc7f4fd0ec62a)), closes [#225](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/225) [#229](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/229)


### Bug Fixes

* cancel the debounce when user stops writing refs: WSC-1302 ([#243](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/243)) ([807ca08](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/807ca085891c563059e5c1f787eef45d455671b9))
* delete meeting before delete room WSC-1341 ([#253](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/253)) ([f7459c6](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/f7459c63f36492d3c70e53fdd72792cdd8ec0479))
* error after single conversation creation during a search ref: WSC-1271 ([#240](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/240)) ([cdb6b52](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/cdb6b52e1378ecd782cc1c1eaed44b8ec6e74f41))
* fix cognitive errors ([#263](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/263)) ([b0a8f51](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/b0a8f51e930d84c56bb8ff1c949bf538775cdc78))
* fix uploading error handler refs: WSC-1339 ([158cd1e](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/158cd1ea970a8223a3a64a277fcfc836a8410ed8))
* fixed leave button animation refs: WSC-1335 ([#257](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/257)) ([6c82b76](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/6c82b76f65fd5baf14ccef6a4a2001cb0af5a979))
* fixed some cognitive complexity errors ([#262](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/262)) ([34986ee](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/34986ee808083cf794105c1a18b1596804199b69))
* fixed waiting room sount that was laying even if disabled refs: WSC-1346 ([#254](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/254)) ([4e76a00](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/4e76a00bb8781a8907cf4e973e93956d2fc4af7c))
* increse threshold for messages observer refs: WSC-1275 ([#270](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/270)) ([d43f795](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/d43f7955046dcbed64cacec974c9f346c4b33ec7))
* reply to a message loses previous written text ref: WSC-1354 ([#268](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/268)) ([45eec45](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/45eec45007ad282891c98666bd513d04ec23529c))
* toggle fullscren view work as intended now refs:WSC-1270 ([#239](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/239)) ([b423ade](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/b423ade51d02b8c8472042398bb9ac4cba4678e0))
* unread message badge persists when receiving messages while sending one ref: WSC-1278 ([#238](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/238)) ([08d88d6](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/08d88d6fe86d6f5e806d1ad6f6d043176208f095))
* when an error on sending attachment happens the data tag is remo… ([#251](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/251)) ([8199f76](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/8199f7658cb94760b4416c6ab003767af1e01044))
* when someone call notification now is removed if the user leave the call refs:WSC-1265 ([#236](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/236)) ([3e62c50](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/3e62c50d00de857e1413a4b14ffa529570e23eed))
* when user open conversation now the scroll reaches the bottom re… ([#265](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/265)) ([3ef5b80](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/3ef5b800f4e5e5187c4e65e2aeffeafed637842c))

### [0.9.2](https://github.com/zextras/carbonio-ws-collaboration-ui/compare/v0.9.1...v0.9.2) (2024-02-29)


### Bug Fixes

* hotfix avoid undefined meetings name ([3ca3497](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/3ca3497099e1145bbcab359f45c066c2f6282be8))

### [0.9.1](https://github.com/zextras/carbonio-ws-collaboration-ui/compare/v0.9.0...v0.9.1) (2024-02-14)


### Features

* added mute for all modal and small refactor refs: WSC-1127 ([#212](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/212)) ([8c2e342](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/8c2e342c48d39d440998cb3481cebcd07d773e13))
* handle of stacking actions on messages refs: WSC-807 ([#220](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/220)) ([fdb8a27](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/fdb8a2733d7679c2cc10a391ad3984b354c218fd))
* hover on bubble makes it stay refs: WSC-1209 ([#206](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/206)) ([72785d7](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/72785d77fbf35603354ed12e4da4a2bdb0218206))
* improved no match string layout refs: WSC-1272 ([#230](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/230)) ([fbad276](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/fbad2769abe0689d347b7e09091968133b3424f1))
* scheduled meeting list visualisation refs: WSC-1166 ([#217](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/217)) ([13c1482](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/13c148284f7c9416b0f85f29667aa06be9100925)), closes [#219](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/219)
* show profile picture on creation modal ([#226](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/226)) ([6439e39](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/6439e39fc0a612485591932b574dc0e514487d0f))
* user can filter group and single chats when using filter action… ([#207](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/207)) ([dd817e2](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/dd817e2b865f4a137dc43282ae4243724a0c529e))


### Bug Fixes

* add xmlns attribute to XMPP mam request ([#215](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/215)) ([206f15b](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/206f15be02c6b7690d221d2b153802b7292e01eb))
* fixed graphics on resize by settings refs: WSC-1221 ([#222](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/222)) ([ef44f09](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/ef44f093d62ec2e7ed1a671c4376f85746a76437))
* fixed use of chipinput refs: WSC-1120 ([#187](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/187)) ([d4b23e1](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/d4b23e16788093deda5bda79c5ad3ae290dfc19e))
* free stream audio or video when enter the meeting ([#224](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/224)) ([ffb9260](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/ffb9260de4d9f49c511d2bc90b3b701a5eafdb88))
* hide message dropdown on scroll ref: WSC-960 ([#216](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/216)) ([9f4650b](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/9f4650b5b5576a3d209483c4204313f21aeee901))
* manage responsiveness of chat's header ref: WSC-1266 ([#227](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/227)) ([a8fb38b](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/a8fb38bb08f0e5870e53c7bb7cb696185774487a))
* update dependencies refs:WSC-1249 ([#218](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/218)) ([0ea99e4](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/0ea99e4b92aeddf3ab38669334401c76b82a9951))
* using wrong locale and timezone ref: WSC-1223 ([#210](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/210)) ([0acca45](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/0acca457a23b8b5422ebf6f50871e6efdde42367))

## [0.9.0](https://github.com/zextras/carbonio-ws-collaboration-ui/compare/v0.0.8...v0.9.0) (2023-12-22)

### [0.0.8](https://github.com/zextras/carbonio-ws-collaboration-ui/compare/v0.0.7...v0.0.8) (2023-12-22)

### [0.0.4](https://github.com/zextras/carbonio-ws-collaboration-ui/compare/v0.0.3...v0.0.4) (2023-12-21)


### Features

* add check on delete modal when meeting is active refs: WSC-1139 ([#180](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/180)) ([2d5047d](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/2d5047d74dcb16394e29bb110fba0e3de2c5856a))
* added bubble on meeting refs: WSC-820 ([#181](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/181)) ([3271ad3](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/3271ad3d117aba4ea2c2fa12245c636a0310c6b6))
* added shortcut for edit last message sent refs: WSC-393 ([#169](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/169)) ([41ff946](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/41ff9468d2b285c031241e20b3231cac31c0c2cb))
* added timing on hover refs: WSC-1152 ([#174](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/174)) ([6f61dbb](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/6f61dbb0e4c4f859026741ecf5f818603d78ad66))
* enhance emoji only messages ref: WSC-1181 ([#177](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/177)) ([f709789](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/f709789fce5c1a74b2d6a532d15af4212c4e7f41))
* full screen functionality, users will be now able to use fullsc… ([#170](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/170)) ([aae22c9](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/aae22c9360e269714820b74e26dae60c7c7600f0))
* handle capability to hide or display message reads refs: WSC-406 ([#175](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/175)) ([a5573ed](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/a5573eda7ff02632813761fc0c58bdd09c2754b6))
* improve warning snackbars WSC-1182 ([#178](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/178)) ([f66d992](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/f66d9928f5db4b77ed5cbc011cb0e4a2f1be67ef))


### Bug Fixes

* fix reference of forward edited message refs: WSC-1183 ([#182](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/182)) ([70d3d27](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/70d3d27201dbe2858a6c616f522ed3029c1a4192))
* fixed breaking list refs: WSC-1112 ([#176](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/176)) ([17e4dba](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/17e4dba98ad20d615ab9825b0a0b8e1f6b22b1eb))
* fixed dropzone opening on dragging messages refs: WSC-1153 ([#179](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/179)) ([0aea2f9](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/0aea2f9b26fb68f8aeef97d1df13dc43b5b94599))
* fixed wrong emoji picker placement refs: WSC-1174 ([#183](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/183)) ([8577bc6](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/8577bc6b4606cc195dbcebbc87f840b6db4b6063))
* fixed wrong layout on forward modal refs: WSC-1187 ([#185](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/185)) ([818a185](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/818a185a0a733fb08009ec8416bd258729a0b294))
* hidden bubble wrapper when there are no new messages refs: WSC-1210 ([#188](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/188)) ([b84024b](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/b84024ba21775bdb8ca7a9231ba4e7979f789f2d))

### [0.0.3](https://github.com/zextras/carbonio-ws-collaboration-ui/compare/v0.0.2...v0.0.3) (2023-11-23)


### Features

* add transitions to sidebar, carousel and meeting chat ref: WSC-986 ([#160](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/160)) ([37b46c0](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/37b46c0e0f0c50a740f31940298d750cbfdc6f65))
* handle mute for all refs: WSC-1133 ([#163](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/163)) ([60d28d1](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/60d28d1b071824741e478e68ac7b12f501fac93f))
* let user to rejoin an active meeting ref: WSC-1086 ([#168](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/168)) ([1d89e77](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/1d89e77d1fabc5c494039f3797cb8169ca428a22))
* managed swap of tiles refs: WSC-1081 ([#149](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/149)) ([25cbc4d](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/25cbc4d8e4dd20fa09fc76b39b68b704457a01c7))
* meetingButton is available only when canVideoCall capability is enabled ref: WSC-1114 ([#166](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/166)) ([df17f74](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/df17f744558387cc757435794756d8411bc5f7c3))
* preview action on info panel avatars ref: WSC-448 ([#158](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/158)) ([126d776](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/126d776cd6a26e8a19cad93ae4b3223b5364bdbd))
* update forwarded message layout ref: WSC-908 ([#157](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/157)) ([58ffdf0](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/58ffdf079a68df8e2bdd55324ce8d4be92d0b090))
* updates the input behavior when the user enters a conversation ref: WSC-1088 ([#148](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/148)) ([abd8289](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/abd828983109abe3352dfba5ef2eac4f19dd0416))


### Bug Fixes

* cursor input doesn't keep the right position while editing a message ref: WSC-1136 ([#161](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/161)) ([edec04f](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/edec04fd48b8cae235da70c4fa2a13b88bdc6a5b))
* fixed scroll tick refs: WSC-915 ([#165](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/165)) ([99f7904](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/99f790468a53964a3ae4d3946d44be8c9012fee8))
* fixed settings modal that do not close on save refs: WSC-1135 ([#164](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/164)) ([b7c45b7](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/b7c45b7fa382500f3bae3dc98cb3086d19cf95b9))
* input change height when an emoji is added WSC-805 ([#162](https://github.com/zextras/carbonio-ws-collaboration-ui/issues/162)) ([30e0c92](https://github.com/zextras/carbonio-ws-collaboration-ui/commit/30e0c92f3d50f0c27cf23737bd38a5cf21c04cab))

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
