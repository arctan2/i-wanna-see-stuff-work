import { GAP } from "../canvas";
import { EventState } from "../handler/event-handler";
import { CanvasHandler } from "../handler/canvas-handler";
import { isAutoRearrangeBtree } from "../global";
import { TrieNode, gapX, gapY } from "./element-types/node";
import { ElementHandler } from "../handler/element-handler";
import allocator, { AllocDisplay, Dealloc, Null, Ptr } from "../memory-allocator/allocator";
import { ShallowReactive } from "vue";
import { lerp, numberToBytes } from "../utils";
import { Point } from "../geometry";
import { WalkersNode, getNewCoords } from "../walkers-algorithm";
import { Arrow } from "../linked-list/element-types/arrow";

export class ElementTrieNode extends TrieNode implements ElementHandler, AllocDisplay, Dealloc, WalkersNode {
	ptr: ShallowReactive<Ptr<ElementTrieNode>>;

	pointerEnter(_state: EventState, _canvas: CanvasHandler) {};
	pointerLeave(_state: EventState, _canvas: CanvasHandler) {};

	parentNode: ElementTrieNode | null;

	children: ShallowReactive<Array<Ptr<ElementTrieNode> | null>>;

	static Size = Ptr.Size + (Ptr.Size * 26);

	constructor(x: number, y: number, parent: ElementTrieNode | null, str: string = "root") {
		super(str);
		this.x = x;
		this.y = y;
		this.parentNode = parent;
		this.children = new Array(26).fill(null);
		this.ptr = allocator.malloc(ElementTrieNode.Size, this);
	}

    toBytes(): Array<string> {
		let blocks = [];
		let nullBlock = Null.Bytes;

		for(const child of this.children) {
			blocks.push(...((child === null) ? nullBlock : child.toBytes()));
		}

		return [
			...numberToBytes(this.isWordEnd.value ? 1 : 0),
			...blocks
		];
	}

    toString(): string {
		let blocks = "";
		let nullBlock = Null.Hex;

		for(const child of this.children) {
			blocks += ((child === null) ? nullBlock : child.toString()) + ",";
		}

		blocks = blocks.slice(0, -1);

		return ` trie-node { is_word_end: ${this.isWordEnd.value}, children: [${blocks}] } `
	}

    toDisplayableBlocks() {
		let blocks = [];
		let nullBlock = { ptr: Null.Hex };

		for(const child of this.children) {
			blocks.push((child === null) ? nullBlock : { ptr: child.toString() }, ",");
		}

		blocks = blocks.slice(0, -1);

		return [
			` trie-node { is_word_end: ${this.isWordEnd.value}, children: [`, ...blocks ,`] } `
		];
	}

	dealloc() {
	}

	pointerDy: number = -1;
	pointerDx: number = -1;

	dfsClean(node: ElementTrieNode | null) {
		if(!node) {
			return;
		}

		for(const c of node.children) {
			if(c !== null) {
				this.dfsClean(c.v);
			}
		}

		node.resetStyle();
	}

	isEmpty() {
		for(const child of this.children) {
			if(child !== null) return false;
		}
		return true;
	}

	isLeaf(): boolean {
		return this.isEmpty();
	}

	getLeftSibling() {
		if(this.parentNode === null) return null;
		let children = this.parentNode.children;
		let prevNonNull = null;

		for(let i = 0; i < children.length; i++) {
			if(children[i]?.v === this) {
				break;
			}

			if(children[i] !== null) {
				prevNonNull = children[i]?.v as ElementTrieNode || null;
			}
		}

		return prevNonNull;
	}

	getRightSibling() {
		if(this.parentNode === null) return null;
		let children = this.parentNode.children;

		let i = 0;
		while(i < children.length) {
			if(children[i]?.v === this) {
				break;
			}
			i++;
		}

		if(i >= children.length) {
			return null;
		}

		i++;

		while(i < children.length) {
			if(children[i] !== null) {
				break;
			}
			i++;
		}

		if(i >= children.length) {
			return null;
		}

		return children[i]?.v as ElementTrieNode || null;
	}

	getFirstChild() {
		for(const c of this.children) {
			if(c !== null) {
				return c.v;
			}
		}
		return null;
	}

	hasChild() {
		return !this.isLeaf();
	}

	resetAllNodesStyle(canvas: CanvasHandler) {
		let root: ElementTrieNode | null = this;

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
		this.rearrangeTree(canvas);
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

	doRectifyFor(node: ElementTrieNode, end: Point) {
		const r = TrieNode.radius;
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

	drawLineToChild(ctx: CanvasRenderingContext2D, idx: number, color = "#ffffff") {
		const to = this.children[idx];
		if(to === null) {
			return;
		}

		const child = to.v;
		const p1 = this.doRectifyFor(child, this) as any;
		const p2 = this.doRectifyFor(this, child) as any;

		Arrow.drawFromTo(ctx, p2, p1, color);
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
		return false;
	}

	getRoot() {
		let root: ElementTrieNode = this;
		while(root.parentNode !== null) {
			root = root.parentNode;
		}

		return root;
	}

	async rearrangeTree(canvas: CanvasHandler, root?: ElementTrieNode) {
		if(root === undefined) {
			root = this.getRoot();
		}

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

	drawWord(ctx: CanvasRenderingContext2D) {
		ctx.fillStyle = "#ffffff";
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
		ctx.font = "16px monospace";
		ctx.fillText(this.word, this.x, this.y + TrieNode.radius + (GAP * 2));
	}

	draw(ctx: CanvasRenderingContext2D) {
		this.paint(ctx);

		for(let i = 0; i < this.children.length; i++) {
			if(this.children[i]) {
				this.drawLineToChild(ctx, i);
			}
		}

		if(this.isWordEnd.value) {
			this.drawWord(ctx);
		}
	}
}

