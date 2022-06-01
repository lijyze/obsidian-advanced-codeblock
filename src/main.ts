import { Editor, Plugin } from "obsidian";
import { commonCodeblockPostProcessor } from "./postProcessor";

export default class MyPlugin extends Plugin {
	private editor: Editor;

	async onload() {
		console.log("Loading Advanced Codeblock");

		// Handle every code blocks
		this.registerMarkdownPostProcessor((element, context) => {
			commonCodeblockPostProcessor(element, context, this.app);
		});
	}

	onunload() {}
}
