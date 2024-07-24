import { Plugin, MarkdownPostProcessorContext } from "obsidian";
import {
	parseDescription,
	buildDescriptionListHTML,
} from "./source/descriptions";
import { sequence } from "./source/helpers";

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

/**
 * In a given DOM element, replace paragraphs that look like description lists
 * with actual description lists.
 *
 * A paragraph looks like a description list when it holds some lines without a
 * leading colon and a space and then some lines with a leading colon and a
 * space. These lines may themselves contain inline elements.
 */
export function recursivelyProcessDescriptionLists(element: Element) {
	const nodes = Array.from(element.childNodes);
	const parsedDescriptions = nodes.map((node) =>
		parseDescription(Array.from(node.childNodes)),
	);
	const trulyParsedDescriptions = sequence(parsedDescriptions);
	if (trulyParsedDescriptions && trulyParsedDescriptions.length > 0) {
		element.innerHTML = buildDescriptionListHTML(
			trulyParsedDescriptions.map(({ outcome }) => outcome),
		);
	} else {
		Array.from(element.children).forEach((underling) => {
			recursivelyProcessDescriptionLists(underling);
		});
	}
}
