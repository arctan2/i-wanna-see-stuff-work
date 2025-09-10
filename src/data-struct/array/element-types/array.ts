import { Ref, ref } from "vue";
import { GAP } from "../../canvas";
import { Transform } from "../../handler/canvas-handler";
import { getContrastFg } from "../../utils";
import { Arr, PrimitiveSize } from "../../memory-allocator/types";
import { Ptr } from "../../memory-allocator/allocator";

export class ArrayBuf {
	public static cellWidth = GAP * 6;
	public static cellHeight = GAP * 3;
	static borderWidth = 3;
	static fontSize = 12;
	static bg = "#4772ff";
	static cellStrokeColor = "#9e9e9e";
	static spikesContainerHeight = GAP * 20;
	static spikesContainerOffsetBottom = GAP * 2;
	static spikesContainerBg = "#404040";
	static spikesGapPx = 2;

	bg: string = "";

	borderColor: string = "";

	arr: Ptr<Arr<number>>;
	rowLen: Ref<number>;
	cellBg: string[];
	spikeWidth: number = 0;

	x = -1;
	y = -1;

	constructor(cap: number, alloc?: boolean) {
		if(alloc === false) {
			this.arr = new Ptr(0, 0, new Arr<number>([], cap, "number"));
		} else {
			this.arr = Arr.new([] as number[], PrimitiveSize.Int, cap, "number");
		}

		this.rowLen = ref(10);
		this.cellBg = new Array(cap).fill("");
		this.resetStyle();
		this.calcSpikeWidth();
	}

	calcSpikeWidth() {
		let n = this.arr.v.arr.length;
		if(n === 0) {
			this.spikeWidth = 0;
		} else {
			this.spikeWidth = (this.width() - (ArrayBuf.spikesGapPx * n)) / n;
		}
	}

	defaultCellColor(bg: string) {
		const r = Math.round(parseInt(bg.slice(1, 3), 16) * 0.7);
		const g = Math.round(parseInt(bg.slice(3, 5), 16) * 0.7);
		const b = Math.round(parseInt(bg.slice(5, 7), 16) * 0.7);

		return `rgb(${r}, ${g}, ${b})`;
	}

	resetStyle() {
		for(let i = 0; i < this.cellBg.length; i++) {
			this.cellBg[i] = ArrayBuf.bg;
		}
		this.borderColor = "";
		return this;
	}

	drawCellAtIdx(ctx: CanvasRenderingContext2D, idx: number) {
		if(idx < 0) return;
		const row = Math.floor(idx / this.rowLen.value);
		const col = (idx % this.rowLen.value);

		const x = this.x + (col * ArrayBuf.cellWidth);
		const y = this.y + (row * ArrayBuf.cellHeight);

		const cellValue = this.arr.v.arr[idx];

		if(idx < this.arr.v.arr.length) {
			const s = this.cellBg[idx];

			ctx.fillStyle = s;
			ctx.fillRect(x, y, ArrayBuf.cellWidth, ArrayBuf.cellHeight);

			ctx.fillStyle = getContrastFg(s);
			ctx.textBaseline = "middle";
			ctx.textAlign = "center";
			ctx.font = `${ArrayBuf.fontSize}px monospace`;

			let text = String(cellValue);
			
			ctx.fillText(text, x + (ArrayBuf.cellWidth / 2), y + ArrayBuf.cellHeight / 2);

			const spikeHeight = (ArrayBuf.spikesContainerHeight * (cellValue / ArrayBuf.spikesContainerHeight));
			const spikeX = this.x + (idx * this.spikeWidth) + (idx * ArrayBuf.spikesGapPx);
			const spikeY = this.y - ArrayBuf.spikesContainerOffsetBottom - spikeHeight;

			ctx.fillStyle = ArrayBuf.spikesContainerBg;
			ctx.fillRect(
				spikeX - 1,
				this.y - ArrayBuf.spikesContainerHeight - ArrayBuf.spikesContainerOffsetBottom,
				this.spikeWidth + 2,
				ArrayBuf.spikesContainerHeight
			);

			ctx.fillStyle = s;
			ctx.fillRect(spikeX, spikeY, this.spikeWidth, spikeHeight);
		}
		ctx.lineWidth = 1;
		ctx.strokeStyle = ArrayBuf.cellStrokeColor;
		ctx.strokeRect(x, y, ArrayBuf.cellWidth, ArrayBuf.cellHeight);

		// display dimensions
		const dimStr = `array: { cap: ${this.arr.v.cap}, len: ${this.arr.v.arr.length} }`;
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

	paint(ctx: CanvasRenderingContext2D) {
		const { x, y } = this;

		ctx.fillStyle = ArrayBuf.bg;
		ctx.roundRect(x, y, this.rowLen.value * ArrayBuf.cellWidth, this.height(), 4);
		ctx.fill();

		ctx.fillStyle = ArrayBuf.spikesContainerBg;
		ctx.fillRect(
			x,
			y - ArrayBuf.spikesContainerOffsetBottom - ArrayBuf.spikesContainerHeight,
			this.width(),
			ArrayBuf.spikesContainerHeight
		);

		for(let i = 0; i < this.arr.v.cap; i++) {
			this.drawCellAtIdx(ctx, i);
		}

		ctx.beginPath();
			if(this.borderColor) {
				const pad = 2;
				ctx.roundRect(x - pad, y - pad, (this.rowLen.value * ArrayBuf.cellWidth) + (pad * 2), this.height() + (pad * 2), 4);
				ctx.lineWidth = ArrayBuf.borderWidth;
				ctx.strokeStyle = this.borderColor;
				ctx.stroke();
			}
		ctx.restore();
	}

	height() {
		return Math.ceil(this.arr.v.cap / this.rowLen.value) * ArrayBuf.cellHeight;
	}

	width() {
		return this.rowLen.value * ArrayBuf.cellWidth;
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

