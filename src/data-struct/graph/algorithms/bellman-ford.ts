import { Ref, ref } from "vue";
import { AlgorithmHandler } from "../../algorithm-handler";
import { CanvasHandler } from "../../handler/canvas-handler.ts";
import { ElementGNode } from "../el-node.ts";
import { ElementUEdge } from "../el-u-edge.ts";
import { setErrorPopupText } from "../../global.ts";
import { ElementDEdge } from "../el-d-edge.ts";

enum Color {
	shortPath = "#00ff00",
	curNode = "#0000ff",
	visited = "#c7fccc",
	compareEdge = "#ffff00",
	compareNode = "#0000ff",
	cycle = "#ff0000",
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

class BellmanFord extends AlgorithmHandler {
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

	bfs(node: ElementGNode) {
		let queue: Array<ElementGNode> = [];
		let edges: Array<ElementDEdge> = [];
		let visited = this.distanceTable;

		queue.push(node);
		
		while(queue.length) {
			let front = queue.shift() as ElementGNode;

			for(let n of front.edges.v.list()) {
				let temp = n.v.toNode;
				edges.push(n.v as ElementDEdge);

				if(!visited.value.has(temp)) {
					visited.value.set(temp, new DistValue(Infinity, null, null));
					queue.push(temp);
				}
			}
		}

		return { edges, vertexCount: visited.value.size };
	}

	*bellmanFord(startNode: ElementGNode, endNode: ElementGNode, canvas: CanvasHandler) {
		const { edges, vertexCount } = this.bfs(startNode);
		let dist = this.distanceTable;
		
		dist.value.set(startNode, new DistValue(0, null, null));

		for(let i = 0; i < vertexCount; i++) {
			for(const edge of edges) {
				const fromNode = edge.fromNode;
				const toNode = edge.toNode;

				fromNode.setStyle(Color.compareNode).draw(canvas.ctx);
				yield null;

				edge.bg = Color.compareEdge;
				edge.draw(canvas.ctx);
				yield null;

				toNode.setStyle(Color.compareNode).draw(canvas.ctx);
				yield null;

				const fromDist = (dist.value.get(fromNode) as DistValue).dist;
				const toDist = (dist.value.get(toNode) as DistValue).dist;

				const relaxed = fromDist + edge.weight.value;

				if(fromDist !== Number.MAX_SAFE_INTEGER && relaxed < toDist) {
					dist.value.set(toNode, new DistValue(relaxed, fromNode, edge));
				}

				fromNode.resetStyle().draw(canvas.ctx);
				edge.bg = "#ffffff";
				edge.draw(canvas.ctx);
				toNode.resetStyle().draw(canvas.ctx);
				yield null;
			}
		}

		for(const edge of edges) {
			const fromNode = edge.fromNode;
			const toNode = edge.toNode;
			const fromDist = (dist.value.get(fromNode) as DistValue).dist;
			const toDist = (dist.value.get(toNode) as DistValue).dist;
			const relaxed = fromDist + edge.weight.value;

			if(fromDist !== Number.MAX_SAFE_INTEGER && relaxed < toDist) {
				let temp = dist.value.get(fromNode);

				edge.bg = Color.cycle;
				edge.draw(canvas.ctx);
				yield null;
				fromNode.setStyle(Color.cycle).draw(canvas.ctx);
				yield null;

				while(temp?.prev && temp.prevEdge && temp !== dist.value.get(toNode)) {
					temp.prev.bg = Color.cycle;
					temp.prevEdge.bg = Color.cycle;

					temp.prevEdge.draw(canvas.ctx);
					yield null;
					temp.prev.draw(canvas.ctx);
					yield null;

					temp = dist.value.get(temp.prev);
				}

				setErrorPopupText("Negative cycle detected!");
				return;
			}
		}

		let temp = dist.value.get(endNode);
		if(!temp?.prev) {
			setErrorPopupText("The node is not reachable from the source node.");
			return;
		}

		endNode.setStyle(Color.shortPath, "#000000").draw(canvas.ctx);

		while(temp?.prev && temp.prevEdge) {
			temp.prev.bg = Color.shortPath;
			temp.prevEdge.bg = Color.shortPath;

			temp.prevEdge.draw(canvas.ctx);
			yield null;
			temp.prev.draw(canvas.ctx);
			yield null;

			temp = dist.value.get(temp.prev);
		}
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

			if(this.startNode.edges.v.first()?.v.constructor.name === ElementUEdge.name) {
				setErrorPopupText("Can't perform BellmanFord on undirected edge");
				return;
			}

			let gen = this.bellmanFord(this.startNode, this.endNode, canvas);

			while(!gen.next().done) {
				yield null;
			}
		}
	}
}

export default new BellmanFord();
