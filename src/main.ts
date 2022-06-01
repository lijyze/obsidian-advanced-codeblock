import { Editor, Plugin } from "obsidian";
import { commonCodeblockPostProcessor } from "./postProcessor";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
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
