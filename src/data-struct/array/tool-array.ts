import { GAP, setCanvasSize } from "../canvas";
import { EventState } from "../handler/event-handler";
import { ToolHandler } from "../handler/tool-handler";
import { ElementArrayBuf } from "./el-array";
import { ArrayBuf } from "./element-types/array";
import { CanvasHandler } from "../handler/canvas-handler";
import { Playground } from "../handler/playground-handler";
import { ref } from "vue";

export const CAP = ref<number>(10);

export class ToolArrayBuf extends ToolHandler {
	constructor() {
		super();
	}

	pointerEnter(_state: EventState, canvas: CanvasHandler) {
		setCanvasSize(canvas.toolCanvas, ToolArrayBuf.array.width(), ToolArrayBuf.array.height());
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

		x = Math.floor(x / GAP) * GAP - (ArrayBuf.cellWidth * 5);
		y = Math.floor(y / GAP) * GAP - (ArrayBuf.cellHeight / 2);

		x += canvas.transform.x % GAP;
		y += canvas.transform.y % GAP;

		const { x: vx, y: vy } = canvas.toVirtualPosition(x, y);

		const array = new ElementArrayBuf(vx, vy, CAP.value);
		canvas.addElements(array);
		pgnd.tryUnselectTool();
	}

	pointerMove(state: EventState, canvas: CanvasHandler) {
		let { x, y } = state.pointerMove;

		x = Math.floor(x / GAP) * GAP - (ArrayBuf.cellWidth * 5);
		y = Math.floor(y / GAP) * GAP - (ArrayBuf.cellHeight / 2);

		x += canvas.transform.x % GAP;
		y += canvas.transform.y % GAP;

		canvas.toolCanvas.style.top = y + "px";
		canvas.toolCanvas.style.left = x + "px";
	}

	static array: ArrayBuf;

	static setTool(v: number) {
		if(Number.isNaN(v) || !v || v <= 1) {
			v = 1;
		}

		if(v >= 128) {
			v = 128;
		}

		CAP.value = v;

		this.array = new ArrayBuf(v, false);
		ToolArrayBuf.array.x = 0;
		ToolArrayBuf.array.y = 0;
	}

	static {
		this.setTool(CAP.value);
	}

	draw(ctx: CanvasRenderingContext2D) {
		ToolArrayBuf.array.paint(ctx);
	}
}
