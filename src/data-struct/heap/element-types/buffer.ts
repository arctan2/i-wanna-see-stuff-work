import { GAP, circleFill } from "../../canvas";
import { getContrastFg } from "../../utils";
import { List, PrimitiveSize } from "../../memory-allocator/types";
import { Ptr } from "../../memory-allocator/allocator";
import { Ref, ref } from "vue";
import { Transform } from "../../handler/canvas-handler";
import { WalkersNode, getNewCoords } from "../../walkers-algorithm";
import { Point } from "../../geometry";

export class HeapNode implements WalkersNode {
	public static radius = GAP * 2;
	public static diameter = HeapNode.radius * 2;

	parentNode: HeapNode | null;
	ptr: Ptr<WalkersNode>;

	bg: string;
	x: number;
	y: number;
	idx: number;

	heap: HeapBuffer;

	constructor(heap: HeapBuffer, bg: string, x: number, y: number, idx: number) {
		this.bg = bg;
		this.x = x
		this.y = y
		this.idx = idx;
		this.heap = heap;

		if(idx === 0) {
			this.parentNode = null;
		} else {
			this.parentNode = heap.nodesStyles[heap.parentIdx(idx)];
		}

		this.ptr = new Ptr(0, 0, this);
	}

	toBytes() { return [] }
	toString() { return "" }
	toDisplayableBlocks() { return [] }

	resetStyle() {
		this.bg = HeapBuffer.bg;
	}

	getFirstChild() {
		const i = this.heap.leftIdx(this.idx);
		if(i < this.heap.buf.v.length) {
			return this.heap.nodesStyles[i];
		}
		return null;
	}

	getLeftSibling() {
		if(this.parentNode === null) return null;
		const i = this.heap.leftIdx(this.parentNode.idx);
		if((i >= this.heap.buf.v.length) || (i === this.idx)) {
			return null;
		}

		return this.heap.nodesStyles[i];
	}

	getRightSibling() {
		if(this.parentNode === null) return null;
		const i = this.heap.rightIdx(this.parentNode.idx);
		if((i >= this.heap.buf.v.length) || (i === this.idx)) {
			return null;
		}

		return this.heap.nodesStyles[i];
	}

	totalWidth() {
		return HeapNode.diameter;
	}

	isLeaf() {
		return this.idx > (Math.floor(this.heap.buf.v.length / 2) - 1);
	}

	doRectifyFor(node: HeapNode, end: Point) {
		const r = HeapNode.radius;
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

	drawLineToIdx(ctx: CanvasRenderingContext2D, idx: number, color = "#ffffff") {
		const to = this.heap.nodesStyles[idx];
		if(idx >= this.heap.buf.v.length) {
			return;
		}

		const p1 = this.doRectifyFor(to, this) as any;
		const p2 = this.doRectifyFor(this, to) as any;

		ctx.strokeStyle = color;
		ctx.beginPath();
		ctx.lineWidth = 3;
		ctx.lineTo(p1.x, p1.y);
		ctx.lineTo(p2.x, p2.y);
		ctx.stroke();
	}

	draw(ctx: CanvasRenderingContext2D) {
		const { x, y } = this;

		ctx.fillStyle = this.bg;
		circleFill(ctx, x, y, HeapNode.radius);

		ctx.fillStyle = getContrastFg(this.bg);
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
		ctx.font = `${HeapNode.radius * 0.5}px monospace`;
		let text = String(this.heap.buf.v.at(this.idx));
		ctx.fillText(text, this.x, this.y);

		this.drawLineToIdx(ctx, this.heap.leftIdx(this.idx));
		this.drawLineToIdx(ctx, this.heap.rightIdx(this.idx));
	}
}

export function minCmpFn(a: number, b: number) { return a < b; }
export function maxCmpFn(a: number, b: number) { return a > b; }

export class HeapBuffer {
	public static cellWidth = GAP * 6;
	public static cellHeight = GAP * 3;
	static borderWidth = 3;
	static fontSize = 12;
	static bg = "#00e5ff";
	static cellStrokeColor = "#003b34";

	cmpFn: (a: number, b: number) => boolean = minCmpFn;

	buf: Ptr<List<number>>;

	rowLen: Ref<number>;

	nodesStyles: HeapNode[];

	borderColor: string = "";

	x = -1;
	y = -1;

	constructor(alloc?: boolean) {
		if(alloc === false) {
			this.buf = new Ptr(0, 0, new List([], 0, 10, false, "number"));
		} else {
			this.buf = List.new([], PrimitiveSize.Int, 10, "number");
		}

		this.rowLen = ref(10);
		this.nodesStyles = [];
		this.resetStyle();
		this.setAsMinHeap();
	}

	setAsMinHeap() {
		this.cmpFn = maxCmpFn;
	}

	setAsMaxHeap() {
		this.cmpFn = minCmpFn;
	}

	checkNodesStylesSize() {
		const diff = this.buf.v.length - this.nodesStyles.length;
		if(diff > 0) {
			for(let i = 0; i < diff; i++) {
				this.nodesStyles.push(new HeapNode(this, HeapBuffer.bg, 0, 0, this.nodesStyles.length));
			}
		}
	}

