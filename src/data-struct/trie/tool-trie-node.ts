import { GAP, setCanvasSize } from "../canvas";
import { EventState } from "../handler/event-handler";
import { ToolHandler } from "../handler/tool-handler";
import { ElementTrieNode } from "./el-trie-node";
import { TrieNode } from "./element-types/node";
import { CanvasHandler } from "../handler/canvas-handler";
import { Playground } from "../handler/playground-handler";

export class ToolTrieNode extends ToolHandler {
	constructor() {
		super();
	}

	pointerEnter(_state: EventState, canvas: CanvasHandler) {
		setCanvasSize(canvas.toolCanvas, TrieNode.diameter, TrieNode.diameter);
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

		x += canvas.transform.x % GAP;
		y += canvas.transform.y % GAP;

		const { x: vx, y: vy } = canvas.toVirtualPosition(x, y);

		const node = new ElementTrieNode(vx, vy, null);
		canvas.addElements(node);
		pgnd.tryUnselectTool();
	}

	pointerMove(state: EventState, canvas: CanvasHandler) {
		let { x, y } = state.pointerMove;

		x = Math.floor(x / GAP) * GAP - (TrieNode.radius);
		y = Math.floor(y / GAP) * GAP - (TrieNode.radius);

		x += canvas.transform.x % GAP;
		y += canvas.transform.y % GAP;

		canvas.toolCanvas.style.top = y + "px";
		canvas.toolCanvas.style.left = x + "px";
	}

	static node: TrieNode;

	static {
		this.node = new TrieNode("root");
		ToolTrieNode.node.x = TrieNode.radius;
		ToolTrieNode.node.y = TrieNode.radius;
	}

	draw(ctx: CanvasRenderingContext2D) {
		ToolTrieNode.node.paint(ctx);
	}
}
