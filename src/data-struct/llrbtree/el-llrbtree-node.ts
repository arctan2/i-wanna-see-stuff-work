import { GAP } from "../canvas";
import { EventState } from "../handler/event-handler";
import { CanvasHandler } from "../handler/canvas-handler";
import { isAutoRearrangeBtree } from "../global";
import { LLRbtreeNode, gapX, gapY } from "./element-types/node";
import { ElementHandler } from "../handler/element-handler";
import allocator, { AllocDisplay, Dealloc, Null, Ptr } from "../memory-allocator/allocator";
import { ShallowReactive } from "vue";
import { boolToBytes, lerp, numberToBytes } from "../utils";
import { Point } from "../geometry";
import { getNewCoords } from "../walkers-algorithm";

export type PtrLLRbNode = Ptr<ElementLLRbtreeNode> | null;

export class ElementLLRbtreeNode extends LLRbtreeNode implements ElementHandler, AllocDisplay, Dealloc {
	ptr: ShallowReactive<Ptr<ElementLLRbtreeNode>>;

	pointerEnter(_state: EventState, _canvas: CanvasHandler) {};
	pointerLeave(_state: EventState, _canvas: CanvasHandler) {};

	parentNode: ElementLLRbtreeNode | null = null;
	lNode: PtrLLRbNode;
	rNode: PtrLLRbNode;

	static Size = Ptr.Size + Ptr.Size;

	constructor(x: number, y: number, parent: ElementLLRbtreeNode | null, key: number | "" = "") {
		super(key);
		this.x = x;
		this.y = y;
		this.parentNode = parent;
		this.ptr = allocator.malloc(ElementLLRbtreeNode.Size, this);
		this.lNode = null;
		this.rNode = null;
	}

    toBytes(): Array<string> {
		return [
			...numberToBytes(this.key.value === "" ? 0 : this.key.value),
			...boolToBytes(this.isBlack),
			...(this.lNode || new Null).toBytes(),
			...(this.rNode || new Null).toBytes(),
		];
	}

    toString(): string {
		return ` llrbtree-node { key: ${
			this.key.value === "" ? "0" : this.key.value
		}, is_black: ${
			this.isBlack
		}, left: ${
			(this.lNode || new Null).toString()
		}, right: ${
			(this.rNode || new Null).toString()
		} } `
	}

    toDisplayableBlocks() {
		return [
			` llrbtree-node { key: ${this.key.value === "" ? "0" : this.key.value}, is_black: ${this.isBlack}, left: `,
			{ ptr: (this.lNode || new Null).toString() },
			` right: `,
			{ ptr: (this.rNode || new Null).toString() },
			` } `
		];
	}

	dealloc() {
	}

	pointerDy: number = -1;
	pointerDx: number = -1;

	dfsClean(node: ElementLLRbtreeNode | null) {
		if(!node) {
			return;
		}
		
		if(node.lNode) {
			this.dfsClean(node.lNode.v);
		}

		if(node.rNode) {
			this.dfsClean(node.rNode.v);
		}

		node.resetStyle();
	}

	isLeaf(): boolean {
		return (this.lNode === null) && (this.rNode === null);
	}

	getLeftSibling() {
		if(this.parentNode === null) return null;
		if(this.parentNode.lNode === this.ptr) return null;
		return this.parentNode.lNode?.v || null;
	}

	getRightSibling() {
		if(this.parentNode === null) return null;
		if(this.parentNode.rNode === this.ptr) return null;
		return this.parentNode.rNode?.v || null;
	}

	getFirstChild() {
		return (this.lNode || this.rNode)?.v || null;
	}

	hasChild() {
		return !this.isLeaf();
	}

	hasRightSibling() {
		if(this.parentNode === null) return false;
		if(this.parentNode.rNode === this.ptr) return false;
		return this.parentNode.rNode !== null;
	}

	resetAllNodesStyle(canvas: CanvasHandler) {
		let root: ElementLLRbtreeNode | null = this;

		while(root!.parentNode !== null) {
			root = root!.parentNode;
		}

		if(root !== null) {
			this.dfsClean(root);
		}
		canvas.redraw();
	}

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
		if(isAutoRearrangeBtree.value === false) {
			return null;
		}
		if(Math.abs(state.pointerDown.x - state.pointerUp.x) <= GAP && Math.abs(state.pointerDown.y - state.pointerUp.y) <= GAP) {
			return null;
		}
		this.rearrangeTree(canvas, this);
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

