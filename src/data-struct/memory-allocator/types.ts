import { ShallowReactive, ShallowRef, shallowReactive, shallowRef } from "vue";
import { numberToBytes } from "../utils";
import allocator, { AllocDisplay, Dealloc, DisplayableBlock, Ptr } from "./allocator";

export const PrimitiveSize = {
	Int: 4
}

export class Chars implements AllocDisplay {
	charsRef: ShallowRef<string>;
	cap: number;

	static new(value: string): Ptr<Chars> {
		const obj = new Chars(value);
		const mem = allocator.malloc<Chars>(obj.cap, obj);
		return mem;
	}

	constructor(value: string) {
		this.charsRef = shallowRef(value);
		this.cap = Math.max(1, value.length);
	}

	get chars(): string {
		return this.charsRef.value;
	}

    toBytes(): Array<string> {
		const bytes = this.chars.split("").map(v => v.charCodeAt(0).toString(16));
		for(let i = 0, rem = this.cap - bytes.length; i < rem; i++) {
			bytes.push("00");
		}

		return bytes;
	}

    toString() {
		const s = this.chars.split("").map(v => `'${v}'`);
		for(let i = 0, rem = this.cap - s.length; i < rem; i++) {
			s.push("'\\0'");
		}
		return ` chars [${s.join(",")}] `;
	}

    toDisplayableBlocks() {
		const s = this.chars.split("").map(v => `'${v}'`);
		for(let i = 0, rem = this.cap - s.length; i < rem; i++) {
			s.push("'\\0'");
		}

		return [` chars [${s.join(",")}] `];
	}
}

export class Str implements AllocDisplay, Dealloc {
	static Size = PrimitiveSize.Int + PrimitiveSize.Int + Ptr.Size;

	static new(value: string): Ptr<Str> {
		const newStr = new Str(value);
		const mem = allocator.malloc<Str>(Str.Size, newStr);
		return mem;
	}

	charPtr: Ptr<Chars>;

	constructor(value: string) {
		this.charPtr = Chars.new(value);
	}

	setStr(value: string) {
		let charPtrVal = this.charPtr.v;
		if(value.length > charPtrVal.cap) {
			this.charPtr = allocator.realloc(this.charPtr, value.length, charPtrVal);
			this.charPtr.v.cap = value.length;
		}
		charPtrVal.charsRef.value = value;
	}

	get chars(): string {
		return this.charPtr.v.chars
	}

	dealloc() {
		allocator.free(this.charPtr);
	}

    toBytes(): Array<string> {
		return [
			...numberToBytes(this.charPtr.v.cap),
			...numberToBytes(this.charPtr.v.chars.length),
			...this.charPtr.toBytes()
		]
	}

    toString() {
		return ` str { cap: ${this.charPtr.size}, len: ${this.charPtr.v.chars.length}, ptr: ${this.charPtr} } `;
	}

	toDisplayableBlocks() {
 		return [
			` str { cap: ${this.charPtr.size}, len: ${this.charPtr.v.chars.length}, ptr: `, { ptr: this.charPtr.toString() }, ` } `
		];
	}
}

export class Arr<T extends AllocDisplay | number> implements AllocDisplay {
	arr: ShallowReactive<Array<T>>;
	cap: number;

	static new<T extends AllocDisplay | number>(arr: Array<T>, dsize: number): Ptr<Arr<T>> {
		const obj = new Arr<T>(arr);
		return allocator.malloc(obj.cap * dsize, obj);
	}

	constructor(arr: Array<T>) {
		this.arr = shallowReactive(arr);
		this.cap = Math.max(1, arr.length);
	}

    toBytes(): Array<string> {
		if(this.arr.length === 0) {
			return [];
		}

		const type = typeof this.arr[0];
		const arr: Array<string> = [];

		if(type === "number") {
			for(let a of this.arr) {
				arr.push(...numberToBytes(a as number));
			}
		} else {
			for(let a of this.arr) {
				arr.push(...(a as AllocDisplay).toBytes());
			}
		}

		for(let i = 0, rem = this.cap - this.arr.length; i < rem; i++) {
			arr.push("00");
		}

		return arr;
	}

    toString(): string {
		let arr = [];
		for(let a of this.arr) {
			arr.push(a.toString());
		}

		const type = typeof this.arr[0];
		if(type === "number") {
			for(let i = 0, rem = this.cap - this.arr.length; i < rem; i++) {
				arr.push('0');
			}
		} else {
			for(let i = 0, rem = this.cap - this.arr.length; i < rem; i++) {
				arr.push('0x00000000');
			}
		}

		return ` arr: [${arr.join(",")}] `;
	}

    toDisplayableBlocks() {
		const type = typeof this.arr[0];
		let b = [];
		for(let a of this.arr) {
			b.push(type === "number" ? a.toString() : { ptr: a.toString() } , ',');
		}

		if(type === "number") {
			for(let i = 0, rem = this.cap - this.arr.length; i < rem; i++) {
				b.push('0', ',');
			}
		} else {
			for(let i = 0, rem = this.cap - this.arr.length; i < rem; i++) {
				b.push('0x00000000', ',');
			}
		}

		b.pop();

		return [` arr: [`, ...b, `] `];
	}
}

export class List<T extends AllocDisplay | number> implements AllocDisplay, Dealloc {
	static Size = PrimitiveSize.Int + PrimitiveSize.Int + Ptr.Size;

	arrPtr: Ptr<Arr<T>>;
	dsize: number;

	static new<T extends AllocDisplay | number>(arr: Array<T>, dsize: number): Ptr<List<T>> {
		const obj = new List<T>(arr, dsize);
		const mem = allocator.malloc(List.Size, obj);
		return mem;
	}

