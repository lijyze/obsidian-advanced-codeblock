import { Plugin } from "obsidian";
import { commonCodeblockPostProcessor } from "./postProcessor";

export default class ObsidianAdvancedCodeblockPlugin extends Plugin {
	async onload() {
		console.log("Loading Advanced Codeblock");

		// Handle every code blocks
		this.registerMarkdownPostProcessor((element, context) => {
			commonCodeblockPostProcessor(element, context, this.app, this);
		});
	}

	onunload() {}
}
