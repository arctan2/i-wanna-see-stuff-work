import { GAP, setCanvasSize } from "../canvas";
import { EventState } from "../handler/event-handler";
import { ToolHandler } from "../handler/tool-handler";
import { ElementBtreeNode } from "./el-btree-node";
import { BtreeNode } from "./element-types/node";
import { CanvasHandler } from "../handler/canvas-handler";
import { Playground } from "../handler/playground-handler";
import { ref } from "vue";

export const MAX_CHILDREN = ref<number>(4);

export class ToolBtreeNode extends ToolHandler {
	constructor() {
		super();
	}

	pointerEnter(_state: EventState, canvas: CanvasHandler) {
		setCanvasSize(canvas.toolCanvas, ToolBtreeNode.node.totalWidth, BtreeNode.cellHeight);
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

		x = Math.floor(x / GAP) * GAP - (ToolBtreeNode.node.totalWidth / 2);
		y = Math.floor(y / GAP) * GAP - (BtreeNode.cellHeight / 2);

		x += canvas.transform.x % GAP;
		y += canvas.transform.y % GAP;

		const { x: vx, y: vy } = canvas.toVirtualPosition(x, y);

		const node = new ElementBtreeNode(vx, vy, MAX_CHILDREN.value, true, null);
		canvas.addElements(node);
		pgnd.tryUnselectTool();
	}

	pointerMove(state: EventState, canvas: CanvasHandler) {
		let { x, y } = state.pointerMove;

		x = Math.floor(x / GAP) * GAP - (ToolBtreeNode.node.totalWidth / 2);
		y = Math.floor(y / GAP) * GAP - (BtreeNode.cellHeight / 2);

		x += canvas.transform.x % GAP;
		y += canvas.transform.y % GAP;

		canvas.toolCanvas.style.top = y + "px";
		canvas.toolCanvas.style.left = x + "px";
	}

	static node: BtreeNode;

	static setTool(v: number) {
		if(Number.isNaN(v) || !v || v <= 4) {
			v = 4;
		}

		if(v >= 128) {
			v = 128;
		}

		MAX_CHILDREN.value = v;

		this.node = new BtreeNode(MAX_CHILDREN.value, true, false);
		ToolBtreeNode.node.x = 0;
		ToolBtreeNode.node.y = 0;
	}

	static {
		this.setTool(MAX_CHILDREN.value);
	}

	draw(ctx: CanvasRenderingContext2D) {
		ToolBtreeNode.node.paint(ctx);
	}
}
