import { AllocDisplay, Null, Ptr } from "./memory-allocator/allocator";

export function sleep(ms: number) {
	return new Promise((r) => {
		setTimeout(r, ms);
	});
}

export function randInt(min: number, max: number): number {
	if(max < min) {
		[max, min] = [min, max];
	}
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

export function getContrastFg(hex: string){
	const { r, g, b } = hexToRGB(hex)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? "#000000" : "#ffffff";
}

export function lerp(a: number, b: number, t: number) {
	return a + ((b - a) * t);
}

export function arrayToBytesArray(arr: Array<number | AllocDisplay | null>) {
	let blocks: string[] = [];
	let nil = Null.Bytes;

	for(const a of arr) {
		if(a === null) blocks.push(...nil);
		else if(typeof a === "number") blocks.push(...numberToBytes(a));
		else blocks.push(...a.toBytes());
	}

	return blocks;
}

export function arrayToDisplayBlocks(arr: Array<number | AllocDisplay | null>) {
	let blocks = [];
	let nullBlock = { ptr: Null.Hex };

	for(const a of arr) {
		if(typeof a === "number") blocks.push(String(a), ",");
		else blocks.push((a === null) ? nullBlock : { ptr: a.toString() }, ",");
	}

	return blocks.slice(0, -1);
}

export function arrayToDisplayStr(arr: Array<number | AllocDisplay | null>) {
	let s = "";
	let nil = Null.Hex;

	for(const a of arr) {
		if(typeof a === "number") s += String(a) + ",";
		else s += (((a === null) ? nil : a.toString()) + ",");
	}

	return s.slice(0, -1);
}
