import {
	App,
	MarkdownPostProcessorContext,
	MarkdownView,
	Plugin,
} from "obsidian";
import { paramRegex, braceSurroundingRegex } from "./util";
import "./extendPrism";

type HandlerSet = (() => void)[];

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

// handle line number
function handleLineNumbers(
	pre: HTMLPreElement,
	params: string[],
	initHandlers: HandlerSet
) {
	if (!params.includes("nums")) return;

	pre.classList.add("line-numbers");

	const initLineNumbers = () => {
		window.Prism.plugins.lineNumbers.resize(pre);
	};

	initHandlers.push(initLineNumbers);
}

function handleLineHighlight(
	pre: HTMLPreElement,
	params: string[],
	initHandlers: HandlerSet
) {
	const lineHightlightParamIdx = params.findIndex((param) =>
		braceSurroundingRegex.test(param)
	);
	if (lineHightlightParamIdx === -1) return;

	pre.dataset.line = params[lineHightlightParamIdx].slice(1, -1);

	const initLineHighlight = () => {
		window.Prism.plugins.lineHighlight.highlightLines(pre)();
	};

	initHandlers.push(initLineHighlight);
}

export function commonCodeblockPostProcessor(
	element: HTMLElement,
	context: MarkdownPostProcessorContext,
	app: App,
	plugin: Plugin
) {
	// check if processor should run
	const processResult = processParams(element, context, app);
	if (!processResult) return;

	const { pre, params } = processResult;
	const initHandlers: HandlerSet = [];

	// add line numbers.
	handleLineNumbers(pre, params, initHandlers);

	// add line highlight
	handleLineHighlight(pre, params, initHandlers);

	// Reinit after mount
	onMounted(pre, () => {
		initHandlers.forEach((handler) => {
			handler();
		});
	});

	// Reinit after resize
	plugin.registerEvent(
		app.workspace.on("resize", () => {
			initHandlers.forEach((handler) => {
				handler();
			});
		})
	);
}
