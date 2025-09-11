import { Ref, ref } from "vue";
import { AlgorithmHandler } from "../../algorithm-handler";
import { CanvasHandler } from "../../handler/canvas-handler.ts";
import { ElementGNode } from "../el-node.ts";
import { ElementUEdge } from "../el-u-edge.ts";
import { setErrorPopupText } from "../../global.ts";
import { ElementDEdge } from "../el-d-edge.ts";
import { euclidian, chebyshevDistance, octileDistance, manhattan, Heuristics } from "./heuristics.ts";
import { PriorityQueue } from "./adjmatrix/common.ts";

enum Color {
	shortPath = "#00ff00",
	curNode = "#0000ff",
	visited = "#c7fccc",
	compare = "#ffff00"
};

class DistValue { 
	g: number = Infinity;
	f: number = Infinity;
	prev: ElementGNode | null;
	prevEdge: ElementUEdge | ElementDEdge | null;

	constructor(prev: ElementGNode | null, prevEdge: ElementDEdge | ElementUEdge | null, f: number, g: number) {
		this.f = f;
		this.g = g;
		this.prev = prev;
		this.prevEdge = prevEdge;
	}
};

class Astar extends AlgorithmHandler {
	startNode: null | ElementGNode = null;
	endNode: null | ElementGNode = null;
	distanceTable: Ref<Map<ElementGNode, DistValue>> = ref(new Map());
	curHeuristics: Heuristics = Heuristics.Euclidian;

	init(canvas: CanvasHandler, startNode: ElementGNode, endNode: ElementGNode, heuristics: Heuristics) {
		this.startNode = startNode;
		this.endNode = endNode;
		this.distanceTable.value = new Map<ElementGNode, DistValue>();
		this.curHeuristics = heuristics;
		this.initGenerator(canvas);
	}

	uninit(_canvas: CanvasHandler) {
	}

	cleanup(canvas: CanvasHandler) {
		for(let [node] of this.distanceTable.value) {
			node.resetStyle();
			node.draw(canvas.ctx);
			node.edges.v.list().forEach((e) => {
				if(e.v.bg !== "#ffffff") {
					e.v.bg = "#ffffff";
					e.v.draw(canvas.ctx);
				}
			});
		}
	}

	forceStop(canvas: CanvasHandler): void {
		super.forceStop(canvas);
		this.cleanup(canvas);
	}

	*finalPath(canvas: CanvasHandler, endNode: ElementGNode) {
		let distanceTable = this.distanceTable;

		let temp = distanceTable.value.get(endNode);
		if(!temp?.prev) {
			setErrorPopupText("The node is not reachable from the source node.");
			return;
		}

		endNode.setStyle(Color.shortPath, "#000000").draw(canvas.ctx);

		while(temp?.prev && temp.prevEdge) {
			temp.prev.bg = Color.shortPath;
			temp.prevEdge.bg = Color.shortPath;

			temp.prevEdge.draw(canvas.ctx);
			yield;
			temp.prev.draw(canvas.ctx);
			yield;

			temp = distanceTable.value.get(temp.prev);
		}
	}


	heuristics(node: ElementGNode, dest: ElementGNode) {
		switch(this.curHeuristics) {
			case Heuristics.Manhattan:
				return manhattan(node, dest);
			case Heuristics.Euclidian:
				return euclidian(node, dest);
			case Heuristics.OctileDistance:
				return octileDistance(node, dest);
			case Heuristics.ChebyshevDistance:
				return chebyshevDistance(node, dest);
		}
	}

	*astar(startNode: ElementGNode, endNode: ElementGNode, canvas: CanvasHandler) {
		let minQueue = new PriorityQueue<ElementGNode>();
		let distanceTable = this.distanceTable;

		let visited = new Set<ElementGNode>();

		let f = this.heuristics(startNode, endNode);

		distanceTable.value.set(
			startNode,
			new DistValue(null, null, f, 0)
		);
		minQueue.insert(f, startNode);

		while(!minQueue.isEmpty()) {
			const cur = minQueue.extractMin();

			if(!cur) throw new Error("priority queue is empty.");

			if(cur === endNode) {
				let gen = this.finalPath(canvas, endNode);
				while(!gen.next().done) yield;
				return;
			}

			const curDistVal = distanceTable.value.get(cur) as DistValue;

			cur.setStyle(Color.curNode).draw(canvas.ctx);
			yield;

			for(const edge of cur.edges.v.list()) {
				edge.v.bg = Color.compare;
				edge.v.draw(canvas.ctx);
				yield;

				const toNode = edge.v.getToNode(cur);

				if(!distanceTable.value.has(toNode)) {
					distanceTable.value.set(toNode, new DistValue(null, edge.v, Infinity, Infinity));
				}
				const toNodeDistVal = distanceTable.value.get(toNode) as DistValue;

				const tentativeG = curDistVal.g + edge.v.weight.value;

				if(tentativeG < toNodeDistVal.g) {
					const f = tentativeG + this.heuristics(toNode, endNode);
					distanceTable.value.set(toNode, new DistValue(cur, edge.v, f, tentativeG))
					
					if(!visited.has(toNode)) {
						visited.add(toNode);
						minQueue.insert(f, toNode);
					}
				}
				edge.v.bg = "#ffffff";
				edge.v.draw(canvas.ctx);
			}

			cur.setStyle(Color.visited, "#000000").draw(canvas.ctx);
			yield;
			visited.add(cur);
		}

		setErrorPopupText("The node is unreachable.");
	}

	*generatorFn(canvas: CanvasHandler) {
		if(this.startNode && this.endNode) {
			if(this.startNode === this.endNode) {
				return;
			}

			this.startNode.resetStyle();
			this.endNode.resetStyle();
			this.startNode.draw(canvas.ctx);
			this.endNode.draw(canvas.ctx);

			let gen = this.astar(this.startNode, this.endNode, canvas);

			while(!gen.next().done) {
				yield;
			}
		}
	}
}

export default new Astar();
