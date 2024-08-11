export type zebras<white, black> =
	| {
			tag: "body";
			whiteStripe: white;
			blackStripe: black;
			otherStripes: zebras<white, black>;
	  }
	| { tag: "tail"; tail: white };

export function reverse<white, black>(
	input: zebras<white, black>,
): zebras<white, black> {
	let cachedBlackStripe: black;
	let output: zebras<white, black>;
	let leftover: zebras<white, black>;
	switch (input.tag) {
		case "tail":
			return input;
		case "body":
			output = { tag: "tail", tail: input.whiteStripe };
			cachedBlackStripe = input.blackStripe;
			leftover = input.otherStripes;
	}
	while (true) {
		switch (leftover.tag) {
			case "tail":
				return construct(leftover.tail, cachedBlackStripe, output);
			case "body": {
				output = {
					tag: "body",
					whiteStripe: leftover.whiteStripe,
					blackStripe: cachedBlackStripe,
					otherStripes: output,
				};
				cachedBlackStripe = leftover.blackStripe;
				leftover = leftover.otherStripes;
				continue;
			}
		}
	}
}

export function getWhiteStripes<white, black>(
	input: zebras<white, black>,
): white[] {
	let leftover: zebras<white, black> = input;
	const output: white[] = [];
	while (true) {
		switch (leftover.tag) {
			case "tail": {
				output.push(leftover.tail);
				return output;
			}
			case "body": {
				output.push(leftover.whiteStripe);
				leftover = leftover.otherStripes;
				continue;
			}
		}
	}
}
export function getBlackStripes<white, black>(
	input: zebras<white, black>,
): black[] {
	let leftover: zebras<white, black> = input;
	const output: black[] = [];
	while (true) {
		switch (leftover.tag) {
			case "tail": {
				return output;
			}
			case "body": {
				output.push(leftover.blackStripe);
				leftover = leftover.otherStripes;
				continue;
			}
		}
	}
}
export function initialize<white, black>(
	whiteStripe: white,
): zebras<white, black> {
	return { tag: "tail", tail: whiteStripe };
}
export function construct<white, black>(
	whiteStripe: white,
	blackStripe: black,
	otherStripes: zebras<white, black>,
): zebras<white, black> {
	return { tag: "body", whiteStripe, blackStripe, otherStripes };
}
