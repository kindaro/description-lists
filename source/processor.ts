import {
	annotatedDescriptions,
	buildDescriptionListHTML,
	parseDescriptionListsAndStuff,
} from "./descriptions";
import { parseHTML } from "./helpers";
import { trueParses } from "./parsers";
import { getBlackStripes, getWhiteStripes, zebras } from "./zebras";

/**
 * In a given DOM element, replace consecutive paragraphs that look like
 * description lists with actual description lists.
 *
 * A paragraph looks like a description list when it holds some lines without a
 * leading colon and then some lines with a leading colon . These lines may
 * themselves contain inline elements.
 */
export function recursivelyProcessDescriptionLists(element: Element): void {
	function nodeIsNotAllBlank(node: Node): boolean {
		return node.nodeType === Node.TEXT_NODE &&
			node.textContent !== null &&
			node.textContent.trim().length === 0
			? false
			: true;
	}
	const nodes = Array.from(element.childNodes).filter(nodeIsNotAllBlank);
	const parsedDescriptionListsAndStuff = parseDescriptionListsAndStuff(
		nodes,
	) as trueParses<Node, zebras<Node[], annotatedDescriptions[]>>;
	for (const node of getWhiteStripes(
		parsedDescriptionListsAndStuff.outcome,
	).flat()) {
		if (node instanceof Element) {
			recursivelyProcessDescriptionLists(node);
		}
	}
	for (const arrayOfAnnotatedDescriptions of getBlackStripes(
		parsedDescriptionListsAndStuff.outcome,
	)) {
		const descriptionListHTML = buildDescriptionListHTML(
			arrayOfAnnotatedDescriptions.map(
				(annotatedDescription) => annotatedDescription.description,
			),
		);
		element.replaceChild(
			parseHTML(descriptionListHTML),
			arrayOfAnnotatedDescriptions[0].node,
		);
		for (const { node } of arrayOfAnnotatedDescriptions.slice(1)) {
			element.removeChild(node);
		}
	}
}
