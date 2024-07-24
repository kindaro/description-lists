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
		) as trueParses<runes, outcomes[]>;
		return {
			outcome: [parsedTidbit.outcome].concat(parsedTidbits.outcome),
			leftover: parsedTidbits.leftover,
		};
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
