import { GAP } from "./canvas";
import { ElementAdjMatrix } from "./graph/el-adjmatrix";
import { ElementDEdge } from "./graph/el-d-edge";
import { ElementGNode } from "./graph/el-node";
import { ElementUEdge } from "./graph/el-u-edge";
import { ToolAdjMatrix } from "./graph/tool-adjmatrix";
import { CanvasHandler } from "./handler/canvas-handler";
import { Playground } from "./handler/playground-handler";
import { ElementLLNode } from "./linked-list/el-node";
import { randInt } from "./utils";
// import { randInt } from "./utils";

export function createSampleLinkedList(canvas: CanvasHandler) {
	let y = 10;

	const nodes = [];

	let row = 5;
	let col = 0;

	for(let i = 0; i < row; i++) {
		let x = 20;
		for(let j = 0; j < col; j++) {
			const enode = new ElementLLNode(x * GAP, y * GAP, 'n-' + String(String(i) + j));
			canvas.addElements(enode, enode.arrow);
			x += 12;
			nodes.push(enode);
		}
		y += 10;
	}

	for(let i = 0; i < nodes.length - 1; i++) {
		nodes[i].setNext(nodes[i + 1].ptr);
		// nodes[i].moveTo(randInt(-400, 400), randInt(-400, 400));
		nodes[i].updateArrowTail();
		nodes[i].updateArrowHead();
	}
	canvas.redraw();
}

export function createSampleUGraph(canvas: CanvasHandler) {
	// const n1 = new ElementGNode(40 * GAP, 20 * GAP, "n1");
	// canvas.addElements(n1);

	// const n2 = new ElementGNode(80 * GAP, 20 * GAP, "n2");
	// canvas.addElements(n2);


	// const edge = new ElementUEdge(n1, n2);

	// edge.weight = randInt(0, 500);
	// edge.rectify();
	// canvas.addElements(edge);

	// return;
	let y = 10;

	const nodes = [];

	let row = 4;
	let col = 4;

	for(let i = 0; i < row; i++) {
		let x = 10;
		for(let j = 0; j < col; j++) {
			const enode = new ElementGNode(x * GAP, y * GAP, String(String(i) + j));
			canvas.addElements(enode);
			x += 15;
			nodes.push(enode);
		}
		y += 15;
	}

	for(let i = 0; i < nodes.length; i++) {
		const a = nodes[i];
		for(let j = 0; j < 1; j++) {
			let r = i;
			while(r === i) r = randInt(0, nodes.length);
			const b = nodes[r];
			if(ElementGNode.hasUEdge(a, b)) {
				continue;
			}
			const edge = new ElementUEdge(a.ptr, b.ptr);

			// edge.weight = randInt(0, 500);
			edge.weight.value = 0;
			edge.rectify();
			canvas.addElements(edge);
		}
	}

	canvas.redraw();
}

export function createSampleDGraph(canvas: CanvasHandler) {
	let y = 15;

	const nodes = [];

	let row = 5;
	let col = 5;

	for(let i = 0; i < row; i++) {
		let x = 15;
		for(let j = 0; j < col; j++) {
			const enode = new ElementGNode(x * GAP, y * GAP, String(String(i) + j));
			canvas.addElements(enode);
			x += 15;
			nodes.push(enode);
		}
		y += 15;
	}

	for(let i = 0; i < nodes.length - 1; i++) {
		const a = nodes[i];
		for(let j = 0; j < 1; j++) {
			let r = i;
			while(r === i) r = randInt(0, nodes.length);
			const b = nodes[r];
			if(ElementGNode.hasDEdge(a, b)) {
				continue;
			}
			const edge = new ElementDEdge(a, b.ptr);

			edge.weight.value = randInt(0, 500);
			edge.rectify();
			canvas.addElements(edge);
		}
	}

	canvas.redraw();
}

