import { describe, it } from "vitest";
import { assert } from "chai";

import {
	parseSomeSunderedTidbits,
	parseMatching,
	parseMap,
	parses,
	parseZebra,
} from "../source/parsers";
import { initialize, construct } from "../source/zebras";

describe("parseZebra", () => {
	it("does not parse empty input", () =>
		assert.strictEqual(parseZebra(parseOdd, parseEven, []), null));
	it("parses one stripe", () =>
		assert.deepEqual(parseZebra(parseOdd, parseEven, [1]), {
			outcome: initialize<number, number>(1),
			leftover: [],
		}));
	it("parses three stripes", () =>
		assert.deepEqual(parseZebra(parseOdd, parseEven, [1, 2, 3]), {
			outcome: construct(1, 2, initialize(3)),
			leftover: [],
		}));
	it("stops parsing on white if parsed one stripe", () =>
		assert.deepEqual(parseZebra(parseOdd, parseEven, [1, 2]), {
			outcome: initialize<number, number>(1),
			leftover: [2],
		}));
	it("stops parsing on white if parsed three stripes", () =>
		assert.deepEqual(parseZebra(parseOdd, parseEven, [1, 2, 3, 5]), {
			outcome: construct(1, 2, initialize(3)),
			leftover: [5],
		}));
});

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
