import { GAP } from "../canvas";
import { EventState } from "../handler/event-handler";
import { CanvasHandler } from "../handler/canvas-handler";
import { isAutoRearrangeBtree } from "../global";
import { HeapBuffer } from "./element-types/buffer";
import { ElementHandler } from "../handler/element-handler";
import allocator, { AllocDisplay, Dealloc, Ptr } from "../memory-allocator/allocator";
import { ShallowReactive } from "vue";

export class ElementHeapBuffer extends HeapBuffer implements ElementHandler, AllocDisplay, Dealloc {
	ptr: ShallowReactive<Ptr<ElementHeapBuffer>>;

	pointerEnter(_state: EventState, _canvas: CanvasHandler) {};
	pointerLeave(_state: EventState, _canvas: CanvasHandler) {};

	static Size = Ptr.Size;

	constructor(x: number, y: number) {
		super();
		this.x = x;
		this.y = y;
		this.ptr = allocator.malloc(ElementHeapBuffer.Size, this);
	}

    toBytes(): Array<string> {
		return [
			...this.buf.toBytes()
		];
	}

    toString(): string {
		return ` heap { buffer: ${this.buf.toString()} } `
	}

    toDisplayableBlocks() {
		return [
			` heap { buffer: `, { ptr: this.buf.toString() }, ` } `
		];
	}

	dealloc() {
		allocator.free(this.buf);
	}

	pointerDy: number = -1;
	pointerDx: number = -1;

	dfsClean(node: ElementHeapBuffer | null) {
		if(!node) {
			return;
		}

		node.resetStyle();
	}

	resetAllNodesStyle(canvas: CanvasHandler) {
		let root: ElementHeapBuffer | null = this;

		if(root !== null) {
			this.dfsClean(root);
		}
		canvas.redraw();
	}

	moveTo(x: number, y: number) {
		this.setXY(x, y);
	}

	pointerMove(state: EventState, canvas: CanvasHandler): void {
		if(state.pointerDown.x === -1) return;
		let { x, y } = state.pointerMove;
		// let { x: prevx, y: prevy } = this;

		x = Math.floor(x / GAP) * GAP - this.pointerDx;
		y = Math.floor(y / GAP) * GAP - this.pointerDy;

		this.moveTo(x, y);

		canvas.redraw();
	}

	remove(canvas: CanvasHandler) {
		allocator.free(this.ptr);
		canvas.removeElements(this);
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

	pointerUp(state: EventState, _canvas: CanvasHandler): ElementHandler | null { 
		if(isAutoRearrangeBtree.value === false) {
			return null;
		}
		if(Math.abs(state.pointerDown.x - state.pointerUp.x) <= GAP && Math.abs(state.pointerDown.y - state.pointerUp.y) <= GAP) {
			return null;
		}
		return null;
	};

	focus() {
		this.borderColor = "#ffff00";
	}

	unfocus() {
		this.borderColor = "";
	}

	isIntersect(x: number, y: number, canvas: CanvasHandler): null | ElementHandler {
		if(this.intersects(x, y, canvas.transform)) return this;
		return null;
	}

	*animateCellBg(canvas: CanvasHandler, idx: number, bg: string) {
		this.nodesStyles[idx].bg = bg;
		this.drawCellAtIdx(canvas.ctx, idx);
		yield;
		this.nodesStyles[idx].bg = HeapBuffer.bg;
		this.drawCellAtIdx(canvas.ctx, idx);
	}

	draw(ctx: CanvasRenderingContext2D) {
		this.paint(ctx);
	}
}

