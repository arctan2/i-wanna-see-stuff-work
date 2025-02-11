import { ShallowRef, shallowRef } from "vue";
import { AlgorithmHandler } from "../../algorithm-handler";
import { CanvasHandler } from "../../handler/canvas-handler.ts";
import { ElementGNode } from "../el-node.ts";

enum Color {
	visited = "#00ff00"
};

class Dfs extends AlgorithmHandler {
	startNode: null | ElementGNode = null;

	visited: ShallowRef<Set<ElementGNode>> = shallowRef(new Set<ElementGNode>());

	init(canvas: CanvasHandler, node: ElementGNode) {
		this.startNode = node;
		this.visited.value = new Set<ElementGNode>();
		this.initGenerator(canvas);
	}

	*dfs(node: ElementGNode, canvas: CanvasHandler) {
		this.visited.value.add(node);
		this.visited.value = new Set([...this.visited.value]);
		node.bg = Color.visited;

		node.borderColor = "#0000ff";
		node.draw(canvas.ctx);
		yield null;

		for(let n of node.edges.v.list()) {
			n.v.bg = "#ffff00";
			n.v.draw(canvas.ctx);
			yield null;
			n.v.bg = "#ffffff";
			n.v.draw(canvas.ctx);

			let temp = n.v.getToNode(node);

			if(!this.visited.value.has(temp)) {
				let gen = this.dfs(temp, canvas);
				node.borderColor = "";
				canvas.redraw();
				while(!gen.next().done) {
					yield null;
				}
				node.borderColor = "#0000ff";
				canvas.redraw();
			}
		}
		node.borderColor = "";
		canvas.redraw();
	}

	uninit(canvas: CanvasHandler) {
		this.startNode = null;
		for(let n of this.visited.value) {
			n.edges.v.list().forEach((e) => e.v.bg = "#ffffff");
			n.resetStyle();
		}
		canvas.redraw();
	}

	*generatorFn(canvas: CanvasHandler) {
		if(this.startNode) {
			let gen = this.dfs(this.startNode, canvas);

			while(!gen.next().done) {
				yield null;
			}
		}
	}
}

export default new Dfs();
