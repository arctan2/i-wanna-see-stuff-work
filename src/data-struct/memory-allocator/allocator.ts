import { ShallowReactive, shallowReactive } from "vue";
import { numberToBytes, numberToHex } from "../utils";

export type DisplayableBlock = string | { ptr: string };

export interface AllocDisplay {
	toBytes: () => Array<string>;
	toString: () => string;
	toDisplayableBlocks: () => Array<DisplayableBlock>
}

export interface Dealloc {
	dealloc: () => void;
}

export class Null implements AllocDisplay {
	static Bytes = ["00", "00", "00", "00"];
	static Hex = "0x00000000";
	static Size = 8;

	static isNull(v: any) {
		return v.constructor.name === Null.name;
	}

    toBytes(): Array<string> {
		return Null.Bytes;
	}

    toString() {
		return Null.Hex;
	}

    toDisplayableBlocks() {
		return [` NULL: ${Null.Hex} `];
	}
}

export class Garbage implements AllocDisplay {
	maxLen: number;

	constructor(maxLen: number) {
		this.maxLen = maxLen;
	}

    toBytes(): Array<string> {
		return new Array(this.maxLen).fill("00");
	}

    toString() {
		let s = "<empty block>";
		const rem = this.maxLen - s.length;
		return s.slice(0, Math.min(this.maxLen, s.length)) + " ".repeat(Math.max(rem, 0));
	}

    toDisplayableBlocks() {
		let s = "<empty block>";
		const rem = this.maxLen - s.length;
		return [s.slice(0, Math.min(this.maxLen, s.length)) + " ".repeat(Math.max(rem, 0))];
	}
}

export class Ptr<T extends AllocDisplay | Dealloc> implements AllocDisplay {
	static Size = 8;

	size: number;
	start: number;
	next: Ptr<T> | null = null;
	freeBlock: FreeBlock | null = null;
	
	v: T;

	constructor(size: number, start: number, value: T) {
		this.size = size;
		this.start = start;
		this.v = value;
	}

    toBytes(): Array<string> {
		return numberToBytes(this.start);
	}

    toString() {
		return `0x${numberToHex(this.start)}`;
	}

    toDisplayableBlocks() {
		return [`0x${numberToHex(this.start)}`];
	}

	end() {
		return this.start + this.size;
	}
}

type PtrType = Ptr<AllocDisplay>;

export class FreePtrVal<T extends AllocDisplay> implements AllocDisplay {
	bytes: Array<string>;
	stringRepr: string;

	constructor(val: T) {
		this.bytes = val.toBytes();
		this.stringRepr = val.toString();
	}

	mergeEnd(ptrVal: FreePtrVal<AllocDisplay>) {
		this.bytes.push(...ptrVal.toBytes());
		this.stringRepr += ptrVal.toString();
	}

	mergeStart(ptrVal: FreePtrVal<AllocDisplay>) {
		this.bytes.unshift(...ptrVal.toBytes());
		this.stringRepr = ptrVal.toString() + this.stringRepr;
	}

    toBytes(): Array<string> {
		return this.bytes;
	}

    toString() {
		return this.stringRepr;
	}

    toDisplayableBlocks() {
		return [this.stringRepr];
	}
}

type FreePtrType = Ptr<FreePtrVal<AllocDisplay>>;

class AllocList {
	head: PtrType | null = null;
	tail: PtrType | null = null;

	*iter() {
		let temp: null | PtrType = this.head;
		if(temp && this.head === this.tail) {
			yield temp
			return;
		}

		while(temp !== null) {
			yield temp;
			temp = temp.next;
		}
	}

	getPrevOf(ptr: PtrType): PtrType | null {
		let prev: ShallowReactive<PtrType> | null = this.head;

		while(prev && (prev.next !== ptr)) {
			prev = prev.next;
		}

		return prev;
	}

	insertEnd(ptr: PtrType) {
		if(this.head === null || this.tail === null) {
			this.head = ptr;
			this.tail = this.head;
			return;
		}

		if(this.head === this.tail) {
			this.head.next = ptr;
			ptr.start = this.tail.start + this.tail.size;
			this.tail = ptr;
			return;
		}

		ptr.start = this.tail.start + this.tail.size;
		this.tail.next = ptr;
		this.tail = ptr;
	}

	deleteNextOf(ptr: PtrType) {
		if(ptr.next) {
			ptr.next = ptr.next.next;
			if(ptr.next === null) {
				this.tail = ptr;
			}
		}
	}

	insertAfter(prevPtr: PtrType | null, toInsertPtr: PtrType) {
		if(prevPtr === null) {
			toInsertPtr.start = 0;
			if(this.head) {
				toInsertPtr.next = this.head.next;
			}
			this.head = toInsertPtr;
			this.tail = toInsertPtr;
		} else {
			toInsertPtr.start = prevPtr.end();
			toInsertPtr.next = prevPtr.next;
			prevPtr.next = toInsertPtr;
			if(toInsertPtr.next === null) {
				this.tail = toInsertPtr;
			}
		}
	}

