import { GAP } from "../canvas";
import { EventState } from "../handler/event-handler";
import { CanvasHandler } from "../handler/canvas-handler";
import { ArrayBuf } from "./element-types/array";
import { ElementHandler } from "../handler/element-handler";
import allocator, { AllocDisplay, Dealloc, Ptr } from "../memory-allocator/allocator";
import { ShallowReactive, ref } from "vue";
import { PrimitiveSize } from "../memory-allocator/types";
import { numberToBytes, randInt } from "../utils";

export class ElementArrayBuf extends ArrayBuf implements ElementHandler, AllocDisplay, Dealloc {
	ptr: ShallowReactive<Ptr<ElementArrayBuf>>;

	pointerEnter(_state: EventState, _canvas: CanvasHandler) {};
	pointerLeave(_state: EventState, _canvas: CanvasHandler) {};

	static Size = PrimitiveSize.Int + PrimitiveSize.Bool + Ptr.Size + Ptr.Size;

	selectedCellIdx = ref<number>(-1);

	constructor(x: number, y: number, size: number) {
		super(size);
		this.x = x;
		this.y = y;
		this.ptr = allocator.malloc(ElementArrayBuf.Size, this);
	}

    toBytes(): Array<string> {
		return [
			...numberToBytes(this.arr.v.cap),
			...numberToBytes(this.arr.v.arr.length),
			...this.arr.toBytes()
		];
	}

    toString(): string {
		return ` Array { cap: ${this.arr.v.cap}, length: ${this.arr.v.arr.length}, ptr: ${this.arr} } `;
	}

    toDisplayableBlocks() {
		return [` Array { cap: ${this.arr.v.cap}, length: ${this.arr.v.arr.length}, ptr: `, { ptr: this.arr.toString() }, ` } `];
	}

	dealloc() {
		allocator.free(this.arr);
	}

	pointerDy: number = -1;
	pointerDx: number = -1;

	resetAllNodesStyle(canvas: CanvasHandler) {
		this.resetStyle();
		canvas.redraw();
	}

	moveTo(x: number, y: number) {
		this.setXY(x, y);
	}

	pointerMove(state: EventState, canvas: CanvasHandler): void {
		if(state.pointerDown.x === -1) return;
		let { x, y } = state.pointerMove;

		x = Math.floor(x / GAP) * GAP - this.pointerDx;
		y = Math.floor(y / GAP) * GAP - this.pointerDy;

		this.moveTo(x, y);

		canvas.redraw();
	}

	remove(canvas: CanvasHandler) {
		allocator.free(this.ptr);
		canvas.removeElements(this);
	}

	shuffle(canvas: CanvasHandler) {
		let elements = [...this.arr.v.arr];
		for(let i = 0; i < elements.length; i++) {
			let i = randInt(0, elements.length);
			let j = randInt(0, elements.length);
			[elements[i], elements[j]] = [elements[j], elements[i]];
		}

		for(let i = 0; i < elements.length; i++) {
			this.arr.v.arr[i] = elements[i];
		}

		this.calcSpikeWidth();
		this.draw(canvas.ctx);
	}

	randomFill(canvas: CanvasHandler) {
		let len = this.arr.v.cap;
		let newElements = Array(len);
		for(let i = 0; i < len; i++) {
			newElements[i] = randInt(10, ArrayBuf.spikesContainerHeight);
		}
		for(let i = 0; i < newElements.length; i++) {
			this.arr.v.arr[i] = newElements[i];
		}
		this.calcSpikeWidth();
		this.draw(canvas.ctx);
	}

	randomize(canvas: CanvasHandler) {
		let len = this.arr.v.arr.length;
		let newElements = Array(len);
		for(let i = 0; i < len; i++) {
			newElements[i] = randInt(10, ArrayBuf.spikesContainerHeight);
		}

		for(let i = 0; i < newElements.length; i++) {
			this.arr.v.arr[i] = newElements[i];
		}
		this.calcSpikeWidth();
		this.draw(canvas.ctx);
	}

	async scrollTo(canvas: CanvasHandler) {
		const x = this.x + canvas.transform.x;
		const y = this.y + canvas.transform.y;
		if(!(x > 0 && x < canvas.width && y > 0 && y < canvas.height)) {
			await canvas.scrollTo(canvas.halfDomWidth - this.x, canvas.halfDomHeight - this.y, 30);
		}
	}

	pointerDown(state: EventState): void {
		let { x: nodex, y: nodey } = this;
		let { x: statex, y: statey } = state.pointerDown;
		this.pointerDx = Math.floor((statex - nodex) / GAP) * GAP;
		this.pointerDy = Math.floor((statey - nodey) / GAP) * GAP;
	}

	pointerUp(state: EventState, canvas: CanvasHandler): ElementHandler | null { 
		if((state.pointerUp.x === state.pointerDown.x) && (state.pointerUp.y === state.pointerDown.y)) {
			const prev = this.selectedCellIdx.value;
			if(this.selectedCellIdx.value !== -1) {
				this.cellBg[this.selectedCellIdx.value] = ArrayBuf.bg;
				this.drawCellAtIdx(canvas.ctx, this.selectedCellIdx.value);
				this.selectedCellIdx.value = -1;
			}

			let { x, y } = state.pointerUp;
			const relMouseX = x - this.left - canvas.transform.x;
			const relMouseY = y - this.top - canvas.transform.y;

			let idxX = Math.floor(relMouseX / ArrayBuf.cellWidth);
			let idxY = Math.floor(relMouseY / ArrayBuf.cellHeight);

			let idx = (idxY * this.rowLen.value) + idxX;

			if(idx < this.arr.v.arr.length && prev !== idx) {
				this.selectedCellIdx.value = idx;
				this.cellBg[idx] = "#f5d06c";
				this.drawCellAtIdx(canvas.ctx, idx);
			}
		}

		canvas.redraw();

		if(Math.abs(state.pointerDown.x - state.pointerUp.x) <= GAP && Math.abs(state.pointerDown.y - state.pointerUp.y) <= GAP) {
			return null;
		}
		return null;
	};

	focus() {
		this.borderColor = "#ffff00";
	}

	unfocus() {
		this.cellBg[this.selectedCellIdx.value] = ArrayBuf.bg;
		this.selectedCellIdx.value = -1;
		this.borderColor = "";
	}

	isIntersect(x: number, y: number, canvas: CanvasHandler): null | ElementHandler {
		if(this.intersects(x, y, canvas.transform)) return this;
		return null;
	}

	draw(ctx: CanvasRenderingContext2D) {
		this.paint(ctx);
	}
}

