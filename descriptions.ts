import {
	parses,
	parseMap,
	parseMatching,
	parseSomeSunderedTidbits,
	parseMany,
	parseSome,
	parseThisButNotThat,
} from "parsers";
import { renderHTML } from "helpers";

/** A description is some terms and some details. */
type descriptions = { terms: string[]; details: string[] };

/**
 * Given an array of descriptions, build an HTML structure of a description
 * list.
 */
export function buildDescriptionListHTML(
	descriptionArray: descriptions[],
): string {
	return (
		"<dl>" +
		descriptionArray.map(buildDescriptionHTML).join(" ").trim() +
		"</dl>"
	);
}

/**
 * Given a description, build an HTML structure holding its terms and details.
 */
export function buildDescriptionHTML(description: descriptions): string {
	const termsString = description.terms
		.map((term) => "<dt>" + term.trim() + "</dt>")
		.join(" ");
	const detailsString = description.details
		.map((detail) => "<dd>" + detail.trim() + "</dd>")
		.join(" ");
	return termsString + detailsString;
}

/**
 * Given an array of DOM nodes, try to recognize it as a description list.
 *
 * This function will try first to parse some terms, and then some details. If
 * it cannot find at least one of each, or if any of the input is left over, it
 * will return `null`.
 */
export function parseDescription(input: Node[]): parses<Node, descriptions> {
	function parseLineBreak(
		input: Node[],
	): parses<Node, Record<string, never>> {
		const parsedLineBreak = parseMatching(
			(node: Node) =>
				"nodeName" in node ? node.nodeName === "BR" : false,
			input,
		);
		if (parsedLineBreak === null) {
			return null;
		} else return { outcome: {}, leftover: parsedLineBreak.leftover };
	}

	function parseTerm(input: Node[]): parses<Node, string> {
		if (input.length === 0) {
			return null;
		} else {
			const firstNodeString: string = renderHTML(input[0]);
			if (firstNodeString.trim()[0] === ":") {
				return null;
			} else {
				return {
					outcome: firstNodeString,
					leftover: input.slice(1),
				};
			}
		}
	}

	function parseManifoldTerm(input: Node[]): parses<Node, string> {
		const parsedTermElements = parseSome(
			(input) => parseThisButNotThat(parseTerm, parseLineBreak, input),
			input,
		);
		if (parsedTermElements === null) {
			return null;
		} else {
			return {
				outcome: parsedTermElements.outcome.join(" "),
				leftover: parsedTermElements.leftover,
			};
		}
	}

	function parseDetail(input: Node[]): parses<Node, string> {
		if (input.length === 0) {
			return null;
		} else {
			const firstNodeString: string = renderHTML(input[0]);
			if (firstNodeString.trim()[0] === ":") {
				return {
					outcome: firstNodeString.trim().slice(1),
					leftover: input.slice(1),
				};
			} else {
				return null;
			}
		}
	}

	function parseManifoldDetail(input: Node[]): parses<Node, string> {
		const parsedFirstDetailElement = parseDetail(input);
		if (parsedFirstDetailElement === null) {
			return null;
		} else {
			function parseUntilLineBreak(
				input: Node[],
			): parses<Node, string[]> {
				return parseMany(
					(input) =>
						parseThisButNotThat(
							(input) =>
								parseMap(
									renderHTML,
									parseMatching(() => true, input),
								),
							parseLineBreak,
							input,
						),
					input,
				);
			}

			const parsedOtherDetailElements = parseUntilLineBreak(
				parsedFirstDetailElement.leftover,
			);
			if (parsedOtherDetailElements === null) {
				return null;
			} else {
				return {
					outcome: [parsedFirstDetailElement.outcome]
						.concat(parsedOtherDetailElements.outcome)
						.join(" "),
					leftover: parsedOtherDetailElements.leftover,
				};
			}
		}
	}

	const parsedTerms: parses<Node, string[]> = parseSomeSunderedTidbits(
		parseLineBreak,
		parseManifoldTerm,
		input,
	);
	const parsedLineBreak: parses<Node, Record<string, never>> = parsedTerms
		? parseLineBreak(parsedTerms.leftover)
		: null;
	const parsedDetails: parses<Node, string[]> = parsedLineBreak
		? parseSomeSunderedTidbits(
				parseLineBreak,
				parseManifoldDetail,
				parsedLineBreak.leftover,
			)
		: null;
	if (
		parsedTerms === null ||
		parsedLineBreak === null ||
		parsedDetails === null ||
		parsedDetails.leftover.length > 0
	) {
		return null;
	} else {
		return {
			outcome: {
				terms: parsedTerms.outcome,
				details: parsedDetails.outcome,
			},
			leftover: parsedTerms.leftover,
		};
	}
}
