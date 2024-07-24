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
export function sequence<tidbits>(input: (tidbits | null)[]): tidbits[] | null {
	const output: tidbits[] = [];
	for (let index = 0; index < input.length; index++) {
		const tidbit = input[index];
		if (tidbit === null) return null;
		else output.push(tidbit);
	}
	return output;
}
