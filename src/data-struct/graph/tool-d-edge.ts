import { setCanvasSize } from "../canvas";
import { EventState } from "../handler/event-handler";
import { CanvasHandler } from "../handler/canvas-handler";
import { ToolHandler } from "../handler/tool-handler";
import { ElementDEdge } from "./el-d-edge";
import { ElementGNode } from "./el-node";
import { DEdge } from "./element-types/d-edge";
import { GNode } from "./element-types/node";
import { panHandler } from "../handler/element-handler";
import { Playground } from "../handler/playground-handler";

export class ToolDEdge extends ToolHandler {
	constructor() {
		super();
	}

	startNode: ElementGNode | null = null;
	endNode: ElementGNode | null = null;

	isStartNode: boolean = false;

	edge: DEdge = new DEdge();

	pointerEnter(_state: EventState, canvas: CanvasHandler) {
		this.draw(canvas.toolCtx);
	}

	pointerLeave(_state: EventState, canvas: CanvasHandler) {
		setCanvasSize(canvas.toolCanvas, 0, 0);
	}

	reset(canvas: CanvasHandler) {
		this.startNode?.resetStyle();
		this.startNode = null;
		this.endNode?.resetStyle();
		this.endNode = null;
		canvas.redraw();
	}

	pointerDown(state: EventState, canvas: CanvasHandler) {
		const { x, y } = state.pointerDown;
		const gnode = canvas.findIntersectionOfType(x, y, [ElementGNode.name]) as ElementGNode;

		if(gnode === null) {
			panHandler.pointerDown(state, canvas);
			return;
		}

		const firstEdge = gnode.edges.v.first()?.v;

		if(firstEdge && firstEdge.constructor.name !== ElementDEdge.name) return;

		if(this.startNode !== null) {
			this.endNode = gnode;
		} else {
			this.startNode = gnode;
			this.isStartNode = true;
		}

		gnode.bg = "#FFFF00";
		gnode.color = "#000000";

		gnode.draw(canvas.ctx);
	}

	pointerUp(state: EventState, pgnd: Playground) {
		if(this.startNode === null) return;
		const canvas = pgnd.canvas;
		let { x, y } = state.pointerUp;

		if(this.isStartNode) {
			this.isStartNode = false;
			return;
		}

		if((this.endNode === null) && (x === state.pointerDown.x && y === state.pointerDown.y)) {
			this.reset(canvas);
			return;
		}

		if(this.endNode === null) return;

		if(this.endNode === this.startNode) {
			this.reset(canvas);
			return;
		}

		if(ElementGNode.hasDEdge(this.startNode, this.endNode)) {
			this.reset(canvas);
			return;
		}

		const edge = new ElementDEdge(this.startNode, this.endNode.ptr);

		this.reset(canvas);

		edge.rectify();

		canvas.addElements(edge);
		canvas.redraw();
	}

	rectifyStart() {
		if(this.startNode === null) return;

		const r = GNode.radius;
		const { x: x0, y: y0 } = this.startNode;
		const { x: x1, y: y1 } = this.edge.head;
		const { x: h, y: k } = this.startNode;

		const x1mx0 = x1 - x0;
		const y1my0 = y1 - y0;
		const x0mh = x0 - h;
		const y0mk = y0 - k;

		const a = x1mx0 * x1mx0 + y1my0 * y1my0; 
		const b = 2 * x1mx0 * x0mh + 2 * y1my0 * y0mk;
		const c = x0mh * 2 + y0mk * 2 - (r * r);

		const d = b * b - 4 * a * c;

		if(d < 0) return;
		
		// replaced + with - 
		//                   ---|
		//                      v
		const t = (2 * c) / (-b - Math.sqrt(d));
		const x = x1mx0 * t + x0;
		const y = y1my0 * t + y0;

		this.edge.tail = { x, y };
	}

	pointerMove(state: EventState, canvas: CanvasHandler) {
		if(this.endNode !== null || this.isStartNode) return;
		panHandler.pointerMove(state, canvas);
		if(this.startNode === null) {
			return;
		}

		const { x, y } = state.pointerMove;
		this.edge.head = { x: x - canvas.transform.x, y: y - canvas.transform.y };
		canvas.redraw();
		this.rectifyStart();
		this.edge.paint(canvas.ctx);
	}

	draw(_ctx: CanvasRenderingContext2D) {
	}
}
