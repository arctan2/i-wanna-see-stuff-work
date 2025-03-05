import { GAP } from "../../canvas";
import { getContrastFg } from "../../utils";
import { List, PrimitiveSize } from "../../memory-allocator/types";
import { Ptr } from "../../memory-allocator/allocator";
import { Ref, ref } from "vue";
import { Transform } from "../../handler/canvas-handler";

export class HeapNode {
	public static radius = GAP * 3;
	public static diameter = HeapNode.radius * 2;

	bg: string;
	x: number;
	y: number;
	idx: number;

	constructor(bg: string, x: number, y: number, idx: number) {
		this.bg = bg;
		this.x = x
		this.y = y
		this.idx = idx;
	}

	resetStyle() {
		this.bg = HeapBuffer.bg;
	}
}

export function minCmpFn(a: number, b: number) { return a < b }
export function maxCmpFn(a: number, b: number) { return a > b }

export class HeapBuffer {
	public static cellWidth = GAP * 6;
	public static cellHeight = GAP * 3;
	static borderWidth = 3;
	static fontSize = 12;
	static bg = "#40f5e0";
	static cellStrokeColor = "#003b34";

	cmpFn: (a: number, b: number) => boolean = maxCmpFn;

	buf: Ptr<List<number>>;

	rowLen: Ref<number>;

	nodesStyles: HeapNode[];

	borderColor: string = "";

	x = -1;
	y = -1;

	constructor(alloc?: boolean) {
		if(alloc === false) {
			this.buf = new Ptr(0, 0, new List([], 30, 1, false, "number"));
		} else {
			this.buf = List.new([], PrimitiveSize.Int, 30, "number");
		}

		this.rowLen = ref(10);
		this.nodesStyles = [];
		this.resetStyle();
	}

	setAsMinHeap() {
		this.cmpFn = minCmpFn;
	}

	setAsMaxHeap() {
		this.cmpFn = maxCmpFn;
	}

	checkNodesStylesSize() {
		const diff = this.buf.v.length - this.nodesStyles.length;
		if(diff > 0) {
			for(let i = 0; i < diff; i++) {
				this.nodesStyles.push(new HeapNode(HeapBuffer.bg, 0, 0, this.nodesStyles.length));
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

		ctx.lineWidth = 1;
		ctx.strokeStyle = HeapBuffer.cellStrokeColor;
		ctx.strokeRect(x, y, HeapBuffer.cellWidth, HeapBuffer.cellHeight);

		if(idx < this.buf.v.list().length) {
			ctx.fillStyle = getContrastFg(this.nodesStyles[idx].bg);
			ctx.textBaseline = "middle";
			ctx.textAlign = "center";
			ctx.font = `${HeapBuffer.fontSize}px monospace`;

			let text = String(this.buf.v.list()[idx]);
			
			ctx.fillText(text, x + (HeapBuffer.cellWidth / 2), y + HeapBuffer.cellHeight / 2);
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

		this.checkNodesStylesSize();
		for(let i = 0; i < this.buf.v.arrPtr.v.cap; i++) {
			this.drawCellAtIdx(ctx, i);
		}
	}

	height() {
		return Math.ceil(this.buf.v.arrPtr.v.cap / this.rowLen.value) * HeapBuffer.cellHeight;
	}

	width() {
		return this.rowLen.value * HeapBuffer.cellWidth;
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

export const gapX = HeapNode.diameter;
export const gapY = HeapNode.diameter + HeapNode.radius;

