export function sleep(ms: number) {
	return new Promise((r) => {
		setTimeout(r, ms);
	});
}

export function randInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min) + min);
}

export function hexToRGB(s: string) {
	const r = parseInt(s.slice(1, 3), 16);
	const g = parseInt(s.slice(3, 5), 16);
	const b = parseInt(s.slice(5, 7), 16);
	return { r, g, b };
}

export function numberToHex(n: number) {
	let hex = n.toString(16);
	return "0".repeat(8 - hex.length) + hex;
}

export function numberToBytes(n: number): Array<string> {
	let hex = numberToHex(n);
	let arr: Array<string> = [];

	for(let i = 0; i < hex.length; i += 2) {
		arr.push(hex.slice(i, i + 2));
	}

	return arr;
}

export function lerp(a: number, b: number, t: number) {
	return a + ((b - a) * t);
}
