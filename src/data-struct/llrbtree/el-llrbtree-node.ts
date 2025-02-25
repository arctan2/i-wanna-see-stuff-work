import { GAP } from "../canvas";
import { EventState } from "../handler/event-handler";
import { CanvasHandler } from "../handler/canvas-handler";
import { isAutoRearrangeBtree } from "../global";
import { LLRbtreeNode } from "./element-types/node";
import { ElementHandler } from "../handler/element-handler";
import allocator, { AllocDisplay, Dealloc, Null, Ptr } from "../memory-allocator/allocator";
import { ShallowReactive } from "vue";
import { lerp, numberToBytes } from "../utils";
import { Point } from "../geometry";

const gapX = GAP * 4;
const gapY = LLRbtreeNode.radius;

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
			...numberToBytes(this.isBlack ? 1 : 0),
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

	dfsClean(node: PtrLLRbNode) {
		if(!node) {
			return;
		}

		const n = (node as Ptr<ElementLLRbtreeNode>).v;

		if(n.constructor.name !== ElementLLRbtreeNode.name) {
			return;
		}

		n.resetStyle();
	}

	resetAllNodesStyle(canvas: CanvasHandler) {
		let root: ElementLLRbtreeNode | null = this;

		while(root!.parentNode !== null) {
			root = root!.parentNode;
		}

		if(root !== null) {
			this.dfsClean(root.ptr);
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

	async rearrangeTree(canvas: CanvasHandler, root?: ElementLLRbtreeNode) {
		if(root === undefined) {
			root = this;
		}

		while(root.parentNode !== null) {
			root = root?.parentNode;
		}

		let levels = [];
		let queue = [root];

		let count = 0;
		let temp = [];

		while(queue.length > 0) {
			if(count === 0) {
				count = queue.length;
			}

			count--;

			const node: ElementLLRbtreeNode = queue.pop() as ElementLLRbtreeNode;

			if(node.lNode) {
				queue.unshift(node.lNode.v);
			}

			if(node.rNode) {
				queue.unshift(node.rNode.v);
			}

			temp.push(node);

			if(count === 0) {
				levels.push(temp);
				temp = [];
			}
		}


		const diameter = LLRbtreeNode.diameter;
		const radius = LLRbtreeNode.radius;

		const actualLastLevelLength = levels.pop()?.length || 0;
		const lastLevel = levels.length - 1;

		if(lastLevel < 0) return;

		let locMap = new Map<ElementLLRbtreeNode, Point>();
		const lastLevelY = root.y + (lastLevel * (diameter + gapY));
		const lastLevelWidth = (diameter + gapX) * (levels[lastLevel].length + actualLastLevelLength);
		let lastLevelStartX = (root.x + radius) - ((lastLevelWidth - diameter) / 2);

		let tempX = 0;

		for(let i = 0; i < levels[lastLevel].length; i++) {
			let node = levels[lastLevel][i];

			if(node.lNode !== null || node.rNode !== null) tempX += diameter + gapX;

			const endPoint = new Point(
				lastLevelStartX + ((diameter + gapX) * i) + tempX, lastLevelY
			);
			locMap.set(node, endPoint);
		}

		for(let i = lastLevel - 1; i >= 0; i--) {
			let level = levels[i];
			for(let j = 0; j < level.length; j++) {
				let node = level[j];

				if(node.lNode) {
					const leftChild = node.lNode.v;
					const leftX = locMap.get(leftChild)?.x || 0;

					let endPoint = new Point(
						(leftX + diameter + gapX),
						root.y + (i * (radius + gapY))
					);

					if(node.rNode) {
						const rightChild = node.rNode.v;
						const rightX = (locMap.get(rightChild)?.x || 0);
						endPoint.x = (leftX + rightX) / 2;
					}
					locMap.set(node, endPoint);
				}
			}
		}

		for(const node of levels[lastLevel]) {
			const nodeLoc = locMap.get(node);

			if(!nodeLoc) {
				continue;
			}

			if(node.lNode) {
				let endPoint = new Point(
					nodeLoc.x - radius - (gapX / 2),
					nodeLoc.y + diameter + gapY
				);

				locMap.set(node.lNode.v, endPoint);
			}

			if(node.rNode) {
				let endPoint = new Point(
					nodeLoc.x + radius + (gapX / 2),
					nodeLoc.y + diameter + gapY
				);

				locMap.set(node.rNode.v, endPoint);
			}
		}

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

