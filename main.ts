import { Plugin, MarkdownPostProcessorContext } from "obsidian";

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

/**
 * A true parse is never `null`.
 */
export type trueParses<runes, outcomes> = {
	outcome: outcomes;
	leftover: runes[];
};

/**
 * A parse may be null, or else it will hold some outcome and any number of
 * runes left over
 */
export type parses<runes, outcomes> = trueParses<runes, outcomes> | null;

/**
 * Whenever you have a parse, you can map a function over its hopeful
 * outcome. Parses are a functor.
 */
export function parseMap<runes, inputs, outputs>(
	mapping: (_: inputs) => outputs,
	argument: parses<runes, inputs>,
): parses<runes, outputs> {
	if (argument === null) {
		return null;
	} else
		return {
			outcome: mapping(argument.outcome),
			leftover: argument.leftover,
		};
}

/**
 * Parse a rune that belongs to a given set. All other runes are left over. If
 * the first rune is not matching, or if the input is empty, return `null`.
 */
export function parseMatching<runes>(
	isMatching: (rune: runes) => boolean,
	input: runes[],
): parses<runes, runes> {
	return input.length > 0 && isMatching(input[0])
		? { outcome: input[0], leftover: input.slice(1) }
		: null;
}

/**
 * Given a way to parse a tidbit, and a way to parse a sunderer, parse an array of tidbits.
 *
 * For example, a tidbit may be a word and a sunderer may be whitespace — then
 * you will have an array of words without any whitespace.
 */
export function parseSomeSunderedTidbits<runes, outcomes>(
	parseSunderer: (input: runes[]) => parses<runes, Record<string, never>>,
	parseTidbit: (input: runes[]) => parses<runes, outcomes>,
	input: runes[],
): parses<runes, outcomes[]> {
	function parseSundererThenTidbit(input: runes[]): parses<runes, outcomes> {
		const parsedSunderer = parseSunderer(input);
		if (parsedSunderer === null) {
			return null;
		} else {
			const parsedTidbit = parseTidbit(parsedSunderer.leftover);
			if (parsedTidbit === null) {
				return null;
			} else {
				return parsedTidbit;
			}
		}
	}

	const parsedTidbit = parseTidbit(input);
	if (parsedTidbit === null) {
		return null;
	} else {
		const parsedTidbits = parseMany(
			parseSundererThenTidbit,
			parsedTidbit.leftover,
		);
		if (parsedTidbits === null) {
			return {
				outcome: [parsedTidbit.outcome],
				leftover: parsedTidbit.leftover,
			};
		} else {
			return {
				outcome: [parsedTidbit.outcome].concat(parsedTidbits.outcome),
				leftover: parsedTidbits.leftover,
			};
		}
	}
}

/**
 * Parse the same thing zero or more times.
 */
export function parseMany<runes, outcomes>(
	parseTidbit: (input: runes[]) => parses<runes, outcomes>,
	input: runes[],
): parses<runes, outcomes[]> {
	const outcome: outcomes[] = [];
	let leftover: runes[] = input;
	while (true) {
		const parsedTidbit = parseTidbit(leftover);
		if (parsedTidbit) {
			leftover = parsedTidbit.leftover;
			outcome.push(parsedTidbit.outcome);
		} else {
			break;
		}
	}
	return { outcome, leftover };
}

/**
 * Parse the same thing one or more times.
 */
export function parseSome<runes, outcomes>(
	parseTidbit: (input: runes[]) => parses<runes, outcomes>,
	input: runes[],
): parses<runes, outcomes[]> {
	const parsedMany = parseMany(parseTidbit, input);
	if (parsedMany && parsedMany.outcome.length === 0) {
		return null;
	} else {
		return parsedMany;
	}
}

/**
 * Parse something, so far as it cannot be parsed by the other parser.
 *
 * For example, you may parse any letter but the new line symbol. Repeat this
 * many times and you will have parsed a line.
 */
export function parseThisButNotThat<runes, outcomes>(
	parseThis: (input: runes[]) => parses<runes, outcomes>,
	parseThat: (input: runes[]) => parses<runes, Record<string, unknown>>,
	input: runes[],
): parses<runes, outcomes> {
	const parsedThat = parseThat(input);
	if (parsedThat === null) {
		return parseThis(input);
	} else return null;
}

/**
 * There is no way to render a DOM node into an HTML string. As a workaround, we
 * copy it and put it into a fake paragraph, then we can take its `innerHTML`.
 */
export function renderHTML(node: Node): string {
	const paragraph = document.createElement("p");
	const freshNode = node.cloneNode(true);
	paragraph.appendChild(freshNode);
	return paragraph.innerHTML;
}

/**
 * If the given array has at least one `null`, return `null`, otherwise return
 * an array with a stricter type of elements, but the same contents.
 */
export function sequence<tidbits>(input: (tidbits | null)[]): tidbits[] {
	const output: tidbits[] = [];
	function check(tidbit: tidbits) {
		if (tidbit === null) return null;
		else output.push(tidbit);
	}
	input.forEach(check);
	return output;
}
