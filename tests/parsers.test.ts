import { describe, it } from "vitest";
import { assert } from "chai";

import {
	parseSomeSunderedTidbits,
	parseMatching,
	parseMap,
	parses,
} from "../source/parsers";

describe("parseSomeSunderedTidbits", () => {
	it("parses one tidbit", () =>
		assert.deepEqual(
			parseSomeSunderedTidbits(
				forgetOutcome(parseOdd),
				parseOdd,
				[1, 2, 3],
			),
			{ outcome: [1], leftover: [2, 3] },
		));
	it("parses two tidbits", () =>
		assert.deepEqual(
			parseSomeSunderedTidbits(
				forgetOutcome(parseEven),
				parseOdd,
				[1, 2, 3],
			),
			{ outcome: [1, 3], leftover: [] },
		));
	it("needs at least one tidbit", () =>
		assert.strictEqual(
			parseSomeSunderedTidbits(
				forgetOutcome(parseOdd),
				parseEven,
				[1, 2, 3],
			),
			null,
		));
});

const parseEven = (numbers: number[]) =>
	parseMatching((number) => number % 2 === 0, numbers);
const parseOdd = (numbers: number[]) =>
	parseMatching((number) => number % 2 === 1, numbers);
function forgetOutcome<runes, outcomes>(
	parser: (_: runes[]) => parses<runes, outcomes>,
) {
	return (input: runes[]) => parseMap(() => ({}), parser(input));
}
