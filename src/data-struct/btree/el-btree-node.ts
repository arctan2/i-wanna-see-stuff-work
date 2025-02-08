import { GAP } from "../canvas";
import { EventState } from "../handler/event-handler";
import { CanvasHandler } from "../handler/canvas-handler";
import { focusedElement } from "../global";
import { BtreeNode } from "./element-types/node";
import { ElementHandler } from "../handler/element-handler";
import allocator, { AllocDisplay, Dealloc, Null, Ptr } from "../memory-allocator/allocator";
import { ShallowReactive } from "vue";
import { Arr } from "../memory-allocator/types";
import { numberToBytes } from "../utils";

export class ElementBtreeNode extends BtreeNode implements ElementHandler, AllocDisplay, Dealloc {
	ptr: ShallowReactive<Ptr<ElementBtreeNode>>;

	pointerEnter(_state: EventState, _canvas: CanvasHandler) {};
	pointerUp(_state: EventState, _canvas: CanvasHandler): ElementHandler | null { return null };
	pointerLeave(_state: EventState, _canvas: CanvasHandler) {};

	parentNode: ElementBtreeNode | null = null;
	children: Ptr<Arr<Null | ElementBtreeNode>>;

	static Size = Ptr.Size + Ptr.Size;

	constructor(x: number, y: number, M: number, isLeaf: boolean) {
		super(M, isLeaf);
		this.x = x;
		this.y = y;
		this.children = Arr.new(new Array<Null | ElementBtreeNode>(M).fill(new Null), Ptr.Size);
		this.ptr = allocator.malloc(ElementBtreeNode.Size, this);
	}

    toBytes(): Array<string> {
		return [
			...numberToBytes(this.curKeyCount.value),
			...numberToBytes(this.isLeaf ? 1 : 0),
			...this.keys.toBytes(),
			...this.children.toBytes()
		];
	}

    toString(): string {
		return ` btree-node {} `;
	}

    toDisplayableBlocks() {
		return [
			` btree-node { keys_count: ${this.curKeyCount.value}, is_leaf: ${this.isLeaf.value}, keys: `,
			{ ptr: this.keys.toString() },
			` children: `,
			{ ptr: this.children.toString() },
			` } `
		];
	}

	dealloc() {
	}

	pointerDy: number = -1;
	pointerDx: number = -1;

	moveTo(x: number, y: number) {
		this.setXY(x, y);

		if(this.parentNode !== null) {
			// redraw parent's link
		}
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
			await canvas.scrollTo(canvas.halfWidth - this.x, canvas.halfHeight - this.y, 30);
		}
	}

	pointerDown(state: EventState): void {
		let { x: nodex, y: nodey } = this;
		let { x: statex, y: statey } = state.pointerDown;
		this.pointerDx = Math.floor((statex - nodex) / GAP) * GAP;
		this.pointerDy = Math.floor((statey - nodey) / GAP) * GAP;
	}

	focus() {
	}

	unfocus() {
	}

	isIntersect(x: number, y: number, canvas: CanvasHandler): null | ElementHandler {
		if(this.intersects(x, y, canvas.transform)) return this;
		return null;
	}

	draw(ctx: CanvasRenderingContext2D) {
		if(this === focusedElement.value) {
			this.drawBorder(ctx, "#FFFF00");
		}

		this.paint(ctx);
	}
}

