import { App, MarkdownPostProcessorContext, MarkdownView } from "obsidian";
import "./extendPrism";

const paramRegex = /\{.+\}|\w+/g;
const braceSurroundingRegex = /^{.+}$/;

function processParams(
	element: HTMLElement,
	context: MarkdownPostProcessorContext,
	app: App
) {
	// Only works with code blocks;
	const pre: HTMLPreElement = element.querySelector("pre:not(.frontmatter)");
	if (!pre) return null;

	const codeBlock = context.getSectionInfo(element);
	if (!codeBlock) return null;

	const origin = app.workspace
		.getActiveViewOfType(MarkdownView)
		?.editor.getLine(codeBlock.lineStart)
		.slice(3);

	// not specify anything or no active view
	if (!origin) return null;

	const codeBlockInfo = origin.match(paramRegex);
	const params = codeBlockInfo.slice(1);

	// return if no param
	if (!params.length) return null;

	return { pre, params };
}

function onMounted(element: HTMLElement, onAttachCallback: () => void) {
	const observer = new MutationObserver(function () {
		function isAttached(el: HTMLElement | null): boolean {
			if (el.parentNode === document) {
				return true;
			} else if (el.parentNode === null) {
				return false;
			} else {
				return isAttached(el.parentNode as HTMLElement);
			}
		}

		if (isAttached(element)) {
			observer.disconnect();
			onAttachCallback();
		}
	});

	observer.observe(document, {
		childList: true,
		subtree: true,
	});
}

export function commonCodeblockPostProcessor(
	element: HTMLElement,
	context: MarkdownPostProcessorContext,
	app: App
) {
	// check if processor should run
	const processResult = processParams(element, context, app);
	if (!processResult) return;

	const { pre, params } = processResult;

	// add line numbers.
	if (params.includes("nums")) {
		pre.classList.add("line-numbers");
		
		onMounted(pre, () => {
			window.Prism.plugins.lineNumbers.resize(pre)
		})
	}

	// add line highlight
	const lineHightlightParamIdx = params.findIndex((param) =>
		braceSurroundingRegex.test(param)
	);
	if (lineHightlightParamIdx >= 0) {
		pre.dataset.line = params[lineHightlightParamIdx].slice(1, -1);

		onMounted(pre, () => {
			window.Prism.plugins.lineHighlight.highlightLines(pre)();
		})
	}
}

