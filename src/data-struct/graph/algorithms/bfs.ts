import { ShallowReactive, ShallowRef, shallowReactive, shallowRef } from "vue";
import { AlgorithmHandler } from "../../algorithm-handler";
import { CanvasHandler } from "../../handler/canvas-handler.ts";
import { ElementGNode } from "../el-node.ts";

enum Color {
	visited = "#00ff00"
};

class Bfs extends AlgorithmHandler {
	startNode: null | ElementGNode = null;

	visited: ShallowRef<Set<ElementGNode>> = shallowRef(new Set<ElementGNode>());
	queue: ShallowReactive<Array<ElementGNode>> = shallowReactive([]); 

	init(canvas: CanvasHandler, node: ElementGNode) {
		this.initGenerator(canvas);
		this.startNode = node;
		this.visited.value = new Set<ElementGNode>();
		this.queue = [];
	}

	*bfs(node: ElementGNode, canvas: CanvasHandler) {
		this.visited.value.add(node);
		this.visited.value = new Set([...this.visited.value]);

		this.queue.push(node);
		yield null;
		
		while(this.queue.length) {
			let front = this.queue.shift();
			yield null;

			if(!front) {
				return;
			}

			front.setStyle(Color.visited, undefined, "#0000ff").draw(canvas.ctx);
			yield null;

			for(let n of front.edges.v.list()) {
				n.v.bg = "#ffff00";
				n.v.draw(canvas.ctx);
				yield null;
				n.v.bg = "#ffffff";
				n.v.draw(canvas.ctx);

				let temp = n.v.getToNode(front);

				if(!this.visited.value.has(temp)) {
					this.visited.value.add(temp);
					this.visited.value = new Set([...this.visited.value]);
					temp.bg = "#a200ff";
					temp.draw(canvas.ctx);
					this.queue.push(temp);
					yield null;
				}
			}
			front.borderColor = "";
			canvas.redraw();
		}
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
			let gen = this.bfs(this.startNode, canvas);

			while(!gen.next().done) {
				yield null;
			}
		}
	}
}

export default new Bfs();