	insertBefore(ptr: PtrType, toInsertPtr: PtrType) {
		const prevPtr = this.getPrevOf(ptr);
		this.insertAfter(prevPtr, toInsertPtr);
	}

	isEmpty(): boolean {
		return this.head === null;
	}
}

class FreeBlock {
	ptr: Ptr<FreePtrVal<AllocDisplay>>;
	next: FreeBlock | null = null;

	constructor(ptr: Ptr<FreePtrVal<AllocDisplay>>) {
		this.ptr = ptr;
	}
}

enum ToInsertPos {
	End,
	Head
}

class FreeList {
	head: FreeBlock | null = null;

	prevOfSize(size: number): FreeBlock | ToInsertPos {
		if(this.head === null) {
			return ToInsertPos.End;
		}

		if(this.head.ptr.size >= size) {
			return ToInsertPos.Head;
		}

		let temp = this.head;

		while(temp && temp.next) {
			if(temp.next.ptr.size >= size) {
				return temp;
			}
			temp = temp.next;
		}

		return ToInsertPos.End;
	}

	prevOfPtr(ptr: PtrType): FreeBlock | null {
		let temp = this.head;

		while(temp && temp.next) {
			if(temp.next.ptr === ptr) {
				return temp;
			}
			temp = temp.next;
		}

		return null;
	}

	cutPtrContent(ptr: PtrType, prevSize: number) {
		const percent = 1 - (ptr.size / prevSize);
		let str = ptr.v.toString();
		let bytes = ptr.v.toBytes();
		(ptr.v as FreePtrVal<AllocDisplay>).stringRepr = str.slice(Math.floor(percent * str.length));
		(ptr.v as FreePtrVal<AllocDisplay>).bytes = bytes.slice(prevSize - ptr.size);
	}

	deleteNextOf(prevBlock: FreeBlock) {
		if(prevBlock.next) {
			prevBlock.next = prevBlock.next.next;
		} else {
			this.head = null;
		}
	}

	deleteByPtr(ptr: PtrType) {
		if(this.head === null) {
			return;
		}

		if(this.head.ptr === ptr) {
			this.head = this.head.next;
			return;
		}

		const prevBlock = this.prevOfPtr(ptr);

		if(prevBlock && prevBlock.next) {
			prevBlock.next = prevBlock.next.next;
		}
	}

	insertStart(block: FreeBlock) {
		if(this.head === null) {
			this.head = block;
		} else {
			block.next = this.head.next;
			this.head.next = block;
		}
	}
}

class Allocator {
	allocated: ShallowReactive<AllocList>;
	freed: FreeList;

	constructor() {
		this.allocated = shallowReactive(new AllocList);
		this.freed = new FreeList;
		this.malloc<Null>(Null.Size, new Null);
	}

	// prevBlock null meaning i want to insert at the head
	private insertAfterBlock(prevBlock: FreeBlock | null, newPtr: PtrType) {
		const freePtr = (prevBlock === null) ? this.freed.head?.ptr as PtrType : (prevBlock.next?.ptr || prevBlock.ptr);
		const freePtrOldSize = freePtr.size;
		freePtr.size = freePtrOldSize - newPtr.size;

		this.allocated.insertBefore(freePtr, newPtr);

		if(freePtr.size === 0) {
			if(prevBlock === null) {
				this.freed.head = null;
			} else {
				this.freed.deleteNextOf(prevBlock);
			}
			this.allocated.deleteNextOf(newPtr);
		} else {
			this.freed.cutPtrContent(freePtr, freePtrOldSize);
			freePtr.start = newPtr.end();
		}
	}

	private freeInternal(ptr: FreePtrType, prevPtr: PtrType | null) {
		let freeBlock = new FreeBlock(ptr);
		if(prevPtr === null && ptr.next === null) {
			this.freed.insertStart(freeBlock);
			return;
		}

		// if freeing head
		if(prevPtr === null) {
			if(ptr.next === null || ptr.next.freeBlock === null) {
				ptr.freeBlock = freeBlock;
				this.freed.insertStart(freeBlock);
			} else if(ptr.next.freeBlock !== null) {
				ptr.next.v.mergeStart(ptr.v);
				ptr.next.start = ptr.start;
				ptr.next.size += ptr.size;
				this.allocated.head = null;
			}
			return;
		}

		if(prevPtr.freeBlock !== null) {
			prevPtr.freeBlock.ptr.v.mergeEnd(ptr.v);
			prevPtr.size += ptr.size;
			prevPtr.next = ptr.next;

			if(prevPtr.next === null) {
				this.allocated.tail = prevPtr;
				return;
			}

			if(prevPtr.next.freeBlock !== null) {
				ptr = prevPtr.next.freeBlock.ptr;

				this.freed.deleteByPtr(ptr);

				prevPtr.freeBlock.ptr.v.mergeEnd(ptr.v);
				prevPtr.size += ptr.size;
				prevPtr.next = ptr.next;

				if(prevPtr.next === null) {
					this.allocated.tail = prevPtr;
				}
			}
			return;
		}

		if(ptr.next === null || ptr.next.freeBlock === null) {
			ptr.freeBlock = freeBlock;
			this.freed.insertStart(freeBlock);
		} else if(ptr.next.freeBlock !== null) {
			ptr.next.v.mergeStart(ptr.v);
			ptr.next.start = ptr.start;
			ptr.next.size += ptr.size;
			prevPtr.next = ptr.next;
		}
	}