export function createSampleDfs(canvas: CanvasHandler) {
	let y = 10;

	const nodes = [];

	let row = 3;
	let col = 3;

	for(let i = 0; i < row; i++) {
		let x = 40;
		for(let j = 0; j < col; j++) {
			const enode = new ElementGNode(x * GAP, y * GAP, String(String(i) + j));
			canvas.addElements(enode);
			x += 15;
			nodes.push(enode);
		}
		y += 15;
	}

	const addEdge = (a: ElementGNode, b: ElementGNode) => {
		if(ElementGNode.hasDEdge(a, b)) {
			return;
		}
		const edge = new ElementUEdge(a.ptr, b.ptr);

		edge.weight.value = randInt(0, 500);
		edge.rectify();
		canvas.addElements(edge);
	}

	addEdge(nodes[0], nodes[1]);
	addEdge(nodes[0], nodes[3]);
	addEdge(nodes[3], nodes[4]);
	addEdge(nodes[1], nodes[3]);
	addEdge(nodes[1], nodes[4]);
	addEdge(nodes[2], nodes[4]);
	addEdge(nodes[2], nodes[1]);
	addEdge(nodes[6], nodes[3]);
	addEdge(nodes[6], nodes[4]);
	addEdge(nodes[6], nodes[5]);
	addEdge(nodes[5], nodes[1]);

	canvas.redraw();
}

export function createSampleBfs(canvas: CanvasHandler) {
	let y = 10;

	const nodes = [];

	let row = 3;
	let col = 3;

	for(let i = 0; i < row; i++) {
		let x = 40;
		for(let j = 0; j < col; j++) {
			const enode = new ElementGNode(x * GAP, y * GAP, String(String(i) + j));
			canvas.addElements(enode);
			x += 15;
			nodes.push(enode);
		}
		y += 15;
	}

	const addEdge = (a: ElementGNode, b: ElementGNode) => {
		if(ElementGNode.hasDEdge(a, b)) {
			return;
		}
		const edge = new ElementUEdge(a.ptr, b.ptr);

		edge.weight.value = randInt(0, 500);
		edge.rectify();
		canvas.addElements(edge);
	}

	addEdge(nodes[0], nodes[1]);
	addEdge(nodes[0], nodes[3]);
	addEdge(nodes[1], nodes[4]);
	addEdge(nodes[2], nodes[4]);
	addEdge(nodes[1], nodes[2]);
	addEdge(nodes[3], nodes[4]);

	canvas.redraw();
}

export function createSampleDijkstra(canvas: CanvasHandler) {
	let y = 10;

	const nodes = [];

	let row = 3;
	let col = 3;

	for(let i = 0; i < row; i++) {
		let x = 40;
		for(let j = 0; j < col; j++) {
			const enode = new ElementGNode(x * GAP, y * GAP, String(String(i) + j));
			canvas.addElements(enode);
			x += 15;
			nodes.push(enode);
		}
		y += 15;
	}

	let wt = 1;

	const addEdge = (a: ElementGNode, b: ElementGNode) => {
		if(ElementGNode.hasDEdge(a, b)) {
			return;
		}
		const edge = new ElementUEdge(a.ptr, b.ptr);

		edge.weight.value = wt++;
		edge.rectify();
		canvas.addElements(edge);
	}

	addEdge(nodes[0], nodes[1]);
	addEdge(nodes[0], nodes[3]);
	addEdge(nodes[3], nodes[4]);
	addEdge(nodes[1], nodes[3]);
	addEdge(nodes[1], nodes[4]);
	addEdge(nodes[2], nodes[4]);
	addEdge(nodes[2], nodes[1]);
	addEdge(nodes[6], nodes[3]);
	addEdge(nodes[6], nodes[4]);
	addEdge(nodes[6], nodes[5]);
	addEdge(nodes[5], nodes[1]);

	canvas.redraw();
}

