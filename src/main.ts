import { Plugin } from "obsidian";
import { commonCodeblockPostProcessor } from "./postProcessor";
import { livePreviewCM6Extension } from './CM6Extensions';

export default class ObsidianAdvancedCodeblockPlugin extends Plugin {
	async onload() {
		console.log("Loading Advanced Codeblock");

		// Add functionality to live-preview mode
		this.registerEditorExtension([livePreviewCM6Extension]);

		// Add functionality to preview mode
		this.registerMarkdownPostProcessor((element, context) => {
			commonCodeblockPostProcessor(element, context, this.app, this);
		});
	}

	onunload() {}
}
