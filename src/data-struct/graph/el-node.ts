import { GAP } from "../canvas";
import { Point } from "../geometry";
import { EventState } from "../handler/event-handler";
import { CanvasHandler } from "../handler/canvas-handler";
import { GNode } from "./element-types/node";
import { ElementHandler } from "../handler/element-handler";
import { ElementUEdge } from "./el-u-edge";
import { ElementDEdge } from "./el-d-edge";
import allocator, { AllocDisplay, Dealloc, Ptr } from "../memory-allocator/allocator";
import { MapList } from "../memory-allocator/types";

export class ElementGNode extends GNode implements ElementHandler, AllocDisplay, Dealloc {
	edges: Ptr<MapList<Ptr<ElementUEdge | ElementDEdge>>> = MapList.new(new Map, Ptr.Size);

	referedByDEdges: Set<ElementDEdge> = new Set();

	ptr: Ptr<ElementGNode>;

	static COUNT = 0;
	static Size = Ptr.Size + Ptr.Size;

	pointerEnter(_state: EventState, _canvas: CanvasHandler) {};
	pointerUp(_state: EventState, _canvas: CanvasHandler): ElementHandler | null { return null };
	pointerLeave(_state: EventState, _canvas: CanvasHandler) {};

	readonly id: number;

    toBytes(): Array<string> {
		return [...this.value.toBytes(), ...this.edges.toBytes()]
	}

    toString(): string {
		return ` gnode { val: ${this.value}, edges: ${this.edges} } `;
	}

    toDisplayableBlocks() {
		return [
			` gnode { val: `,
			{ ptr: this.value.toString() },
			`, edges: `,
			{ ptr: this.edges.toString() },
			` }`
		];
	}

	dealloc() {
		allocator.free(this.value);
		allocator.free(this.edges);
	}

	constructor(x: number, y: number, value: string) {
		super(value);
		this.x = x;
		this.y = y;
		this.id = ElementGNode.COUNT;
		ElementGNode.COUNT++;
		this.ptr = allocator.malloc(ElementGNode.Size, this);
	}

	pointerDy: number = -1;
	pointerDx: number = -1;

	rectifyEdges() {
	}

	defaultArrowPointPos(): Point {
		return new Point(this.left + GAP, (this.top + this.bottom) / 2);
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

		this.edges.v.list().forEach(edge => edge.v.rectify())

		for(let e of this.referedByDEdges) {
			e.rectify();
		}

		canvas.redraw();
	}

	static hasUEdge(n1: ElementGNode, n2: ElementGNode): boolean {
		for(let edge of n1.edges.v.list() as Array<Ptr<ElementUEdge>>) {
			if(
				(edge.v.fromNode === n1 && edge.v.toNode === n2) ||
				(edge.v.toNode === n1 && edge.v.fromNode === n2)
			) {
				return true;
			}
		}
		return false;
	}

	static hasDEdge(from: ElementGNode, to: ElementGNode): boolean {
		for(let edge of from.edges.v.list() as Array<Ptr<ElementDEdge>>) {
			if(edge.v.toNode === to) {
				return true;
			}
		}
		return false;
	}

	addUEdge(e: Ptr<ElementUEdge>) {
		this.edges.v.set(e);
	}

	addDEdge(e: Ptr<ElementDEdge>) {
		this.edges.v.set(e);
	}

	remove(canvas: CanvasHandler) {
		allocator.free(this.ptr);
		canvas.removeElements(this);
	}

	async deleteNode(canvas: CanvasHandler) {
		for(let edge of this.edges.v.list()) {
			await edge.v.delete(canvas);
		}
		
		for(let edge of this.referedByDEdges) {
			await edge.delete(canvas);
		}

		this.remove(canvas);
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

	isIntersect(x: number, y: number, canvas: CanvasHandler): null | ElementHandler {
		if(this.intersects(x, y, canvas.transform)) return this;
		return null;
	}

	unfocus() {
		this.borderColor = "";
	}

	focus() {
		this.borderColor = "#ffff00";
	}

	draw(ctx: CanvasRenderingContext2D) {
		this.paint(ctx);

		for(let edge of this.edges.v.list()) {
			edge.v.draw(ctx);
		}
	}
}

