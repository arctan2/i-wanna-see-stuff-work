import { circleFill } from "../../canvas";
import { Transform } from "../../handler/canvas-handler";
import allocator, { Ptr } from "../../memory-allocator/allocator";
import { List, PrimitiveSize } from "../../memory-allocator/types";

export const CELL_SIZE: number = 20;

export enum EventType {
	None,
	Move,
	AddingWalls,
	MovingSrc,
	MovingDest,
}

export enum CellType {
	Cell,
	Wall,
	Src,
	Dest,
	Path,
	Visited,
	AdjNode
}

export const CellColor = {
	[CellType.Cell]: "#ffffff",
	[CellType.Wall]: "#444444",
	[CellType.Src]: "#ff0000",
	[CellType.Dest]: "#0000ff",
	[CellType.Path]: "#00ff00",
	[CellType.Visited]: "#8d58c7",
	[CellType.AdjNode]: "#6f13d1",
}

export class Node {
	x: number;
	y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	get id() {
		return `${this.y}|${this.x}`;
	}
}

export class AdjMatrix {
	rows: number;
	columns: number;

	x: number;
	y: number;

	mat: Ptr<List<Ptr<List<CellType>>>>;

	borderColor = "#ffffff";

	src: Node = new Node(0, 0);
	dest: Node = new Node(0, 0);

	eventType: EventType = EventType.None;

	constructor(x: number, y: number, arr: Array<Array<number>>) {
		let mat = List.new(arr.map(row => {
			return List.new(row, PrimitiveSize.Int);
		}), Ptr.Size);

		this.mat = mat;
		this.rows = mat.v.length;
		this.columns = mat.v.at(0)?.v.length || 0;

		this.x = x;
		this.y = y;

		this.setDestXY(1, 1);
		this.setSrcXY(0, 0);
	}

	setDestXY(x: number, y: number) {
		this.setCell(this.dest.y, this.dest.x, CellType.Cell);
		this.dest.x = x;
		this.dest.y = y;
		this.setCell(this.dest.y, this.dest.x, CellType.Dest);
	}

	setSrcXY(x: number, y: number) {
		this.setCell(this.src.y, this.src.x, CellType.Cell);
		this.src.x = x;
		this.src.y = y;
		this.setCell(this.src.y, this.src.x, CellType.Src);
	}

	at(y: number, x: number) {
		return this.mat.v.at(y)?.v.at(x);
	}

	setCell(row: number, col: number, val: CellType) {
		this.mat.v.at(row)?.v.setAt(col, val);
	}

	renderCell(ctx: CanvasRenderingContext2D, x: number, y: number) {
		ctx.fillStyle = CellColor[this.at(y, x) || 0];
		ctx.fillRect(
			this.gridLeft + x * CELL_SIZE,
			this.gridTop + y * CELL_SIZE,
			CELL_SIZE - 2,
			CELL_SIZE - 2
		);
	}

	resetCells(ctx: CanvasRenderingContext2D) {
		let x;
		let y = this.y + 1 + CELL_SIZE;

		for(let i = 0; i < this.rows; i++, y += CELL_SIZE) {
			x = this.x + 1 + CELL_SIZE;
			for(let j = 0; j < this.columns; j++, x += CELL_SIZE) {
				const cell = this.at(i, j);
				if(cell === CellType.Visited || cell === CellType.Path || cell === CellType.AdjNode) {
					this.setCell(i, j, CellType.Cell);
				}
				ctx.fillStyle = CellColor[this.at(i, j) || 0];
				ctx.fillRect(x, y, CELL_SIZE - 2, CELL_SIZE - 2);
			}
		}

		this.renderSrcDest(ctx);
	}

	clearCells(ctx: CanvasRenderingContext2D) {
		let x;
		let y = this.y + 1 + CELL_SIZE;

		for(let i = 0; i < this.rows; i++, y += CELL_SIZE) {
			x = this.x + 1 + CELL_SIZE;
			for(let j = 0; j < this.columns; j++, x += CELL_SIZE) {
				const cell = this.at(i, j);

				if(cell !== CellType.Src && cell !== CellType.Dest) {
					this.setCell(i, j, CellType.Cell);
				}

				ctx.fillStyle = CellColor[this.at(i, j) || 0];
				ctx.fillRect(x, y, CELL_SIZE - 2, CELL_SIZE - 2);
			}
		}

		this.renderSrcDest(ctx);
	}

