import { describe, it } from "vitest";
import { assert } from "chai";

import { assertParseWithNode, assertWithNode } from "./assertions";
import { construct, initialize } from "../source/zebras";

import {
	buildDescriptionHTML,
	buildDescriptionListHTML,
	parseDescription,
	parseDescriptionListsAndStuff,
	parseDetail,
	parseTerm,
} from "../source/descriptions";

import { renderHTML } from "../source/helpers";

describe("buildDescriptionHTML", () => {
	it("renders empty description as whitespace", () =>
		assert.equal(buildDescriptionHTML({ terms: [], details: [] }), " "));
	it("renders simple description right", () =>
		assert.equal(
			buildDescriptionHTML({ terms: ["term"], details: ["detail"] }),
			"<dt>term</dt> <dd>detail</dd>",
		));
	it("renders complicated description right", () =>
		assert.equal(
			buildDescriptionHTML({
				terms: ["term A", "term B"],
				details: ["detail 1", "detail 2"],
			}),
			"<dt>term A</dt> <dt>term B</dt> <dd>detail 1</dd> <dd>detail 2</dd>",
		));
});

describe("buildDescriptionListHTML", () => {
	it("renders empty array of descriptions as empty description list", () =>
		assert.equal(buildDescriptionListHTML([]), "<dl></dl>"));
	it("renders simple description list right", () =>
		assert.equal(
			buildDescriptionListHTML([
				{ terms: ["term I"], details: ["detail I"] },
				{ terms: ["term II"], details: ["detail II"] },
			]),
			"<dl><dt>term I</dt> <dd>detail I</dd> <dt>term II</dt> <dd>detail II</dd></dl>",
		));
	it("renders complicated description right", () => {
		const input = [
			{
				terms: ["term A I", "term B I"],
				details: ["detail 1 I", "detail 2 I"],
			},
			{
				terms: ["term A II", "term B II"],
				details: ["detail 1 II", "detail 2 II"],
			},
		];
		const actual = buildDescriptionListHTML(input);
		const expected = [
			"<dl><dt>term A I</dt> <dt>term B I</dt>",
			"<dd>detail 1 I</dd> <dd>detail 2 I</dd>",
			"<dt>term A II</dt> <dt>term B II</dt>",
			"<dd>detail 1 II</dd> <dd>detail 2 II</dd></dl>",
		].join(" ");
		assert.equal(expected, actual);
	});
});

describe("parseDescriptionListsAndStuff", () => {
	const stuff = [
		document
			.createElement("p")
			.appendChild(document.createTextNode("something")),
	];
	const stuffCode = stuff.map(renderHTML).join(" ");
	const descriptionParagraphCode = `<p>term<br />:detail</p>`;
	const descriptionParagraphValue = { terms: ["term"], details: ["detail"] };
	it("parses HTML without descriptions as a singleton zebra", () => {
		assertParseWithNode(
			stuffCode,
			parseDescriptionListsAndStuff,
			(nodes) => ({ outcome: initialize(nodes), leftover: [] }),
		);
	});
	it("parses HTML with one simple description as a description list", () => {
		assertParseWithNode(
			descriptionParagraphCode,
			parseDescriptionListsAndStuff,
			(nodes) => ({
				outcome: construct(
					[],
					[
						{
							node: nodes[0],
							description: descriptionParagraphValue,
						},
					],
					initialize([]),
				),
				leftover: [],
			}),
		);
	});
	it("parses HTML with one simple description surrounded by other stuff as a description list surrounded by that stuff", () => {
		assertWithNode(
			stuffCode + descriptionParagraphCode + stuffCode,
			(nodes) => {
				const parsed = parseDescriptionListsAndStuff(nodes);
				if (parsed === null) assert.fail("no parse");
				else {
					assert.deepEqual(parsed.leftover, []);
					switch (parsed.outcome.tag) {
						case "tail":
							assert.fail(
								"Parse is tail but should be a zebra of length 3!",
							);
							break;
						case "body": {
							assert.strictEqual(
								parsed.outcome.whiteStripe.length,
								1,
							);
							assert.strictEqual(
								parsed.outcome.whiteStripe[0].isEqualNode(
									stuff[0],
								),
								true,
							);
							assert.deepEqual(
								parsed.outcome.blackStripe[0].description,
								descriptionParagraphValue,
							);
							assert.strictEqual(
								parsed.outcome.blackStripe[0].node,
								nodes[1],
							);
							switch (parsed.outcome.otherStripes.tag) {
								case "body":
									assert.fail(
										"Parse is tail but should be a zebra of length 3!",
									);
									break;
								case "tail": {
									assert.strictEqual(
										parsed.outcome.otherStripes.tail.length,
										1,
									);
									assert.strictEqual(
										parsed.outcome.otherStripes.tail[0].isEqualNode(
											stuff[0],
										),
										true,
									);
									break;
								}
							}
							break;
						}
					}
				}
			},
		);
	});
	it("parses HTML with two simple descriptions as a description list", () => {
		assertParseWithNode(
			descriptionParagraphCode + descriptionParagraphCode,
			parseDescriptionListsAndStuff,
			(nodes) => ({
				outcome: construct(
					[],
					[
						{
							node: nodes[0],
							description: descriptionParagraphValue,
						},
						{
							node: nodes[1],
							description: descriptionParagraphValue,
						},
					],
					initialize([]),
				),
				leftover: [],
			}),
		);
	});
});

