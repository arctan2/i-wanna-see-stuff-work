import { ShallowRef, shallowRef } from "vue";
import { GAP } from "../../canvas";
import { Transform } from "../../handler/canvas-handler";
import { Arr, PrimitiveSize } from "../../memory-allocator/types";
import { Ptr } from "../../memory-allocator/allocator";
import { getContrastFg } from "../../utils";

export class BtreeNode {
	static cellWidth = GAP * 9;
	static cellHeight = GAP * 4;
	static borderWidth = 3;
	static nodeBg = "#0095ff";
	static cellBg = "#8fc9f2";

	M: number;
	T: number;

	curKeyCount: ShallowRef<number>;
	keys: Ptr<Arr<number>>;
	isLeaf: ShallowRef<boolean>;

	bg: string = "";

	keysBg: Array<string> = [];

	totalWidth: number;
	totalWidthHalf: number;

	x = -1;
	y = -1;

	constructor(M: number, isLeaf: boolean, dontAlloc?: boolean) {
		this.M = M;
		this.T = Math.ceil(M / 2);
		this.curKeyCount = shallowRef(0);

		if(dontAlloc === false) {
			this.keys = new Ptr(0, 0, new Arr(new Array<number>(M - 1).fill(0)));
		} else {
			this.keys = Arr.new(new Array<number>(M - 1).fill(0), PrimitiveSize.Int);
		}

		this.isLeaf = shallowRef(isLeaf);

		this.totalWidth = (M - 1) * BtreeNode.cellWidth;
		this.totalWidthHalf = this.totalWidth / 2;
		this.resetStyle();
	}

	defaultCellColor(bg: string) {
		const r = Math.round(parseInt(bg.slice(1, 3), 16) * 0.7);
		const g = Math.round(parseInt(bg.slice(3, 5), 16) * 0.7);
		const b = Math.round(parseInt(bg.slice(5, 7), 16) * 0.7);

		return `rgb(${r}, ${g}, ${b})`;
	}

	resetStyle() {
		this.bg = BtreeNode.nodeBg;
		this.keysBg = new Array(this.M - 1).fill(BtreeNode.cellBg);
	}

	drawBorder(ctx: CanvasRenderingContext2D, color: string) {
		ctx.strokeStyle = color;
		ctx.lineWidth = BtreeNode.borderWidth;
		const wb2 = ctx.lineWidth / 2;
		ctx.beginPath();
		ctx.roundRect(this.x - wb2, this.y - wb2, this.totalWidth + ctx.lineWidth, BtreeNode.cellHeight + ctx.lineWidth, 4);
		ctx.stroke();
		ctx.restore();
	}

	drawBg(ctx: CanvasRenderingContext2D) {
		const { x, y } = this;

		ctx.fillStyle = this.bg;
		ctx.fillRect(x, y, this.totalWidth, BtreeNode.cellHeight);
		this.drawBorder(ctx, this.bg);
	}

	drawCell(ctx: CanvasRenderingContext2D, idx: number) {
		const { x, y } = this;

		const pad = 3;
		const padb2 = pad / 2;

		const curX = (BtreeNode.cellWidth * idx) + padb2;

		ctx.beginPath();
		ctx.fillStyle = this.keysBg[idx];
		ctx.roundRect(x + curX, y + padb2, BtreeNode.cellWidth - pad, BtreeNode.cellHeight - pad, 4);
		ctx.fill();
		ctx.restore();

		if(idx >= this.curKeyCount.value) {
			return;
		}

		ctx.fillStyle = getContrastFg(this.keysBg[idx]);
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
		ctx.font = "16px monospace";

		let text = String(this.keys.v.arr[idx]);
		
		ctx.fillText(text, x + curX + (BtreeNode.cellWidth / 2) - pad, (this.top + this.bottom) / 2);
	}

	paint(ctx: CanvasRenderingContext2D) {
		this.drawBg(ctx);

		for(let i = 0; i < this.M - 1; i++) {
			this.drawCell(ctx, i);
		}
	}

	setXY(x: number, y: number) {
		this.x = x;
		this.y = y;
	}
	
	get top() {
		return this.y;
	}

	get bottom() {
		return this.y + BtreeNode.cellHeight;
	}

	get left() {
		return this.x;
	}

	get right() {
		return this.x + this.totalWidth;
	}

	intersects(x: number, y: number, transform: Transform): boolean {
		const lowx = (this.x * transform.scale) + transform.x;
		const lowy = (this.y * transform.scale) + transform.y;
		const highx = lowx + (this.totalWidth * transform.scale);
		const highy = lowy + (BtreeNode.cellHeight * transform.scale);
		return x >= lowx && x <= highx && y >= lowy && y <= highy;
	}
}

