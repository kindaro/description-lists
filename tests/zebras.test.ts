import { describe, it } from "vitest";
import { assert } from "chai";

import {
	initialize,
	construct,
	reverse,
	getWhiteStripes,
	getBlackStripes,
} from "../source/zebras";

describe("reverse", () => {
	it("reverses lonely tail", () =>
		assert.deepEqual(reverse(initialize(1)), initialize(1)));
	it("reverses a 3-striped zebra", () =>
		assert.deepEqual(
			reverse(construct(1, 2, initialize(3))),
			construct(3, 2, initialize(1)),
		));
	it("reverses a 5-striped zebra", () =>
		assert.deepEqual(
			reverse(construct(1, 2, construct(3, 4, initialize(5)))),
			construct(5, 4, construct(3, 2, initialize(1))),
		));
});

describe("getWhiteStripes", () => {
	it("handles lonely tail", () =>
		assert.deepEqual(getWhiteStripes(initialize(1)), [1]));
	it("handles a three striped zebra", () =>
		assert.deepEqual(
			getWhiteStripes(construct(1, 2, initialize(3))),
			[1, 3],
		));
});

describe("getBlackStripes", () => {
	it("handles lonely tail", () =>
		assert.deepEqual(getBlackStripes(initialize(1)), []));
	it("handles a three striped zebra", () =>
		assert.deepEqual(getBlackStripes(construct(1, 2, initialize(3))), [2]));
});
