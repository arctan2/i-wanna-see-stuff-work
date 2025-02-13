import { GAP } from "../canvas";
import { EventState } from "../handler/event-handler";
import { CanvasHandler } from "../handler/canvas-handler";
import { focusedElement } from "../global";
import { BtreeNode } from "./element-types/node";
import { ElementHandler } from "../handler/element-handler";
import allocator, { AllocDisplay, Dealloc, Null, Ptr } from "../memory-allocator/allocator";
import { ShallowReactive } from "vue";
import { Arr } from "../memory-allocator/types";
import { lerp, numberToBytes } from "../utils";
import { Point } from "../geometry";

const gapX = GAP * 2;
const gapY = BtreeNode.cellHeight * 2;

export class ElementBtreeNode extends BtreeNode implements ElementHandler, AllocDisplay, Dealloc {
	ptr: ShallowReactive<Ptr<ElementBtreeNode>>;

	pointerEnter(_state: EventState, _canvas: CanvasHandler) {};
	pointerLeave(_state: EventState, _canvas: CanvasHandler) {};

	parentNode: ElementBtreeNode | null = null;
	children: Ptr<Arr<Ptr<ElementBtreeNode> | Null>>;

	static Size = Ptr.Size + Ptr.Size;

	constructor(x: number, y: number, M: number, isLeaf: boolean, parent: ElementBtreeNode | null) {
		super(M, isLeaf);
		this.x = x;
		this.y = y;
		this.parentNode = parent;
		this.children = Arr.new(new Array<Ptr<ElementBtreeNode> | Null>(M).fill(new Null), Ptr.Size);
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
		return ` btree-node { keys_count: ${
			this.curKeyCount.value
		}, is_leaf: ${
			this.isLeaf.value
		}, keys: ${
			this.keys.toString()
		} children: ${
			this.children.toString()
		} } `
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
		allocator.free(this.children);
		allocator.free(this.keys);
	}

	pointerDy: number = -1;
	pointerDx: number = -1;

	dfsClean(node: Ptr<ElementBtreeNode> | Null) {
		if(Null.isNull(node)) {
			return;
		}

		const n = (node as Ptr<ElementBtreeNode>).v;

		if(n.constructor.name !== ElementBtreeNode.name) {
			return;
		}

		n.resetStyle();
		for(let i = 0; i <= n.curKeyCount.value; i++) {
			this.dfsClean(n.children.v.arr[i]);
		}
	}

	resetAllNodesStyle(canvas: CanvasHandler) {
		let root: ElementBtreeNode | null = this;

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

		const child = (c as Ptr<ElementBtreeNode>).v;

		ctx.strokeStyle = color;
		ctx.beginPath();
		ctx.lineWidth = 3;
		ctx.lineTo(this.x + (BtreeNode.cellWidth * idx), this.y + BtreeNode.cellHeight);
		ctx.lineTo(child.x + (child.totalWidth / 2), child.y);
		ctx.stroke();
	}

	async rearrangeTree(canvas: CanvasHandler, root?: ElementBtreeNode) {
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

			const node: ElementBtreeNode = queue.pop() as ElementBtreeNode;

			for(let i = 0; i <= node.curKeyCount.value; i++) {
				const child = node.children.v.arr[i];
				if(child.constructor.name !== Null.name) {
					queue.unshift((child as Ptr<ElementBtreeNode>).v);
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

		let locMap = new Map<ElementBtreeNode, Point>();

		const lastLevelY = root.y + (lastLevel * (BtreeNode.cellHeight + gapY));
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
				const firstChild = (children[0] as Ptr<ElementBtreeNode>).v;
				const lastChild = (children[node.curKeyCount.value] as Ptr<ElementBtreeNode>).v;
				const firstChildX = locMap.get(firstChild)?.x || 0;
				const lastChildEndX = (locMap.get(lastChild)?.x || 0);

				const endPoint = new Point(
					(firstChildX + lastChildEndX) / 2,
					root.y + (i * (BtreeNode.cellHeight + gapY))
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

	draw(ctx: CanvasRenderingContext2D) {
		this.paint(ctx);
		if(this === focusedElement.value) {
			this.drawBorder(ctx, "#ffff00");
		}

		for(let i = 0; i <= this.curKeyCount.value; i++) {
			this.drawLineToChild(ctx, i);
		}
	}
}

