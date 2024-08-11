import { Plugin, MarkdownPostProcessorContext } from "obsidian";

import { recursivelyProcessDescriptionLists } from "./source/processor";

export default class DescriptionListsPlugin extends Plugin {
	async onload() {
		this.registerMarkdownPostProcessor(processDescriptionLists);
	}
}

/**
 * This is a markdown post-processor that will replace paragraphs that look like
 * description lists with actual description lists.
 */
export function processDescriptionLists(
	element: HTMLElement,
	_context: MarkdownPostProcessorContext,
) {
	recursivelyProcessDescriptionLists(element);
}
