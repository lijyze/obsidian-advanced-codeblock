import { loadPrism } from 'obsidian';
import { extendLineNumberPlugin } from './../lib/prism-line-numbers';
import { extendLineHighlightPlugin } from './../lib/prism-line-highlight'

loadPrism().then((val) => {
  extendLineNumberPlugin(window.Prism)
  extendLineHighlightPlugin(window.Prism)
});