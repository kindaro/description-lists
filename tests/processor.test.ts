import { describe, it } from "vitest";
import { assert } from "chai";

import { parseHTML, renderHTML } from "../source/helpers";

import { recursivelyProcessDescriptionLists } from "../source/processor";

describe(recursivelyProcessDescriptionLists, () => {
	it("keeps blank input the same", () => {
		const root = document.getElementsByTagName("body")[0];
		const copyOfRoot = root.cloneNode(true);
		recursivelyProcessDescriptionLists(root);
		assert.equal(renderHTML(root), renderHTML(copyOfRoot));
	});
	it("works on definition lists at the top", () => {
		const body = document.getElementsByTagName("body")[0];
		const root = body.appendChild(parseHTML(`<div></div>`));
		if (root instanceof Element) {
			root.innerHTML =
				"<p>term A<br>: detail A</p><p>term B<br>: detail B</p>";
			recursivelyProcessDescriptionLists(root);
			assert.equal(
				renderHTML(root),
				"<div><dl><dt>term A</dt> <dd>detail A</dd> <dt>term B</dt> <dd>detail B</dd></dl></div>",
			);
		} else {
			assert.fail("Impossible: `div` is not an element?");
		}
	});
	it("works on definition lists in depth", () => {
		const body = document.getElementsByTagName("body")[0];
		const root = body.appendChild(parseHTML(`<div></div>`));
		if (root instanceof Element) {
			root.innerHTML =
				"<section>some text<ul><li><p>term A<br>: detail A</p><p>term B<br>: detail B</p></li></ul>some more text</section>";
			recursivelyProcessDescriptionLists(root);
			assert.equal(
				renderHTML(root),
				"<div><section>some text<ul><li><dl><dt>term A</dt> <dd>detail A</dd> <dt>term B</dt> <dd>detail B</dd></dl></li></ul>some more text</section></div>",
			);
		} else {
			assert.fail("Impossible: `div` is not an element?");
		}
	});
});
