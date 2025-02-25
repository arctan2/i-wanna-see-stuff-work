import { GAP } from "../canvas";
import { EventState } from "../handler/event-handler";
import { CanvasHandler } from "../handler/canvas-handler";
import { focusedElement, isAutoRearrangeBtree } from "../global";
import { BptreeNode } from "./element-types/node";
import { ElementHandler } from "../handler/element-handler";
import allocator, { AllocDisplay, Dealloc, Null, Ptr } from "../memory-allocator/allocator";
import { ShallowReactive } from "vue";
import { Arr } from "../memory-allocator/types";
import { lerp, numberToBytes } from "../utils";
import { Point } from "../geometry";
import { Arrow } from "../linked-list/element-types/arrow";

const gapX = GAP * 4;
const gapY = BptreeNode.cellHeight * 2;

export class ElementBptreeNode extends BptreeNode implements ElementHandler, AllocDisplay, Dealloc {
	ptr: ShallowReactive<Ptr<ElementBptreeNode>>;

	pointerEnter(_state: EventState, _canvas: CanvasHandler) {};
	pointerLeave(_state: EventState, _canvas: CanvasHandler) {};

	parentNode: ElementBptreeNode | null = null;
	children: Ptr<Arr<Ptr<ElementBptreeNode> | Null>>;
	nextNode: Ptr<ElementBptreeNode> | Null;

	static Size = Ptr.Size + Ptr.Size;

	constructor(x: number, y: number, M: number, isLeaf: boolean, parent: ElementBptreeNode | null) {
		super(M, isLeaf);
		this.x = x;
		this.y = y;
		this.parentNode = parent;
		this.children = Arr.new(new Array<Ptr<ElementBptreeNode> | Null>(M).fill(new Null), Ptr.Size);
		this.ptr = allocator.malloc(ElementBptreeNode.Size, this);
		this.nextNode = new Null;
	}

    toBytes(): Array<string> {
		return [
			...numberToBytes(this.curKeyCount.value),
			...numberToBytes(this.isLeaf ? 1 : 0),
			...this.keys.toBytes(),
			...this.children.toBytes(),
			...this.nextNode.toBytes()
		];
	}

    toString(): string {
		return ` bptree-node { keys_count: ${
			this.curKeyCount.value
		}, is_leaf: ${
			this.isLeaf.value
		}, keys: ${
			this.keys.toString()
		}, children: ${
			this.children.toString()
		}, next: ${
			this.nextNode.toString()
		} } `
	}

    toDisplayableBlocks() {
		return [
			` bptree-node { keys_count: ${this.curKeyCount.value}, is_leaf: ${this.isLeaf.value}, keys: `,
			{ ptr: this.keys.toString() },
			` children: `,
			{ ptr: this.children.toString() },
			` next: `,
			{ ptr: this.nextNode.toString() },
			` } `
		];
	}

	dealloc() {
		allocator.free(this.children);
		allocator.free(this.keys);
	}

	pointerDy: number = -1;
	pointerDx: number = -1;

	dfsClean(node: Ptr<ElementBptreeNode> | Null) {
		if(Null.isNull(node)) {
			return;
		}

		const n = (node as Ptr<ElementBptreeNode>).v;

		if(n.constructor.name !== ElementBptreeNode.name) {
			return;
		}

		n.resetStyle();
		for(let i = 0; i <= n.curKeyCount.value; i++) {
			this.dfsClean(n.children.v.arr[i]);
		}
	}

	resetAllNodesStyle(canvas: CanvasHandler) {
		let root: ElementBptreeNode | null = this;

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
	}

	unfocus() {
	}

	isIntersect(x: number, y: number, canvas: CanvasHandler): null | ElementHandler {
		if(this.intersects(x, y, canvas.transform)) return this;
		return null;
	}

	drawLineToChild(ctx: CanvasRenderingContext2D, idx: number, color = "#ffffff") {
		const c = this.children.v.arr[idx];
		if(c.constructor.name === Null.name) {
			return;
		}

		const child = (c as Ptr<ElementBptreeNode>).v;

		ctx.strokeStyle = color;
		ctx.beginPath();
		ctx.lineWidth = 3;
		ctx.lineTo(this.x + (BptreeNode.cellWidth * idx), this.y + BptreeNode.cellHeight);
		ctx.lineTo(child.x + (child.totalWidth / 2), child.y);
		ctx.stroke();
	}

	async rearrangeTree(canvas: CanvasHandler, root?: ElementBptreeNode) {
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

			const node: ElementBptreeNode = queue.pop() as ElementBptreeNode;

			for(let i = 0; i <= node.curKeyCount.value; i++) {
				const child = node.children.v.arr[i];
				if(child.constructor.name !== Null.name) {
					queue.unshift((child as Ptr<ElementBptreeNode>).v);
				}
			}

			temp.push(node);

			if(count === 0) {
				levels.push(temp);
				temp = [];
			}
		}

		const lastLevel = levels.length - 1;

		if(lastLevel === 0) {
			return;
		}

		let locMap = new Map<ElementBptreeNode, Point>();

		const lastLevelY = root.y + (lastLevel * (BptreeNode.cellHeight + gapY));
		const lastLevelWidth = ((root.totalWidth + gapX) * levels[lastLevel].length) - gapX;
		const lastLevelStartX = (root.x + root.totalWidthHalf) - (lastLevelWidth / 2);

		for(let i = 0; i < levels[lastLevel].length; i++) {
			const endPoint = new Point(lastLevelStartX + ((root.totalWidth + gapX) * i), lastLevelY);
			locMap.set(levels[lastLevel][i], endPoint);
		}

		for(let i = lastLevel - 1; i >= 0; i--) {
			let level = levels[i];
			for(let j = 0; j < level.length; j++) {
				let node = level[j];
				const children = node.children.v.arr;
				const firstChild = (children[0] as Ptr<ElementBptreeNode>).v;
				const lastChild = (children[node.curKeyCount.value] as Ptr<ElementBptreeNode>).v;
				const firstChildX = locMap.get(firstChild)?.x || 0;
				const lastChildEndX = (locMap.get(lastChild)?.x || 0);

				const endPoint = new Point(
					(firstChildX + lastChildEndX) / 2,
					root.y + (i * (BptreeNode.cellHeight + gapY))
				);
				locMap.set(node, endPoint);
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
		this.bg = BptreeNode.nodeBg;
		this.draw(canvas.ctx);
	}

	*animateCellBg(canvas: CanvasHandler, idx: number, color: string) {
		this.keysBg[idx] = color;
		this.drawCell(canvas.ctx, idx);
		yield;
		this.keysBg[idx] = BptreeNode.cellBg;
		this.drawCell(canvas.ctx, idx);
	}

	drawArrowToNext(ctx: CanvasRenderingContext2D) {
		if(Null.isNull(this.nextNode)) {
			return;
		}
		const n = (this.nextNode as Ptr<ElementBptreeNode>).v;
		const p1 = { x: this.x + this.totalWidth, y: this.y + (ElementBptreeNode.cellHeight / 2) }
		const p2 = { x: n.x, y: n.y + (ElementBptreeNode.cellHeight / 2) }
		Arrow.drawFromTo(ctx, p1, p2, "#ffffff");
	}

	draw(ctx: CanvasRenderingContext2D) {
		this.paint(ctx);
		if(this === focusedElement.value) {
			this.drawBorder(ctx, "#ffff00");
		}

		for(let i = 0; i <= this.curKeyCount.value; i++) {
			this.drawLineToChild(ctx, i);
		}

		this.drawArrowToNext(ctx);
	}
}

