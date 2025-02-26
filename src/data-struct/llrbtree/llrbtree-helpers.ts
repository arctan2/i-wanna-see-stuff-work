import { CanvasHandler } from "../handler/canvas-handler";
import { Ptr } from "../memory-allocator/allocator"
import { ElementLLRbtreeNode, PtrLLRbNode } from "./el-llrbtree-node"

export function isRed(h: PtrLLRbNode): boolean {
	if(h === null) {
		return false;
	}
	return !h.v.isBlack;
}

export function *rotateLeft(h: ElementLLRbtreeNode, canvas: CanvasHandler) {
	let x = h.rNode!.v;
	x.parentNode = h.parentNode;
	if(x.isBlack) {
		throw("rotating black link");
	}

	h.rNode = x.lNode;

	if(h.rNode) {
		h.rNode.v.parentNode = h;
	}

	x.y = h.y;
	x.x = h.x;

	x.lNode = h.ptr;

	h.parentNode = x;

	canvas.redraw();
	console.log("rotlef");
	yield;

	x.isBlack = h.isBlack;
	h.isBlack = false;
	return x.ptr;
}

export function rotateRight(h: ElementLLRbtreeNode): PtrLLRbNode {
	let x = h.lNode!.v;
	x.parentNode = h.parentNode;
	if(x.isBlack) {
		throw("rotating a black link");
	}

	h.lNode = x.rNode;

	if(h.lNode) {
		h.lNode.v.parentNode = h;
	}

	x.y = h.y;
	x.x = h.x;

	x.rNode = h.ptr;

	h.parentNode = x;

	x.isBlack = h.isBlack;
	h.isBlack = false;
	return x.ptr;
}

export function flip(h: ElementLLRbtreeNode) {
	h.isBlack = !h.isBlack;
	let l = h.lNode!.v;
	let r = h.rNode!.v;
	l.isBlack = !l.isBlack;
	r.isBlack = !r.isBlack;
}

export function moveRedLeft(h: PtrLLRbNode): PtrLLRbNode {
	if(h === null) return h;

	flip(h.v);
	if(isRed(h.v.rNode!.v.lNode)) {
		h.v.rNode = rotateRight((h.v.rNode as Ptr<ElementLLRbtreeNode>).v)
		h = rotateLeft(h.v);
		flip(h!.v);
	}
	return h;
}

export function moveRedRight(h: Ptr<ElementLLRbtreeNode>): PtrLLRbNode {
	flip(h.v);
	if(isRed((h.v.lNode as Ptr<ElementLLRbtreeNode>).v.lNode)) {
		h = rotateRight(h.v) as Ptr<ElementLLRbtreeNode>;
		flip(h.v);
	}
	return h;
}

export function fixUp(h: PtrLLRbNode): PtrLLRbNode {
	if(h === null) return h;

	if(isRed(h.v.rNode)) {
		h = rotateLeft(h.v)
	}

	if(h && isRed(h.v.lNode) && isRed((h.v.lNode as Ptr<ElementLLRbtreeNode>).v.lNode)) {
		h = rotateRight(h.v)
	}

	if(h && isRed(h.v.lNode) && isRed(h.v.rNode)) {
		flip(h.v);
	}

	return h;
}
