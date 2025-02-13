import { EventState } from "../handler/event-handler";
import { CanvasHandler } from "../handler/canvas-handler";
import { ToolHandler } from "../handler/tool-handler";
import { panHandler } from "../handler/element-handler";
import { Playground } from "../handler/playground-handler";
import { ElementGNode } from "./el-node";
import { algorithmState, setShowToolBar } from "../components/refs";
import { setInfoPopupText } from "../global";
import astar from "./algorithms/astar";
import { Heuristics } from "./algorithms/heuristics";

export class ToolAstar extends ToolHandler {
	startNode: ElementGNode;
	heuristics: Heuristics;

	constructor(startNode: ElementGNode, heuristics: Heuristics) {
		super();
		this.startNode = startNode;
		this.heuristics = heuristics;
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

		astar.init(canvas, this.startNode, endNode, this.heuristics);
		algorithmState.setAlgorithm(astar);
		astar.tryPlay(canvas);
		pgnd.toolHandler = null;
	}

	pointerMove(state: EventState, canvas: CanvasHandler) {
		panHandler.pointerMove(state, canvas);
	}
}

export function setToolAstar(pgnd: Playground, startNode: ElementGNode, heuristics: Heuristics) {
	pgnd.elementHandler = null;
	pgnd.toolHandler = new ToolAstar(startNode, heuristics);

	setShowToolBar(false);
	setInfoPopupText("Select destination node");

	startNode.bg = "#ffff00";
	startNode.color = "#000000";
}