	setRows(rows: number) {
		if(rows > this.rows) {
			this.rows = rows;

			for(let i = this.mat.v.length; i < rows; ++i) {
				const newRowPtr = List.new(new Array(this.columns).fill(0), PrimitiveSize.Int);
				this.mat.v.setAt(i, newRowPtr);
			}
		} else {
			this.rows = Math.max(2, rows);
			for(let i = this.rows; i < this.mat.v.length; i++) {
				const rowListPtr = this.mat.v.at(i);
				allocator.free(rowListPtr as Ptr<List<CellType>>);
			}

			this.mat.v.setLength(rows);

			const lastIdx = rows - 1;

			if(this.src.y >= rows) {
				this.src.y = lastIdx;
				this.setCell(lastIdx, this.src.x, CellType.Src);
			}
			if(this.dest.y >= rows) {
				this.dest.y = lastIdx;
				this.setCell(lastIdx, this.dest.x, CellType.Dest);
			}
		}
	}

	setColumns(columns: number) {
		if(columns > this.columns) {
			for(let rowListPtr of this.mat.v.list()) {
				rowListPtr.v.push(...new Array(columns - this.columns).fill(CellType.Cell));
			}
			this.columns = columns;
		} else {
			this.columns = Math.max(2, columns);
			for(let rowListPtr of this.mat.v.list()) {
				rowListPtr.v.setLength(this.columns);
			}

			const lastIdx = columns - 1;

			if(this.src.x >= columns) {
				this.src.x = lastIdx;
				this.setCell(this.src.y, lastIdx, CellType.Src);
			}
			if(this.dest.x >= columns) {
				this.dest.x = lastIdx;
				this.setCell(this.dest.y, lastIdx, CellType.Dest);
			}
		}
	}

	paint(ctx: CanvasRenderingContext2D) {
		const left = this.left;
		const top = this.top;
		// border
		ctx.strokeStyle = this.borderColor;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.roundRect(left, top, this.width, this.height, 5);
		ctx.stroke();

		// display dimensions
		const dimStr = `${this.rows}x${this.columns}`;
		const strH = 12;
		const strW = dimStr.length * strH;

		ctx.beginPath();
		ctx.fillStyle = "#7703fc";
		ctx.roundRect(left - strW / 2, top - strH / 2 - 4, strW, 18, 4);
		ctx.fill();

		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
		ctx.font = `${strH}px monospace`;
		ctx.fillStyle = "#ffffff";
		ctx.fillText(dimStr, this.x, this.y);

		// draw cells
		let x;
		let y = this.y + 1 + CELL_SIZE;

		for(let i = 0; i < this.rows; i++, y += CELL_SIZE) {
			x = this.x + 1 + CELL_SIZE;
			for(let j = 0; j < this.columns; j++, x += CELL_SIZE) {
				ctx.fillStyle = CellColor[this.at(i, j) || 0];
				ctx.fillRect(x, y, CELL_SIZE - 2, CELL_SIZE - 2);
			}
		}

		// this.debugInfo(ctx);

		this.renderSrcDest(ctx);
	}

	debugInfo(ctx: CanvasRenderingContext2D) {
		let y = this.y + CELL_SIZE;
		let x = this.x;

		ctx.fillStyle = "#ffffff";

		for(let i = 0; i < this.rows; i++, y += CELL_SIZE) {
			ctx.textBaseline = "middle";
			ctx.textAlign = "center";
			ctx.font = `14px monospace`;
			ctx.fillText(String(i), x + CELL_SIZE / 2, y + CELL_SIZE / 2);
		}

		y = this.y;
		x = this.x + CELL_SIZE;

		for(let i = 0; i < this.columns; i++, x += CELL_SIZE) {
			ctx.textBaseline = "middle";
			ctx.textAlign = "center";
			ctx.font = `14px monospace`;
			ctx.fillText(String(i), x + CELL_SIZE / 2, y + CELL_SIZE / 2);
		}
	}

