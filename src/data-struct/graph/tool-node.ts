import { GAP, setCanvasSize } from "../canvas";
import { randInt } from "../utils";
import { EventState } from "../handler/event-handler";
import { CanvasHandler } from "../handler/canvas-handler";
import { ToolHandler } from "../handler/tool-handler";
import { ElementGNode } from "./el-node";
import { GNode } from "./element-types/node";
import { Playground } from "../handler/playground-handler";
import allocator from "../memory-allocator/allocator";

export class ToolGNode extends ToolHandler {
	constructor() {
		super();
	}

	pointerEnter(_state: EventState, canvas: CanvasHandler) {
		setCanvasSize(canvas.toolCanvas, GNode.radius * 2, GNode.radius * 2);
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

		x = Math.floor(x / GAP) * GAP;
		y = Math.floor(y / GAP) * GAP;

		x += canvas.transform.x % GAP;
		y += canvas.transform.y % GAP;

		const { x: vx, y: vy } = canvas.toVirtualPosition(x, y);

		const node = new ElementGNode(vx, vy, String(randInt(1, 500)));
		canvas.addElements(node);
		pgnd.tryUnselectTool();
	}

	pointerMove(state: EventState, canvas: CanvasHandler) {
		let { x, y } = state.pointerMove;

		x = Math.floor(x / GAP) * GAP - GNode.radius;
		y = Math.floor(y / GAP) * GAP - GNode.radius;

		x += canvas.transform.x % GAP;
		y += canvas.transform.y % GAP;

		canvas.toolCanvas.style.top = y + "px";
		canvas.toolCanvas.style.left = x + "px";
	}

	static node;

	static {
		this.node = new GNode("");
		allocator.resetExceptNull();
		ToolGNode.node.x = GNode.radius;
		ToolGNode.node.y = GNode.radius;
	}

	draw(ctx: CanvasRenderingContext2D) {
		ToolGNode.node.paint(ctx);
	}
}