export function createSamplePrims(canvas: CanvasHandler) {
	let y = 10;

	const nodes = [];

	let row = 3;
	let col = 3;

	for(let i = 0; i < row; i++) {
		let x = 40;
		for(let j = 0; j < col; j++) {
			const enode = new ElementGNode(x * GAP, y * GAP, String(String(i) + j));
			canvas.addElements(enode);
			x += 15;
			nodes.push(enode);
		}
		y += 15;
	}

	let wt = 1;

	const addEdge = (a: ElementGNode, b: ElementGNode) => {
		if(ElementGNode.hasDEdge(a, b)) {
			return;
		}
		const edge = new ElementUEdge(a.ptr, b.ptr);

		edge.weight.value = wt++;
		edge.rectify();
		canvas.addElements(edge);
	}

	addEdge(nodes[0], nodes[1]);
	addEdge(nodes[0], nodes[3]);
	addEdge(nodes[3], nodes[4]);
	addEdge(nodes[1], nodes[3]);
	addEdge(nodes[1], nodes[4]);
	addEdge(nodes[2], nodes[4]);
	addEdge(nodes[2], nodes[1]);
	addEdge(nodes[6], nodes[3]);
	addEdge(nodes[6], nodes[4]);
	addEdge(nodes[6], nodes[5]);
	addEdge(nodes[5], nodes[1]);

	canvas.redraw();
}

export function createSampleBellmanFord(canvas: CanvasHandler) {
	let y = 10;

	const nodes = [];

	let row = 3;
	let col = 3;

	for(let i = 0; i < row; i++) {
		let x = 40;
		for(let j = 0; j < col; j++) {
			const enode = new ElementGNode(x * GAP, y * GAP, String(String(i) + j));
			canvas.addElements(enode);
			x += 15;
			nodes.push(enode);
		}
		y += 15;
	}

	const addEdge = (a: ElementGNode, b: ElementGNode, wt: number) => {
		if(ElementGNode.hasDEdge(a, b)) {
			return;
		}
		const edge = new ElementDEdge(a, b.ptr);

		edge.weight.value = wt;
		edge.rectify();
		canvas.addElements(edge);
	}

	const A = nodes[0], B = nodes[1], C = nodes[3], D = nodes[2], E = nodes[4], F = nodes[5];

	addEdge(A, B, 5);
	addEdge(B, C, 1);
	addEdge(C, E, 1);
	addEdge(B, D, 2);
	addEdge(E, D, -1);
	addEdge(D, F, 2);
	addEdge(F, E, -3);


	canvas.redraw();
}

export function createSampleAdjMatrix(canvas: CanvasHandler) {
	const m = new ElementAdjMatrix(40 * GAP, 15 * GAP, ToolAdjMatrix.newAdjMatrix());
	// m.setColumns(20);
	// m.setRows(20);
	// m.setSrcXY(3, 10);
	// m.setDestXY(10, 10);
	canvas.addElements(m);
}

export function createSampleAstar(canvas: CanvasHandler) {
	let y = 10;

	const nodes: Array<Array<ElementGNode>> = [[]];

	let row = 10;
	let col = 10;

	for(let i = 0; i < row; i++) {
		let x = 10;
		nodes.push([]);
		for(let j = 0; j < col; j++) {
			const enode = new ElementGNode(x * GAP, y * GAP, String(String(i) + j));
			canvas.addElements(enode);
			x += 7;
			nodes[i].push(enode);
		}
		y += 7;
	}

	for(let i = 0; i < nodes.length; i++) {
		for(let j = 0; j < nodes[i].length; j++) {
			const adjacentNodes = [
				[j, i - 1],
				[j + 1, i],
				[j, i + 1],
				[j - 1, i],
			]; 
			const a = nodes[i][j];
			for(let [c, r] of adjacentNodes) {
				if((c < 0 || c >= col) || (r < 0 || r >= row)) {
					continue;
				}

				const b = nodes[r][c];
				if(ElementGNode.hasUEdge(a, b)) {
					continue;
				}

				const edge = new ElementUEdge(a.ptr, b.ptr);
				edge.weight.value = 1;
				edge.rectify();
				canvas.addElements(edge);
			}
		}
	}

	canvas.redraw();
}

export function runSample(playground: Playground) {
	// createSampleAdjMatrix(playground.canvas);
	// createSampleAstar(playground.canvas);
	createSampleLinkedList(playground.canvas);
	// createSampleUGraph(playground.canvas);
}