	renderSrcDest(ctx: CanvasRenderingContext2D) {
		const HCELL_SIZE = (CELL_SIZE - 2) / 2;

		// src
		this.setCell(this.src.y, this.src.x, CellType.Cell);
		this.renderCell(ctx, this.src.x, this.src.y);

		this.setCell(this.src.y, this.src.x, CellType.Src);
		ctx.fillStyle = CellColor[this.at(this.src.y, this.src.x) || 0];

		let sx = this.gridLeft + (this.src.x * CELL_SIZE);
		let sy = this.gridTop + (this.src.y * CELL_SIZE);

		ctx.beginPath();
		ctx.lineWidth = 2;
		ctx.moveTo(sx + 2, sy + 2);
		ctx.lineTo(sx + 2, sy + CELL_SIZE - 4);
		ctx.lineTo(sx + CELL_SIZE - 2, sy + HCELL_SIZE);
		ctx.closePath();
		ctx.fill();

		// dest

		this.setCell(this.dest.y, this.dest.x, CellType.Cell);
		this.renderCell(ctx, this.dest.x, this.dest.y);

		this.setCell(this.dest.y, this.dest.x, CellType.Dest);
		ctx.fillStyle = CellColor[this.at(this.dest.y, this.dest.x) || 0];
		circleFill(
			ctx,
			this.gridLeft + this.dest.x * CELL_SIZE + HCELL_SIZE,
			this.gridTop + this.dest.y * CELL_SIZE + HCELL_SIZE,
			HCELL_SIZE - 1,
		);
	}

	resetStyle() {
		this.borderColor = "#ffffff";
	}

	setXY(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	get width() { return this.columns * CELL_SIZE + CELL_SIZE * 2; }

	get height() { return this.rows * CELL_SIZE + CELL_SIZE * 2; }
	
	get top() { return this.y; }

	get bottom() { return this.y + this.height + CELL_SIZE * 2; }

	get left() { return this.x; }

	get right() { return this.x + this.width + CELL_SIZE * 2; }

	get gridTop() { return this.y + CELL_SIZE + 1; }

	get gridBottom() { return this.y + CELL_SIZE + 1 + this.rows * CELL_SIZE; }

	get gridLeft() { return this.x + CELL_SIZE + 1; }

	get gridRight() { return this.x + CELL_SIZE + 1 + this.columns * CELL_SIZE; }

	intersects(x: number, y: number, transform: Transform): boolean {
		const left = this.x + transform.x;
		const top = this.y + transform.y;
		const right = left + this.width;
		const bottom = top + this.height;

		const isIntersect = x >= left && x <= right && y >= top && y <= bottom; 

		if(!isIntersect) {
			return false;
		}

		const relMouseX = x - this.gridLeft - transform.x;
		const relMouseY = y - this.gridTop - transform.y;

		const isIntersectGrid = (
			(relMouseX >= 0 && relMouseX <= this.columns * (CELL_SIZE)) &&
			(relMouseY >= 0 && relMouseY <= this.rows * (CELL_SIZE))
		);

		if(isIntersectGrid) {
			const sTop = this.src.y * CELL_SIZE;
			const sLeft = this.src.x * CELL_SIZE;
			const dTop = this.dest.y * CELL_SIZE;
			const dLeft = this.dest.x * CELL_SIZE;

			if(
				(relMouseX >= sLeft && relMouseX <= sLeft + CELL_SIZE) &&
				(relMouseY >= sTop && relMouseY <= sTop + CELL_SIZE)
			) {
				this.eventType = EventType.MovingSrc;
			} else if(
				(relMouseX >= dLeft && relMouseX <= dLeft + CELL_SIZE) &&
				(relMouseY >= dTop && relMouseY <= dTop + CELL_SIZE)
			) {
				this.eventType = EventType.MovingDest;
			} else {
				this.eventType = EventType.AddingWalls;
			}
		} else {
			this.eventType = EventType.Move;
		}

		return true;
	}
}
