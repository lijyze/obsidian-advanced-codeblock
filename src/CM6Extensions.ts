import {
	ViewPlugin,
	ViewUpdate,
	EditorView,
	DecorationSet,
	Decoration,
	WidgetType,
} from "@codemirror/view";
// @ts-ignore
import { RangeSetBuilder } from "@codemirror/state";
// @ts-ignore
import { syntaxTree, lineClassNodeProp } from "@codemirror/language";
// import { lineClassNodeProp } from '@codemirror/stream-parser'
import { braceSurroundingRegex, paramRegex } from "./util";

interface CodeblockInfo {
	showLineNumbers: boolean;
	highlightLines: number[] | null;
	typeLines: string[] | null;
}

class LineNumberWidget extends WidgetType {
	idx: number;

	constructor(idx: number) {
		super();
		this.idx = idx;
	}

	toDOM() {
		const el = document.createElement("span");
		el.className = "live-preview-codeblock-line-nums";
		el.textContent = "" + this.idx;
		return el;
	}
}

function generateClassByType(type: string) {
	switch (type) {
		case "a":
			return "live-preview-codeblock-highlight add-live-preview-codeblock-highlight";
		case "e":
			return "live-preview-codeblock-highlight error-live-preview-codeblock-highlight";
		case "c":
			return "live-preview-codeblock-highlight comment-live-preview-codeblock-highlight";
		case "g":
			return "live-preview-codeblock-highlight general-live-preview-codeblock-highlight";
		default:
			return "live-preview-codeblock-highlight general-live-preview-codeblock-highlight";
	}
}

export const livePreviewCM6Extension = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet;

		constructor(view: EditorView) {
			this.decorations = this.buildDecorations(view);
		}

		update(update: ViewUpdate) {
			if (update.docChanged || update.viewportChanged)
				this.decorations = this.buildDecorations(update.view);
		}

		destory() {}

		buildDecorations(view: EditorView) {
			const builder = new RangeSetBuilder<Decoration>();
			const codeblockInfo: CodeblockInfo = {
				showLineNumbers: false,
				highlightLines: null,
				typeLines: null,
			};
			let startLineNum: number;

			for (const { from, to } of view.visibleRanges) {
				try {
					const tree = syntaxTree(view.state);

					tree.iterate({
						from,
						to,
						// @ts-ignore
						enter: ({ type, from, to }) => {
							const lineClasses: any =
								type.prop(lineClassNodeProp);

							if (!lineClasses) return;
							const classes = lineClasses
								? new Set(lineClasses?.split(" "))
								: null;
							const isCodeblockBegin = classes.has(
								"HyperMD-codeblock-begin"
							);
							const isCodeblockLine =
								classes &&
								classes.has("HyperMD-codeblock-bg") &&
								!classes.has("HyperMD-codeblock-begin") &&
								!classes.has("HyperMD-codeblock-end");

							// reset data when found codeblock begin line.
							if (isCodeblockBegin) {
								const startLine = view.state.doc.lineAt(from);
								const codeblockParams = startLine.text
									.match(paramRegex)
									.slice(1);
								const highlightParam = codeblockParams
									.find((param) =>
										braceSurroundingRegex.test(param)
									)
									?.slice(1, -1);

								startLineNum = startLine.number;
								codeblockInfo.showLineNumbers = false;
								codeblockInfo.highlightLines = null;

								if (codeblockParams.includes("nums"))
									codeblockInfo.showLineNumbers = true;
								if (highlightParam) {
									const [_highlightLines, _typeLines] =
										highlightParam
											.replace(" ", "")
											.split(",")
											.reduce(
												(
													acc: [number[], string[]],
													line: string
												) => {
													const type2 =
														line.split("@")[0] ||
														"g";
													const _line = line.split(
														"@"
													)[1]
														? line.split("@")[1]
														: line.split("@")[0];
													if (!+_line) {
														const res = [];
														const _type = [];
														const [start, end] =
															_line.split("-");
														for (
															let i = +start;
															i <= +end;
															i++
														) {
															res.push(i);
															_type.push(type2);
														}

														acc[0].push(...res);
														acc[1].push(..._type);
														return acc;
													}
													acc[0].push(+_line);
													acc[1].push(type2);
													return acc;
												},
												[[], []]
											);
									codeblockInfo.highlightLines =
										_highlightLines;
									codeblockInfo.typeLines = _typeLines;
								}
							}

							if (!isCodeblockLine) return;

							const currentLineNum =
								view.state.doc.lineAt(from).number;

							if (codeblockInfo.showLineNumbers) {
								const deco = Decoration.widget({
									widget: new LineNumberWidget(
										currentLineNum - startLineNum
									),
									side: -10000,
								});
								builder.add(from, from, deco);
							}

							if (codeblockInfo.highlightLines) {
								if (
									codeblockInfo.highlightLines.includes(
										currentLineNum - startLineNum
									)
								) {
									const highlightIndex =
										codeblockInfo.highlightLines.findIndex(
											(line) =>
												line ===
												currentLineNum - startLineNum
										);
									const line = view.state.doc.lineAt(from);
									const deco = Decoration.line({
										attributes: {
											class: generateClassByType(
												codeblockInfo.typeLines[
													highlightIndex
												]
											),
										},
									});

									// @ts-ignore
									if (builder.last?.startSide) {
										// @ts-ignore
										deco.startSide = builder.last.startSide;
										deco.endSide = deco.startSide;
									}

									builder.add(line.from, line.from, deco);
								}
							}
						},
					});
				} catch (error) {
					console.log(error);
				}
			}

			return builder.finish();
		}
	},
	{
		decorations: (v) => v.decorations,
	}
);
