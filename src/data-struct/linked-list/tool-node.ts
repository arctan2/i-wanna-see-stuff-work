import { GAP, circleFill, setCanvasSize } from "../canvas";
import { randInt } from "../utils";
import { EventState } from "../handler/event-handler";
import { ToolHandler } from "../handler/tool-handler";
import { ElementLLNode } from "./el-node";
import { Arrow } from "./element-types/arrow";
import { LLNode } from "./element-types/node";
import { CanvasHandler } from "../handler/canvas-handler";
import { Playground } from "../handler/playground-handler";
import allocator from "../memory-allocator/allocator";

export class ToolLLNode extends ToolHandler {
	constructor() {
		super();
	}

	pointerEnter(_state: EventState, canvas: CanvasHandler) {
		setCanvasSize(canvas.toolCanvas, LLNode.width * 4, LLNode.height * 4);
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

		x = Math.floor(x / GAP) * GAP - LLNode.halfWidth;
		y = Math.floor(y / GAP) * GAP - LLNode.halfHeight;

		x += canvas.transform.x % GAP;
		y += canvas.transform.y % GAP;

		const { x: vx, y: vy } = canvas.toVirtualPosition(x, y);

		const node = new ElementLLNode(vx, vy, String(randInt(11, 99)));
		canvas.addElements(node, node.arrow);
		pgnd.tryUnselectTool();
	}

	pointerMove(state: EventState, canvas: CanvasHandler) {
		let { x, y } = state.pointerMove;

		x = Math.floor(x / GAP) * GAP - LLNode.halfWidth;
		y = Math.floor(y / GAP) * GAP - LLNode.halfHeight;

		x += canvas.transform.x % GAP;
		y += canvas.transform.y % GAP;

		canvas.toolCanvas.style.top = y + "px";
		canvas.toolCanvas.style.left = x + "px";
	}

	static node;

	static {
		this.node = new LLNode("");
		allocator.resetExceptNull();
		ToolLLNode.node.x = 0;
		ToolLLNode.node.y = 0;
	}

	draw(ctx: CanvasRenderingContext2D) {
		ToolLLNode.node.paint(ctx);

		const x = LLNode.width - (GAP * 3);
		const c = Arrow.pointingColor;
		circleFill(ctx, (x + LLNode.width) / 2, (0 + LLNode.height) / 2, 4, c);
	}
}