describe("parseDescription", () => {
	it("parses a simple paragraph", () => {
		const descriptionCode = `term<br />:detail`;
		const descriptionValue = { terms: ["term"], details: ["detail"] };
		assertParseWithNode(descriptionCode, parseDescription, () => ({
			outcome: descriptionValue,
			leftover: [],
		}));
	});
	it("parses a simple paragraph with markup", () => {
		const descriptionCode = `<strong>term</strong><br />:<em>detail</em>`;
		const descriptionValue = {
			terms: ["<strong>term</strong>"],
			details: ["<em>detail</em>"],
		};
		assertParseWithNode(descriptionCode, parseDescription, () => ({
			outcome: descriptionValue,
			leftover: [],
		}));
	});
	it("parses a complicated paragraph", () => {
		const descriptionCode = `term A<br />term B<br />:detail 1<br />:detail 2`;
		const descriptionValue = {
			terms: ["term A", "term B"],
			details: ["detail 1", "detail 2"],
		};
		assertParseWithNode(descriptionCode, parseDescription, () => ({
			outcome: descriptionValue,
			leftover: [],
		}));
	});
	it("does not parse a paragraph without colon", () => {
		const description = `term<br />detail`;
		assertWithNode(description, (nodes) =>
			assert.strictEqual(parseDescription(nodes), null),
		);
	});
	it("does not parse a paragraph without term", () => {
		const description = `<br />:detail`;
		assertWithNode(description, (nodes) =>
			assert.strictEqual(parseDescription(nodes), null),
		);
	});
	it("does not parse a paragraph with extra lines", () => {
		const description = `term<br />:detail<br />extra line`;
		assertWithNode(description, (nodes) =>
			assert.strictEqual(parseDescription(nodes), null),
		);
	});
});

describe("parseTerm", () => {
	it("parses a simple term", () => {
		const term = "tiger";
		assertParseWithNode(term, parseTerm, () => ({
			outcome: term,
			leftover: [],
		}));
	});
	it("parses a term with markup", () => {
		const term = "<em>really</em> <strong>big</strong> tiger";
		assertParseWithNode(term, parseTerm, () => ({
			outcome: term,
			leftover: [],
		}));
	});
	it("does not add wihtespace", () => {
		const term = "no<em>whitespace</em>here";
		assertParseWithNode(term, parseTerm, () => ({
			outcome: term,
			leftover: [],
		}));
	});
	it("does not drop wihtespace", () => {
		const term = "there is <em>whitespace</em> here";
		assertParseWithNode(term, parseTerm, () => ({
			outcome: term,
			leftover: [],
		}));
	});
	it("requires absence of colon", () => {
		const term = "tiger";
		assertWithNode(`:${term}`, (nodes) => {
			assert.strictEqual(parseTerm(nodes), null);
		});
	});
	it("stops at line break", () =>
		assertParseWithNode("tiger<br />bison", parseTerm, (underlings) => ({
			outcome: "tiger",
			leftover: underlings.slice(1),
		})));
});

describe("parseDetail", () => {
	it("parses a simple detail", () => {
		const detail = "tiger";
		assertParseWithNode(`:${detail}`, parseDetail, () => ({
			outcome: detail,
			leftover: [],
		}));
	});
	it("parses a detail with markup", () => {
		const detail = "<em>really</em> <strong>big</strong> tiger";
		assertParseWithNode(`:${detail}`, parseDetail, () => ({
			outcome: detail,
			leftover: [],
		}));
	});
	it("does not add wihtespace", () => {
		const detail = "no<em>whitespace</em>here";
		assertParseWithNode(`:${detail}`, parseDetail, () => ({
			outcome: detail,
			leftover: [],
		}));
	});
	it("does not drop wihtespace", () => {
		const detail = "there is <em>whitespace</em> here";
		assertParseWithNode(`:${detail}`, parseDetail, () => ({
			outcome: detail,
			leftover: [],
		}));
	});
	it("requires some input", () => {
		assertWithNode("", (nodes) => {
			assert.strictEqual(parseDetail(nodes), null);
		});
	});
	it("requires a leading colon", () => {
		assertWithNode("tiger", (nodes) => {
			assert.strictEqual(parseDetail(nodes), null);
		});
	});
	it("stops at line break", () =>
		assertParseWithNode(":tiger<br />bison", parseDetail, (underlings) => ({
			outcome: "tiger",
			leftover: underlings.slice(1),
		})));
});
