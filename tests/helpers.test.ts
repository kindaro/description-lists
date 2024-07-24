import { describe, it } from "vitest";
import { assert } from "chai";

import { renderHTML, sequence } from "../source/helpers";
import { assertWithNode } from "./assertions";

describe("sequence", () => {
	it("returns null if there is a null in the input", () => {
		assert.deepStrictEqual(sequence(["cat", null, "fish"]), null);
	});
	it("returns the input if there is no null in the input", () => {
		assert.deepEqual(sequence(["cat", "bunny", "fish"]), [
			"cat",
			"bunny",
			"fish",
		]);
	});
});

describe("renderHTML", () => {
	it("renders simple code exactly", () => {
		const html = `<p>hello</p>`;
		assertWithNode(html, (nodes) =>
			assert.equal(renderHTML(nodes[0]), html),
		);
	});
});
