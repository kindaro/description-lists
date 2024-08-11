import {
	parses,
	parseMap,
	parseMatching,
	parseSomeSunderedTidbits,
	parseMany,
	parseSome,
	parseThisButNotThat,
	trueParses,
	parseWholeInput,
	parseZebra,
} from "./parsers";
import { renderHTML } from "./helpers";
import { zebras } from "./zebras";

/** A description is some terms and some details. */
export type descriptions = { terms: string[]; details: string[] };

/**
 * When a description is parsed from a node, it is sometimes gainful to remember
 * that node.
 */
export type annotatedDescriptions = { node: Node; description: descriptions };

/**
 * Given an array of descriptions, build an HTML structure of a description
 * list.
 */
export function buildDescriptionListHTML(
	descriptionArray: descriptions[],
): string {
	return (
		"<dl>" +
		descriptionArray.map(buildDescriptionHTML).join(" ").trimStart() +
		"</dl>"
	);
}

/**
 * Given a description, build an HTML structure holding its terms and details.
 */
export function buildDescriptionHTML(description: descriptions): string {
	const termsString = description.terms
		.map((term) => "<dt>" + term.trimStart() + "</dt>")
		.join(" ");
	const detailsString = description.details
		.map((detail) => "<dd>" + detail.trimStart() + "</dd>")
		.join(" ");
	return termsString + " " + detailsString;
}

/**
 * Obsidian inserts divisions that do nothing on the top level. These divisions
 * isolate descriptions that should be recognized as consecutive. This function
 * unwraps such idle divisions.
 */
function unwrapIdleDivision(node: Node): Element | null {
	return node instanceof Element &&
		node.childNodes[0] instanceof Element
		? (node.childNodes[0] as Element)
		: null;
}

/**
 * given an array of DOM nodes, try to recognize it as description lists
 * interspersed with other stuff.
 */
export function parseDescriptionListsAndStuff(
	input: Node[],
): parses<Node, zebras<Node[], annotatedDescriptions[]>> {
	function parseNestedDescription(input: Node[]) {
		if (input.length === 0) return null;
		else {
			let rootNode = input[0];
			let unwrappedNode = unwrapIdleDivision(rootNode)
			let targetNode = rootNode
			let parsedDescription = parseDescription(
				Array.from(targetNode.childNodes),
			);
			if (parsedDescription === null) return null;
			else {
				return {
					outcome: {
						node: rootNode,
						description: parsedDescription.outcome,
					},
					leftover: input.slice(1),
				};
			}
		}
	}

	function parseStuff(input: Node[]) {
		return parseThisButNotThat(
			(input) => parseMatching(() => true, input),
			parseNestedDescription,
			input,
		);
	}

	return parseZebra(
		(input) => parseMany(parseStuff, input),
		(input) => parseSome((input) => parseNestedDescription(input), input),
		input,
	);
}

/**
 * Given an array of DOM nodes, try to recognize it as a description list.
 *
 * This function will try first to parse some terms, and then some details. If
 * it cannot find at least one of each, or if any of the input is left over, it
 * will return `null`.
 */
export function parseDescription(input: Node[]): parses<Node, descriptions> {
	const parsedTerms: parses<Node, string[]> = parseSomeSunderedTidbits(
		parseLineBreak,
		parseTerm,
		input,
	);
	const parsedLineBreak: parses<Node, Record<string, never>> = parsedTerms
		? parseLineBreak(parsedTerms.leftover)
		: null;
	const parsedDetails: parses<Node, string[]> = parsedLineBreak
		? parseWholeInput(
				(input) =>
					parseSomeSunderedTidbits(
						parseLineBreak,
						parseDetail,
						parsedLineBreak.leftover,
					),
				parsedLineBreak.leftover,
			)
		: null;
	if (
		parsedTerms === null ||
		parsedLineBreak === null ||
		parsedDetails === null
	) {
		return null;
	} else {
		return {
			outcome: {
				terms: parsedTerms.outcome,
				details: parsedDetails.outcome,
			},
			leftover: parsedDetails.leftover,
		};
	}
}

export function parseLineBreak(
	input: Node[],
): parses<Node, Record<string, never>> {
	const parsedLineBreak = parseMatching(
		(node: Node) => node.nodeName === "BR",
		input,
	);
	return parseMap(() => ({}), parsedLineBreak);
}

export function parseTermChunk(input: Node[]): parses<Node, string> {
	if (input.length === 0) {
		return null;
	} else {
		const firstNodeString: string = renderHTML(input[0]);
		if (firstNodeString.trimStart()[0] === ":") {
			return null;
		} else {
			return {
				outcome: firstNodeString,
				leftover: input.slice(1),
			};
		}
	}
}

export function parseTerm(input: Node[]): parses<Node, string> {
	const parsedTermChunks = parseSome(
		(input) => parseThisButNotThat(parseTermChunk, parseLineBreak, input),
		input,
	);
	if (parsedTermChunks === null) {
		return null;
	} else {
		return parseMap(
			(stringArray) => stringArray.join(""),
			parsedTermChunks,
		);
	}
}

export function parseDetailChunk(input: Node[]): parses<Node, string> {
	if (input.length === 0) {
		return null;
	} else {
		const firstNodeString: string = renderHTML(input[0]);
		if (firstNodeString.trimStart()[0] === ":") {
			return {
				outcome: firstNodeString.trimStart().slice(1),
				leftover: input.slice(1),
			};
		} else {
			return null;
		}
	}
}

export function parseDetail(input: Node[]): parses<Node, string> {
	const parsedFirstDetailChunk = parseDetailChunk(input);
	if (parsedFirstDetailChunk === null) {
		return null;
	} else {
		function parseUntilLineBreak(input: Node[]): parses<Node, string[]> {
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

		const parsedOtherDetailChunks = parseUntilLineBreak(
			parsedFirstDetailChunk.leftover,
		) as trueParses<Node, string[]>;
		return {
			outcome: [parsedFirstDetailChunk.outcome]
				.concat(parsedOtherDetailChunks.outcome)
				.join(""),
			leftover: parsedOtherDetailChunks.leftover,
		};
	}
}
