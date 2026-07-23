import { MessageActionType } from '../../../../../types/store/ActiveConversationTypes';
import { BrowserUtils } from '../../../../../utils/BrowserUtils';

export const handlePaste = (
	ev: ClipboardEvent,
	actionType: MessageActionType,
	loadFiles: (files: FileList) => void
) => {
	try {
		// Avoid to paste files if user is editing a message
		const editingMessage = actionType === MessageActionType.EDIT;
		if (!editingMessage) {
			const includeFiles = ev.clipboardData?.files;
			if (includeFiles && includeFiles.length > 0) {
				ev.preventDefault();
				ev.stopPropagation();
				const isFirefoxBrowser = BrowserUtils.isFirefox();
				const isChromeBrowser = BrowserUtils.isChrome();
				const chromeVersion = BrowserUtils.getChromeVersion();
				const isSafariBrowser = BrowserUtils.isSafari();
				const isLinux = BrowserUtils.isLinux();

				// LINUX, WIN AND MAC OS ARE SUPPORTED ON FIREFOX/CHROME, MAC ALSO ON SAFARI
				if (isLinux || isChromeBrowser || chromeVersion || isFirefoxBrowser || isSafariBrowser) {
					loadFiles(includeFiles);
				} else {
					console.error(`Browser not support copy/paste function ${navigator.userAgent}`);
				}
			}
		}
	} catch (e) {
		console.error(e);
	}
};
