import { GAP, setCanvasSize } from "../canvas";
import { EventState } from "../handler/event-handler";
import { ToolHandler } from "../handler/tool-handler";
import { ElementHeapBuffer } from "./el-heap-buffer";
import { HeapBuffer } from "./element-types/buffer";
import { CanvasHandler } from "../handler/canvas-handler";
import { Playground } from "../handler/playground-handler";

export class ToolHeapBuffer extends ToolHandler {
	constructor() {
		super();
	}

	pointerEnter(_state: EventState, canvas: CanvasHandler) {
		setCanvasSize(canvas.toolCanvas, ToolHeapBuffer.node.width(), ToolHeapBuffer.node.height() + 18);
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

		x = Math.floor(x / GAP) * GAP - (ToolHeapBuffer.node.width() / 2);
		y = Math.floor(y / GAP) * GAP - (ToolHeapBuffer.node.height() / 2) + 18;

		x += canvas.transform.x % GAP;
		y += canvas.transform.y % GAP;

		x += canvas.transform.x % GAP;
		y += canvas.transform.y % GAP;

		const { x: vx, y: vy } = canvas.toVirtualPosition(x, y);

		const node = new ElementHeapBuffer(vx, vy);
		canvas.addElements(node);
		pgnd.tryUnselectTool();
	}

	pointerMove(state: EventState, canvas: CanvasHandler) {
		let { x, y } = state.pointerMove;

		x = Math.floor(x / GAP) * GAP - (ToolHeapBuffer.node.width() / 2);
		y = Math.floor(y / GAP) * GAP - (ToolHeapBuffer.node.height() / 2);

		x += canvas.transform.x % GAP;
		y += canvas.transform.y % GAP;

		canvas.toolCanvas.style.top = y + "px";
		canvas.toolCanvas.style.left = x + "px";
	}

	static node: HeapBuffer;

	static {
		this.node = new HeapBuffer(false);
		ToolHeapBuffer.node.x = 0;
		ToolHeapBuffer.node.y = 18;
	}

	draw(ctx: CanvasRenderingContext2D) {
		ToolHeapBuffer.node.paint(ctx);
	}
}
