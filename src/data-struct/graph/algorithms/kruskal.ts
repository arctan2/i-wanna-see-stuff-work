import { AlgorithmHandler } from "../../algorithm-handler";
import { CanvasHandler } from "../../handler/canvas-handler.ts";
import { ElementGNode } from "../el-node.ts";
import { ElementUEdge } from "../el-u-edge.ts";
import { ElementDEdge } from "../el-d-edge.ts";
import { Ref, ref } from "vue";
import { setErrorPopupText } from "../../global.ts";

enum Color {
	span = "#00ff00",
	curNode = "#0000ff",
	compare = "#ffff00",
	cycle = "#ff0000"
};

class Kruskal extends AlgorithmHandler {
	startNode: null | ElementGNode = null;
	visited: Set<ElementGNode> = new Set();
	edges: Ref<Array<ElementUEdge>> = ref([]);
	mst: Ref<Array<ElementUEdge>> = ref([]);
	parent: Map<ElementGNode, ElementGNode> = new Map();
	rank: Map<ElementGNode, number> = new Map();

	init(canvas: CanvasHandler, startNode: ElementGNode) {
		this.initGenerator(canvas);
		this.startNode = startNode;
		this.visited = new Set();
		this.parent = new Map();
		this.rank = new Map();
		this.edges.value = [];
		this.mst.value = [];
	}

	uninit(_canvas: CanvasHandler) {
	}

	cleanup(canvas: CanvasHandler) {
		for(let edge of this.mst.value) {
			let fromNode = edge.fromNode;
			let toNode = edge.toNode;

			fromNode.resetStyle().draw(canvas.ctx);
			toNode.resetStyle().draw(canvas.ctx);

			edge.bg = "#ffffff";
			edge.draw(canvas.ctx);
		}
		this.updateInVue.value = { idx: -1, value: null };
	}

	forceStop(canvas: CanvasHandler): void {
		super.forceStop(canvas);
		this.cleanup(canvas);
	}

	bfs(node: ElementGNode, edges: Set<ElementUEdge>) {
		this.visited.add(node);
		let queue: Array<ElementGNode> = [];

		queue.push(node);
		
		while(queue.length) {
			let front = queue.shift() as ElementGNode;

			for(let n of front.edges.v.list()) {
				let temp = (n.v.toNode === front) ? n.v.fromNode : n.v.toNode;
				edges.add(n.v as ElementUEdge);
				if(!this.visited.has(temp)) {
					this.visited.add(temp);
					queue.push(temp);
				}
			}
		}
	}

	getEdgeList(startNode: ElementGNode) {
		let edges: Set<ElementUEdge> = new Set();
		this.bfs(startNode, edges);
		return [...edges].sort((a, b) => a.weight.value - b.weight.value);
	}

	find(node: ElementGNode): ElementGNode {
		if(!this.parent.has(node)) {
			this.parent.set(node, node);
			return node;
		}

		if(node === this.parent.get(node)) {
            return node;
		}
        
        this.parent.set(node, this.find(this.parent.get(node) as ElementGNode));
        return this.parent.get(node) as ElementGNode;
	}

	union(a: ElementGNode, b: ElementGNode) {
		let u = this.find(a);
		let v = this.find(b);

		if(!this.rank.has(u)) {
			this.rank.set(u, 0);
		}

		if(!this.rank.has(v)) {
			this.rank.set(v, 0);
		}

		if(u !== v) {
			if((this.rank.get(u) as number) < (this.rank.get(v) as number)) {
				[u, v] = [v, u];
			}
			this.parent.set(v, u);

			let ru = this.rank.get(u) as number;

			if(ru === (this.rank.get(v) as number)) {
				this.rank.set(u, ru + 1);
			}
		}
	}

	isConnected(a: ElementGNode, b: ElementGNode): boolean {
		return this.find(a) === this.find(b);
	}

	updateInVue: Ref<{idx: number, value: null | "include" | "exclude"}> = ref({idx: -1, value: null});

	*kruskal(startNode: ElementGNode, canvas: CanvasHandler) {
		this.edges.value = this.getEdgeList(startNode);

		for(let i = 0; i < this.edges.value.length; i++) {
			const edge = this.edges.value[i];
			let fromNode = edge.fromNode;
			let toNode = edge.toNode;

			if(!this.isConnected(fromNode, toNode)) {
				this.mst.value.push(edge);
				this.updateInVue.value = { idx: i, value: "include" };

				fromNode.setStyle(Color.span, "#000000").draw(canvas.ctx);
				yield;

				edge.bg = Color.span;
				edge.draw(canvas.ctx);
				yield;

				toNode.setStyle(Color.span, "#000000").draw(canvas.ctx);
				yield;

				this.union(fromNode, toNode);
			} else {
				const fromPrevBg = fromNode.bg;
				const fromPrevColor = fromNode.color;
				const prevEdgeBg = edge.bg;
				const toPrevBg = fromNode.bg;
				const toPrevColor = fromNode.color;

				this.updateInVue.value = { idx: i, value: "exclude" };

				fromNode.setStyle(Color.cycle, "#ffffff").draw(canvas.ctx);

				edge.bg = Color.cycle;
				edge.draw(canvas.ctx);

				toNode.setStyle(Color.cycle, "#ffffff").draw(canvas.ctx);
				yield;

				fromNode.setStyle(fromPrevBg, fromPrevColor).draw(canvas.ctx);

				edge.bg = prevEdgeBg;
				edge.draw(canvas.ctx);

				toNode.setStyle(toPrevBg, toPrevColor).draw(canvas.ctx);
			}
		}
	}

	*generatorFn(canvas: CanvasHandler) {
		if(this.startNode) {
			if(this.startNode.edges.v.first()?.v.constructor.name === ElementDEdge.name) {
				setErrorPopupText("Can't perform Kruskal on directed edge");
				return;
			}

			yield* this.kruskal(this.startNode, canvas);
		}
	}
}

export default new Kruskal();