	public malloc<T extends AllocDisplay>(size: number, value: T): ShallowReactive<Ptr<T>> {
		const ptr = shallowReactive(new Ptr(size, 0, value));
		const freeBlockPrev = this.freed.prevOfSize(ptr.size);

		if(freeBlockPrev === ToInsertPos.End) {
			this.allocated.insertEnd(ptr);
			return ptr;
		}

		if(freeBlockPrev === ToInsertPos.Head) {
			this.insertAfterBlock(null, ptr);
		} else {
			this.insertAfterBlock(freeBlockPrev, ptr);
		}

		return ptr;
	}

	private reallocGrow(ptr: PtrType, newSize: number, newVal: AllocDisplay): PtrType {
		const neededSize = newSize - ptr.size;

		if(ptr.next === null) {
			ptr.size = newSize;
			return ptr;
		}

		if(ptr.next.freeBlock !== null && neededSize <= ptr.next.size) {
			const next = ptr.next;
			const prevNextSize = next.size;

			next.start += neededSize;
			next.size -= neededSize;

			ptr.size = newSize;
			ptr.v = newVal;

			if(next.size === 0) {
				this.freed.deleteByPtr(next);
				this.allocated.deleteNextOf(ptr);
			} else {
				this.freed.cutPtrContent(ptr.next, prevNextSize);
			}
		} else {
			const ptrValue = ptr.v;
			this.freeWithoutDealloc(ptr);
			return this.malloc(newSize, ptrValue);
		}

		return ptr;
	}

	// technically not used anywhere yet
	private reallocShrink(ptr: PtrType, newSize: number, newVal: AllocDisplay): PtrType {
		if(newSize <= 0) {
			return ptr;
		}

		const sizeDiff = ptr.size - newSize;
		const freePtrStart = ptr.end() - sizeDiff;

		ptr.size = newSize;
		ptr.v = newVal;

		if(ptr.next?.freeBlock) {
			const freePtrVal: AllocDisplay = new FreePtrVal(new Garbage(ptr.next.size + sizeDiff));
			ptr.next.size += sizeDiff;
			ptr.next.start = freePtrStart;
			ptr.next.v = freePtrVal;
		} else {
			const freePtrVal: AllocDisplay = new FreePtrVal(new Garbage(sizeDiff));
			let freePtr = new Ptr(sizeDiff, freePtrStart, freePtrVal);

			freePtr.next = ptr.next;
			ptr.next = freePtr;

			this.freeInternal(freePtr as Ptr<FreePtrVal<AllocDisplay>>, ptr);
		}

		return ptr;
	}

	public realloc<T extends AllocDisplay>(ptr: Ptr<T>, newSize: number, newVal: T): Ptr<T> {
		if(newSize > ptr.size) {
			return this.reallocGrow(ptr, newSize, newVal) as Ptr<T>;
		} else if(newSize < ptr.size) {
			return this.reallocShrink(ptr, newSize, newVal) as Ptr<T>;
		}
		return ptr;
	}

	public freeWithoutDealloc<T extends AllocDisplay | Dealloc>(ptr: Ptr<T>) {
		if(ptr.freeBlock) {
			throw Error("the pointer is already freed");
		}

		const freePtrVal = new FreePtrVal(ptr.v as AllocDisplay);
		const prevPtr = this.allocated.getPrevOf(ptr as PtrType);

		ptr.v = freePtrVal as any;

		this.freeInternal(ptr as Ptr<any>, prevPtr);
	}

	public free<T extends AllocDisplay | Dealloc>(ptr: Ptr<T>) {
		const ptrValue = ptr.v;
		this.freeWithoutDealloc(ptr);
		if((ptrValue as Dealloc).dealloc !== undefined) {
			(ptrValue as Dealloc).dealloc();
		}
	}

	public resetExceptNull() {
		this.allocated = shallowReactive(new AllocList);
		this.freed = new FreeList;
		this.malloc<Null>(Null.Size, new Null);
	}
}

const allocator = new Allocator;

export default allocator;