	resetStyle() {
		for(const n of this.nodesStyles) {
			n.resetStyle();
		}
		this.borderColor = "";
		return this;
	}

	drawCellAtIdx(ctx: CanvasRenderingContext2D, idx: number) {
		const row = Math.floor(idx / this.rowLen.value);
		const col = (idx % this.rowLen.value);

		const x = this.x + (col * HeapBuffer.cellWidth);
		const y = this.y + (row * HeapBuffer.cellHeight);

		if(idx < this.buf.v.list().length) {
			const s = this.nodesStyles[idx];

			ctx.fillStyle = s.bg;
			ctx.fillRect(x, y, HeapBuffer.cellWidth, HeapBuffer.cellHeight);

			ctx.fillStyle = getContrastFg(s.bg);
			ctx.textBaseline = "middle";
			ctx.textAlign = "center";
			ctx.font = `${HeapBuffer.fontSize}px monospace`;

			let text = String(this.buf.v.list()[idx]);
			
			ctx.fillText(text, x + (HeapBuffer.cellWidth / 2), y + HeapBuffer.cellHeight / 2);

			this.drawTreeNode(ctx, idx);
		}
		ctx.lineWidth = 1;
		ctx.strokeStyle = HeapBuffer.cellStrokeColor;
		ctx.strokeRect(x, y, HeapBuffer.cellWidth, HeapBuffer.cellHeight);

		// display dimensions
		const dimStr = `${this.cmpFn === maxCmpFn ? "min" : "max"}-heap: { cap: ${this.buf.v.cap}, len: ${this.buf.v.length} }`;
		const strH = 13;
		const strW = dimStr.length * strH;

		const strWb3 = strW / 3;
		const lx = this.left;
		const ly = this.top - GAP + 2 - (strH / 2) - 4;

		ctx.beginPath();
		ctx.fillStyle = "#7703fc";
		ctx.roundRect(lx, ly, strW - strWb3, 18, 4);
		ctx.fill();

		ctx.textBaseline = "middle";
		ctx.textAlign = "left";
		ctx.font = `${strH}px monospace`;
		ctx.fillStyle = "#ffffff";
		ctx.fillText(dimStr, lx + GAP, ly + 9);
	}

	drawTreeNode(ctx: CanvasRenderingContext2D, idx: number) {
		const n = this.nodesStyles[idx];
		n?.draw(ctx);
	}

	drawTree(ctx: CanvasRenderingContext2D) {
		this.checkNodesStylesSize();
		if(this.buf.v.length > 0) {
			this.nodesStyles[0].x = this.x + Math.floor(this.width() / 2);
			this.nodesStyles[0].y = this.y - (Math.floor((Math.log2(this.buf.v.length)) + 1) * (HeapNode.diameter + (HeapNode.radius / 4)));

			const locs = getNewCoords(this.nodesStyles[0], HeapNode.diameter, HeapNode.diameter + (HeapNode.radius / 4));

			for(let i = 0; i < this.buf.v.length; i++) {
				const n = this.nodesStyles[i];
				n.draw(ctx);
				const loc = locs.get(n);
				if(loc) {
					n.x = loc.x;
					n.y = loc.y;
				}
			}
		}
	}

	paint(ctx: CanvasRenderingContext2D) {
		const { x, y } = this;

		ctx.beginPath();
			ctx.fillStyle = HeapBuffer.bg;
			ctx.roundRect(x, y, this.rowLen.value * HeapBuffer.cellWidth, this.height(), 4);
			ctx.fill();
			if(this.borderColor) {
				const pad = 2;
				ctx.roundRect(x - pad, y - pad, (this.rowLen.value * HeapBuffer.cellWidth) + (pad * 2), this.height() + (pad * 2), 4);
				ctx.lineWidth = HeapBuffer.borderWidth;
				ctx.strokeStyle = this.borderColor;
				ctx.stroke();
			}
		ctx.restore();

		this.drawTree(ctx);
		for(let i = 0; i < this.buf.v.cap; i++) {
			this.drawCellAtIdx(ctx, i);
		}
	}

	height() {
		return Math.ceil(this.buf.v.cap / this.rowLen.value) * HeapBuffer.cellHeight;
	}

	width() {
		return this.rowLen.value * HeapBuffer.cellWidth;
	}

	leftIdx(i: number) {
		return 2 * i + 1;
	}
	
	rightIdx(i: number) {
		return 2 * i + 2;
	}

	parentIdx(i: number) {
		return Math.floor((i - 1) / 2);
	}

	setXY(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	get top() {
		return this.y;
	}

	get bottom() {
		return this.y + this.height();
	}

	get left() {
		return this.x;
	}

	get right() {
		return this.x + this.width();
	}

	intersects(x: number, y: number, transform: Transform): boolean {
		const lowx = (this.x * transform.scale) + transform.x;
		const lowy = (this.y * transform.scale) + transform.y;
		const highx = lowx + (this.width() * transform.scale);
		const highy = lowy + (this.height() * transform.scale);
		return x >= lowx && x <= highx && y >= lowy && y <= highy;
	}
}

