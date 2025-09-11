import { Ref, ref } from "vue";
import { AlgorithmHandler } from "../../algorithm-handler";
import { CanvasHandler } from "../../handler/canvas-handler.ts";
import { ElementGNode } from "../el-node.ts";
import { ElementUEdge } from "../el-u-edge.ts";
import { setErrorPopupText } from "../../global.ts";
import { ElementDEdge } from "../el-d-edge.ts";
import { PriorityQueue } from "./adjmatrix/common.ts";

enum Color {
	shortPath = "#00ff00",
	curNode = "#0000ff",
	visited = "#c7fccc",
	compare = "#ffff00"
};

class DistValue { 
	dist: number;
	prev: ElementGNode | null;
	prevEdge: ElementUEdge | ElementDEdge | null;

	constructor(dist: number, prev: ElementGNode | null, prevEdge: ElementDEdge | ElementUEdge | null) {
		this.dist = dist;
		this.prev = prev;
		this.prevEdge = prevEdge;
	}
};

class Dijkstra extends AlgorithmHandler {
	startNode: null | ElementGNode = null;
	endNode: null | ElementGNode = null;
	distanceTable: Ref<Map<ElementGNode, DistValue>> = ref(new Map());

	init(canvas: CanvasHandler, startNode: ElementGNode, endNode: ElementGNode) {
		this.initGenerator(canvas);
		this.startNode = startNode;
		this.endNode = endNode;
		this.distanceTable.value = new Map<ElementGNode, DistValue>();
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

	*dijkstra(startNode: ElementGNode, endNode: ElementGNode, canvas: CanvasHandler) {
		let minQueue = new PriorityQueue<ElementGNode>();
		let distanceTable = this.distanceTable;

		let visited = new Set<ElementGNode>();

		distanceTable.value.set(startNode, new DistValue(0, null, null));
		minQueue.insert(0, startNode);

		while(!minQueue.isEmpty()) {
			const cur = minQueue.extractMin();

			if(!cur) throw new Error("priority queue is empty.");

			if(visited.has(cur)) {
				continue;
			}

			cur.setStyle(Color.curNode).draw(canvas.ctx);
			yield;

			for(const edge of cur.edges.v.list()) {
				edge.v.bg = Color.compare;
				edge.v.draw(canvas.ctx);
				yield;

				const toNode = edge.v.getToNode(cur);

				if(!distanceTable.value.has(toNode)) {
					distanceTable.value.set(toNode, new DistValue(Infinity, null, edge.v));
				}

				const newDist = (distanceTable.value.get(cur)?.dist as number) + (edge.v.weight.value || 1);

				if((distanceTable.value.get(toNode)?.dist as number) > newDist) {
					distanceTable.value.set(toNode, new DistValue(newDist, cur, edge.v));
					minQueue.insert(newDist, toNode);
				}
				edge.v.bg = "#ffffff";
				edge.v.draw(canvas.ctx);
			}

			cur.setStyle(Color.visited, "#000000").draw(canvas.ctx);
			yield;
			visited.add(cur);
		}

		let gen = this.finalPath(canvas, endNode);
		while(!gen.next().done) yield;
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

			let gen = this.dijkstra(this.startNode, this.endNode, canvas);
			while(!gen.next().done) {
				yield;
			}
		}
	}
}

export default new Dijkstra();