	doRectifyFor(node: ElementLLRbtreeNode, end: Point) {
		const r = LLRbtreeNode.radius;
		const { x: x0, y: y0 } = node;
		const { x: x1, y: y1 } = end;
		const { x: h, y: k } = node;

		const x1mx0 = x1 - x0;
		const y1my0 = y1 - y0;
		const x0mh = x0 - h;
		const y0mk = y0 - k;

		const a = x1mx0 * x1mx0 + y1my0 * y1my0; 
		const b = 2 * x1mx0 * x0mh + 2 * y1my0 * y0mk;
		const c = x0mh * 2 + y0mk * 2 - (r * r);

		const d = b * b - 4 * a * c;

		if(d < 0) return;
		
		// replaced + with - 
		//                   ---|
		//                      v
		const t = (2 * c) / (-b - Math.sqrt(d));
		const x = x1mx0 * t + x0;
		const y = y1my0 * t + y0;

		return { x, y };
	}

	drawLineToChild(ctx: CanvasRenderingContext2D, childType: "l" | "r", color = "#ffffff") {
		const to = childType === "l" ? this.lNode : this.rNode;
		if(to === null) {
			return;
		}


		const child = to.v;
		const p1 = this.doRectifyFor(child, this) as any;
		const p2 = this.doRectifyFor(this, child) as any;

		ctx.strokeStyle = color;
		ctx.beginPath();
		ctx.lineWidth = 3;
		ctx.lineTo(p1.x, p1.y);
		ctx.lineTo(p2.x, p2.y);
		ctx.stroke();
	}

	// must call these before setting the child if you need default leaf positions
	getLeftChildPos() {
		if(this.lNode) {
			return new Point(this.lNode.v.x, this.lNode.v.y);
		}
		return new Point(this.x - gapX, this.y + gapY);
	}

	getRightChildPos() {
		if(this.rNode) {
			return new Point(this.rNode.v.x, this.rNode.v.y);
		}
		return new Point(this.x + gapX, this.y + gapY);
	}

	async moveToAnimate(canvas: CanvasHandler, x: number, y: number) {
		const fromX = this.x;
		const fromY = this.y;
		return new Promise<void>((resolve) => {
			let t = 0;
			const run = () => {
				t = Math.min(t + 0.05, 1);
				this.x = lerp(fromX, x, t);
				this.y = lerp(fromY, y, t);
				this.parentNode?.draw(canvas.ctx);
				canvas.redraw();
				if(t >= 1) {
					resolve();
					return;
				}
				window.requestAnimationFrame(run);
			}

			window.requestAnimationFrame(run);
		})
	}

	isLeftChild() {
		if(this.parentNode === null) return false;
		return this.parentNode.lNode === this.ptr;
	}

	getRoot() {
		let root: ElementLLRbtreeNode = this;
		while(root.parentNode !== null) {
			root = root.parentNode;
		}
		return root;
	}

	async rearrangeTree(canvas: CanvasHandler, root?: ElementLLRbtreeNode) {
		if(root === undefined) {
			root = this;
		}

		root = root.getRoot();

		const locMap = getNewCoords(root, gapX, gapY);

		return new Promise<void>((resolve) => {
			let t = 0;
			const run = () => {
				t = Math.min(t + 0.05, 1);
				for(const [node, point] of locMap.entries()) {
					node.x = lerp(node.x, point.x, t);
					node.y = lerp(node.y, point.y, t);
				}
				canvas.redraw();
				if(t >= 1) {
					resolve();
					return;
				}
				window.requestAnimationFrame(run);
			}

			window.requestAnimationFrame(run);
		})
	}

	*animateNodeBg(canvas: CanvasHandler, color: string) {
		this.bg = color;
		this.draw(canvas.ctx);
		yield;
		this.bg = this.defaultBg;
		this.draw(canvas.ctx);
	}

	draw(ctx: CanvasRenderingContext2D) {
		this.paint(ctx);
		this.drawLineToChild(ctx, "l");
		this.drawLineToChild(ctx, "r");
	}
}

