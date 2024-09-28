import { GAP, setCanvasSize } from "../canvas";
import { EventState } from "../handler/event-handler";
import { CanvasHandler } from "../handler/canvas-handler";
import { ToolHandler } from "../handler/tool-handler";
import { ElementAdjMatrix } from "./el-adjmatrix";
import { AdjMatrix } from "./element-types/adjacency-matrix";
import { Playground } from "../handler/playground-handler";
import allocator from "../memory-allocator/allocator";

export class ToolAdjMatrix extends ToolHandler {
	constructor() {
		super();
	}

	pointerEnter(_state: EventState, canvas: CanvasHandler) {
		setCanvasSize(canvas.toolCanvas, ToolAdjMatrix.mat.width + GAP * 2 + 2, ToolAdjMatrix.mat.height + GAP * 2 + 2);
		canvas.toolCtx.scale(canvas.DPR, canvas.DPR);
		this.draw(canvas.toolCtx);
	}

	pointerLeave(_state: EventState, canvas: CanvasHandler) {
		setCanvasSize(canvas.toolCanvas, 0, 0);
	}

	pointerDown(_state: EventState, _canvas: CanvasHandler) {
	}

	pointerUp(state: EventState, pgnd: Playground) {
		if(
			state.pointerDown.y !== state.pointerUp.y ||
			state.pointerUp.x !== state.pointerDown.x
		) return;
		let { x, y } = state.pointerUp;
		const canvas = pgnd.canvas;

		x = Math.floor(x / GAP) * GAP - (ToolAdjMatrix.mat.width / 2);
		y = Math.floor(y / GAP) * GAP - (ToolAdjMatrix.mat.height / 2);

		x += canvas.transform.x % GAP;
		y += canvas.transform.y % GAP;

		const { x: vx, y: vy } = canvas.toVirtualPosition(x, y);

		const mat = new ElementAdjMatrix(vx + GAP * 2, vy + GAP * 2, ToolAdjMatrix.newAdjMatrix());
		canvas.addElements(mat);
		pgnd.tryUnselectTool();
	}

	static newAdjMatrix() {
		return [
			[0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0],
		]
	}

	pointerMove(state: EventState, canvas: CanvasHandler) {
		let { x, y } = state.pointerMove;

		x = Math.floor(x / GAP) * GAP - (ToolAdjMatrix.mat.width / 2);
		y = Math.floor(y / GAP) * GAP - (ToolAdjMatrix.mat.height / 2);

		x += canvas.transform.x % GAP;
		y += canvas.transform.y % GAP;

		canvas.toolCanvas.style.top = y + "px";
		canvas.toolCanvas.style.left = x + "px";
	}

	static mat;
	static {
		this.mat = new AdjMatrix(GAP * 2, GAP * 2, this.newAdjMatrix());
		allocator.resetExceptNull();
	}

	draw(ctx: CanvasRenderingContext2D) {
		ToolAdjMatrix.mat.paint(ctx);
	}
}
