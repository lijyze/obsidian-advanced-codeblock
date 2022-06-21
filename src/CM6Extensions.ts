import { ViewPlugin, ViewUpdate, EditorView, DecorationSet, Decoration, WidgetType } from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/rangeset'
import { syntaxTree } from '@codemirror/language'
import { lineClassNodeProp } from '@codemirror/stream-parser'
import { braceSurroundingRegex, paramRegex } from './util'

interface CodeblockInfo {
  showLineNumbers: boolean;
  highlightLines: number[] | null;
}

class LineNumberWidget extends WidgetType {
  idx: number;

  constructor(idx: number) {
    super();
    this.idx = idx
  }

  toDOM() {
    const el = document.createElement('span');
    el.className = 'live-preview-codeblock-line-nums';
    el.textContent = '' + this.idx;
    return el;
  }
}

export const livePreviewCM6Extension = ViewPlugin.fromClass(class {
  decorations: DecorationSet

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) this.decorations = this.buildDecorations(update.view);
  }

  destory() {}

  buildDecorations(view: EditorView) {
    const builder = new RangeSetBuilder<Decoration>();
    const codeblockInfo: CodeblockInfo = {
      showLineNumbers: false,
      highlightLines: null,
    }
    let idx = 1;

    for (const {from, to} of view.visibleRanges) {
      try {
        const tree = syntaxTree(view.state)

        tree.iterate({
          from, to,
          enter: (type, from, to) => {
            const lineClasses = type.prop(lineClassNodeProp)

            if (!lineClasses) return ;
            const classes = new Set(lineClasses.split(' '));
            const isCodeblockBegin = classes.has('HyperMD-codeblock-begin');
            const isCodeblockLine = 
              classes.has('HyperMD-codeblock-bg') 
              && !classes.has('HyperMD-codeblock-begin')
              && !classes.has('HyperMD-codeblock-end');

            // reset data when found codeblock begin line.
            if (isCodeblockBegin) {
              idx = 1;
              const codeblockParams = view.state.doc.lineAt(from).text.match(paramRegex).slice(1);
              const highlightParam = codeblockParams.find((param) => braceSurroundingRegex.test(param))?.slice(1, -1);
              codeblockInfo.showLineNumbers = false;
              codeblockInfo.highlightLines = null;

              if (codeblockParams.includes('nums')) codeblockInfo.showLineNumbers = true;
              if (highlightParam) codeblockInfo.highlightLines = highlightParam.replace(' ', '').split(',').flatMap((line) => {
                if (!+line) {
                  const res = [];
                  const [start, end] = line.split('-');
                  for (let i = +start; i <= +end; i++) {
                    res.push(i);
                  }

                  return res;
                }

                return [+line];
              });
            }
            if (!isCodeblockLine) return ;
            
            if (codeblockInfo.showLineNumbers) {
              const deco = Decoration.widget({
                widget: new LineNumberWidget(idx)
              });
              builder.add(from, from, deco);
            }

            if (codeblockInfo.highlightLines) {
              if (codeblockInfo.highlightLines.includes(idx)) {
                const line = view.state.doc.lineAt(from);
                const deco = Decoration.line({
                  attributes: {class: 'live-preview-codeblock-highlight'}
                })

                // @ts-ignore
                if (builder.last?.startSide) {
                  // @ts-ignore
                  deco.startSide = builder.last.startSide;
                  deco.endSide = deco.startSide
                }

                builder.add(line.from, line.from, deco);
              }
            }

            idx++;
          }
        })
      } catch (error) {
        console.log(error)
      }
    }

    return builder.finish();
  }
}, 
{
  decorations: v => v.decorations
})