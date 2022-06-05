import { Plugin } from "obsidian";
import { commonCodeblockPostProcessor } from "./postProcessor";

export default class ObsidianAdvancedCodeblockPlugin extends Plugin {
	async onload() {
		console.log("Loading Advanced Codeblock");

		// Handle every code blocks
		this.registerMarkdownPostProcessor((element, context) => {
			commonCodeblockPostProcessor(element, context, this.app);
			// element.querySelectorAll('code').forEach((code) => {
			// 	code.replaceChildren('hello!')
			// })
			// element.querySelector('code')?.createSpan({text: 'hello!'}) no

			element.querySelector('code')?.appendText('method1');
			element.querySelectorAll('code').forEach((code) => {
				// const temp = document.createElement('span');
				// temp.appendText('test');

				code.appendText('method2')
			})

			const code = element.querySelector('code');
			if (code) {
				[code].forEach((code) => {
					// const temp = document.createElement('span');
					// temp.appendText('test');
	
					code.appendText('method3')
				})
			}
		});
	}

	onunload() {}
}
