import { EventState } from "../handler/event-handler";
import { CanvasHandler } from "../handler/canvas-handler";
import { ToolHandler } from "../handler/tool-handler";
import { panHandler } from "../handler/element-handler";
import { Playground } from "../handler/playground-handler";
import { ElementGNode } from "./el-node";
import { algorithmState, setShowToolBar } from "../components/refs";
import { setInfoPopupText } from "../global";
import dijkstra from "./algorithms/dijkstra";

export class ToolDijstra extends ToolHandler {
	startNode: ElementGNode;

	constructor(startNode: ElementGNode) {
		super();
		this.startNode = startNode;
	}

	pointerDown(state: EventState, canvas: CanvasHandler) {
		panHandler.pointerDown(state, canvas);
	}

	pointerUp(state: EventState, pgnd: Playground) {
		if(state.pointerDown.x !== state.pointerUp.x && state.pointerDown.y !== state.pointerUp.y) {
			return;
		}
		const canvas = pgnd.canvas;

		const endNode = canvas.findIntersectionOfType(
			state.pointerUp.x,
			state.pointerUp.y,
			[ElementGNode.name]
		) as ElementGNode | null;
		if(endNode === null) {
			return;
		}

		endNode.bg = "#0000ff";

		endNode.draw(canvas.ctx);

		setInfoPopupText("");

		dijkstra.init(this.startNode, endNode);
		algorithmState.setAlgorithm(dijkstra);
		dijkstra.tryPlay(canvas);
		pgnd.toolHandler = null;
	}

	pointerMove(state: EventState, canvas: CanvasHandler) {
		panHandler.pointerMove(state, canvas);
	}
}

export function setToolDijkstra(pgnd: Playground, startNode: ElementGNode) {
	pgnd.elementHandler = null;
	pgnd.toolHandler = new ToolDijstra(startNode);

	setShowToolBar(false);
	setInfoPopupText("Select destination node");

	startNode.bg = "#ffff00";
	startNode.color = "#000000";
}

