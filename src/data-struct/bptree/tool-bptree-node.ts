import { GAP, setCanvasSize } from "../canvas";
import { EventState } from "../handler/event-handler";
import { ToolHandler } from "../handler/tool-handler";
import { ElementBptreeNode } from "./el-bptree-node";
import { BptreeNode } from "./element-types/node";
import { CanvasHandler } from "../handler/canvas-handler";
import { Playground } from "../handler/playground-handler";
import { ref } from "vue";

export const MAX_CHILDREN = ref<number>(4);

export class ToolBptreeNode extends ToolHandler {
	constructor() {
		super();
	}

	pointerEnter(_state: EventState, canvas: CanvasHandler) {
		setCanvasSize(canvas.toolCanvas, ToolBptreeNode.node.totalWidth, BptreeNode.cellHeight);
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

		x = Math.floor(x / GAP) * GAP - (ToolBptreeNode.node.totalWidth / 2);
		y = Math.floor(y / GAP) * GAP - (BptreeNode.cellHeight / 2);

		x += canvas.transform.x % GAP;
		y += canvas.transform.y % GAP;

		const { x: vx, y: vy } = canvas.toVirtualPosition(x, y);

		const node = new ElementBptreeNode(vx, vy, MAX_CHILDREN.value, true, null);
		canvas.addElements(node);
		pgnd.tryUnselectTool();
	}

	pointerMove(state: EventState, canvas: CanvasHandler) {
		let { x, y } = state.pointerMove;

		x = Math.floor(x / GAP) * GAP - (ToolBptreeNode.node.totalWidth / 2);
		y = Math.floor(y / GAP) * GAP - (BptreeNode.cellHeight / 2);

		x += canvas.transform.x % GAP;
		y += canvas.transform.y % GAP;

		canvas.toolCanvas.style.top = y + "px";
		canvas.toolCanvas.style.left = x + "px";
	}

	static node: BptreeNode;

	static setTool(v: number) {
		if(Number.isNaN(v) || !v || v <= 4) {
			v = 4;
		}

		if(v >= 128) {
			v = 128;
		}

		MAX_CHILDREN.value = v;

		this.node = new BptreeNode(MAX_CHILDREN.value, true);
		ToolBptreeNode.node.x = 0;
		ToolBptreeNode.node.y = 0;
	}

	static {
		this.setTool(MAX_CHILDREN.value);
	}

	draw(ctx: CanvasRenderingContext2D) {
		ToolBptreeNode.node.paint(ctx);
	}
}