	constructor(arr: Array<T>, dsize: number) {
		this.arrPtr = Arr.new(arr, dsize);
		this.dsize = dsize;
	}

	dealloc() {
		allocator.free(this.arrPtr);
	}

	list(): Array<T> {
		return this.arrPtr.v.arr;
	}

	setLength(length: number) {
		this.checkCapacity(length);
		this.arrPtr.v.arr.length = length;
	}

	push(...values: Array<T>) {
		this.checkCapacity(this.length + values.length);
		this.arrPtr.v.arr.push(...values);
	}

	at(idx: number): T | undefined {
		return this.arrPtr.v.arr[idx];
	}

	setAt(idx: number, val: T) {
		if(idx >= this.length) {
			this.checkCapacity(idx + 1);
		}
		this.arrPtr.v.arr[idx] = val;
	}

	checkCapacity(newLength: number) {
		const arrPtrVal = this.arrPtr.v;
		if(newLength > arrPtrVal.cap) {
			this.arrPtr = allocator.realloc(this.arrPtr, newLength * this.dsize, arrPtrVal);
			this.arrPtr.v.cap = newLength;
		}
	}

	set(newArr: Array<T>) {
		this.checkCapacity(newArr.length);
		this.arrPtr.v.arr = newArr;
	}

	get length(): number {
		return this.arrPtr.v.arr.length;
	}

    toBytes(): Array<string> {
		return [
			...numberToBytes(this.arrPtr.v.cap),
			...numberToBytes(this.arrPtr.v.arr.length),
			...this.arrPtr.toBytes()
		];
	}

    toString(): string {
		return ` List { cap: ${this.arrPtr.v.cap}, length: ${this.arrPtr.v.arr.length}, ptr: ${this.arrPtr} } `;
	}

    toDisplayableBlocks() {
		return [` List { cap: ${this.arrPtr.v.cap}, length: ${this.arrPtr.v.arr.length}, ptr: `, { ptr: this.arrPtr.toString() }, ` } `];
	}
}

export class MapListMap<T extends AllocDisplay> implements AllocDisplay {
	map: ShallowReactive<Map<T, null>>;
	cap: number;

	static new<T extends AllocDisplay>(map: Map<T, null>, dsize: number): Ptr<MapListMap<T>> {
		const obj = new MapListMap<T>(map);
		return allocator.malloc(obj.cap * dsize, obj);
	}

	constructor(map: Map<T, null>) {
		this.map = shallowReactive(map);
		this.cap = Math.max(1, map.size);
	}

    toBytes(): Array<string> {
		if(this.map.size === 0) {
			return [];
		}

		const temp = [...this.map.keys()];

		const arr: Array<string> = [];

		for(let a of temp) {
			arr.push(...(a as AllocDisplay).toBytes());
		}

		for(let i = 0, rem = this.cap - this.map.size; i < rem; i++) {
			arr.push("00", "00", "00", "00");
		}

		return arr;
	}

    toString(): string {
		const arr = [...this.map.keys()].map(a => a.toString());
		for(let i = 0, rem = this.cap - this.map.size; i < rem; i++) {
			arr.push("0x00000000");
		}

		return ` arr: [${arr.join(",")}] `;
	}

    toDisplayableBlocks(): Array<DisplayableBlock> {
		let b = [];
		for(let a of this.map.keys()) {
			b.push({ ptr: a.toString() } , ', ');
		}

		for(let i = 0, rem = this.cap - this.map.size; i < rem; i++) {
			b.push({ ptr: "0x00000000" } , ', ');
		}

		b.pop();

		return [` arr: [`, ...b, `] `];
	}
}

export class MapList<T extends AllocDisplay> implements AllocDisplay, Dealloc {
	static Size = PrimitiveSize.Int + PrimitiveSize.Int + Ptr.Size;

	mapPtr: Ptr<MapListMap<T>>;
	dsize: number;

	static new<T extends AllocDisplay>(map: Map<T, null>, dsize: number): Ptr<MapList<T>> {
		const obj = new MapList<T>(map, dsize);
		const mem = allocator.malloc(MapList.Size, obj);
		return mem;
	}

	constructor(map: Map<T, null>, dsize: number) {
		this.mapPtr = MapListMap.new(map, dsize);
		this.dsize = dsize;
	}

	list(): Array<T> {
		return [...this.mapPtr.v.map.keys()];
	}

	first(): T | undefined {
		return this.mapPtr.v.map.keys().next().value;
	}

    toBytes(): Array<string> {
		return [
			...numberToBytes(this.mapPtr.v.cap),
			...numberToBytes(this.mapPtr.v.map.size),
			...this.mapPtr.toBytes()
		];
	}

	set(e: T) {
		const mapPtrV = this.mapPtr.v;
		if(!mapPtrV.map.has(e)) {
			if(mapPtrV.map.size + 1 > mapPtrV.cap) {
				this.mapPtr = allocator.realloc(this.mapPtr, (mapPtrV.map.size + 1) * this.dsize, mapPtrV);
				mapPtrV.cap = mapPtrV.map.size + 1;
			}
		}
		mapPtrV.map.set(e, null);
	}

	delete(e: T) {
		this.mapPtr.v.map.delete(e);
	}

	dealloc() {
		allocator.free(this.mapPtr);
	}

    toString(): string {
		return ` List { cap: ${this.mapPtr.v.cap}, length: ${this.mapPtr.v.map.size}, ptr: ${this.mapPtr} } `;
	}

    toDisplayableBlocks() {
		return [
			` List { cap: ${this.mapPtr.v.cap}, length: ${this.mapPtr.v.map.size}, ptr: `, { ptr: this.mapPtr.toString() }, ` } `
		];
	}
}
