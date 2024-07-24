import { assert } from "chai";

import { parses, trueParses } from "source/parsers";

export function assertWithNode(
	html: string,
	assertion: (_: Node[]) => void,
): void {
	const root = document.getElementsByTagName("html")[0];
	const division = `<div id="target">${html}</div>`;
	root.innerHTML = division;
	const node = document.getElementById("target");
	if (node === null) assert.fail("test is broken");
	else assertion(Array.from(node.childNodes));
}

export function assertParseWithNode<outcomes>(
	html: string,
	parse: (_: Node[]) => parses<Node, outcomes>,
	expected: (_: Node[]) => trueParses<Node, outcomes>,
): void {
	assertWithNode(html, (nodes) => {
		const parsed = parse(nodes);
		if (parsed === null) assert.fail("no parse");
		else assert.deepEqual(parsed, expected(nodes));
	});
}
