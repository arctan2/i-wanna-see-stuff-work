import { CanvasHandler } from "../handler/canvas-handler";
import { Ptr } from "../memory-allocator/allocator"
import { ElementLLRbtreeNode, PtrLLRbNode } from "./el-llrbtree-node"

export function isRed(h: PtrLLRbNode): boolean {
	if(h === null) {
		return false;
	}
	return !h.v.isBlack;
}

enum Color {
	toRotate = "#9000ff",
	flippingColors = "#4287f5",
}

export async function *rotateLeft(h: ElementLLRbtreeNode, canvas: CanvasHandler) {
	let x = h.rNode!.v;
	x.parentNode = h.parentNode;
	if(x.isBlack) {
		throw("rotating black link");
	}

	const toRotate = [h, x, x.lNode?.v];

	for(const n of toRotate) {
		if(n) {
			n.bg = Color.toRotate;
			n.paint(canvas.ctx);
			yield;
		}
	}

	h.rNode = x.lNode;

	if(h.rNode) {
		h.rNode.v.parentNode = h;
	}

	let prevHLeftPos = h.getLeftChildPos();
	let hLeftKaRight;

	if(h.lNode) {
		hLeftKaRight = h.lNode.v.getRightChildPos();
	}

	x.lNode = h.ptr;

	h.parentNode = x;

	await Promise.all([
		x.moveToAnimate(canvas, h.x, h.y),
		h.moveToAnimate(canvas, prevHLeftPos.x, prevHLeftPos.y),
		h.rNode?.v.moveToAnimate(canvas, hLeftKaRight?.x || 0, hLeftKaRight?.y || 0)
	]);
	yield;


	x.isBlack = h.isBlack;
	h.isBlack = false;

	for(const n of toRotate) {
		n?.resetStyle();
		n?.draw(canvas.ctx);
	}

	return x.ptr;
}

export async function *rotateRight(h: ElementLLRbtreeNode, canvas: CanvasHandler) {
	let x = h.lNode!.v;
	x.parentNode = h.parentNode;
	if(x.isBlack) {
		throw("rotating a black link");
	}

	const toRotate = [h, x, x.rNode?.v];

	for(const n of toRotate) {
		if(n) {
			n.bg = Color.toRotate;
			n.paint(canvas.ctx);
			yield;
		}
	}

	h.lNode = x.rNode;

	if(h.lNode) {
		h.lNode.v.parentNode = h;
	}

	let prevHRightPos = h.getRightChildPos();
	let hRightKaLeft;

	if(h.rNode) {
		hRightKaLeft = h.rNode.v.getLeftChildPos();
	}

	x.rNode = h.ptr;

	h.parentNode = x;

	await Promise.all([
		x.moveToAnimate(canvas, h.x, h.y),
		h.moveToAnimate(canvas, prevHRightPos.x, prevHRightPos.y),
		h.rNode?.v.moveToAnimate(canvas, hRightKaLeft?.x || 0, hRightKaLeft?.y || 0)
	]);
	yield;

	x.isBlack = h.isBlack;
	h.isBlack = false;

	for(const n of toRotate) {
		n?.resetStyle();
		n?.draw(canvas.ctx);
	}

	return x.ptr;
}

export function* flip(h: ElementLLRbtreeNode, canvas: CanvasHandler) {
	const toFlip = [h, h.lNode!.v, h.rNode!.v];

	for(const n of toFlip) {
		n.bg = Color.flippingColors;
		n.paint(canvas.ctx);
		yield;
	}

	h.isBlack = !h.isBlack;
	let l = h.lNode!.v;
	let r = h.rNode!.v;
	l.isBlack = !l.isBlack;
	r.isBlack = !r.isBlack;

	for(const n of toFlip) {
		n.resetStyle();
		n.paint(canvas.ctx);
	}
	yield;
}

export async function *moveRedLeft(h: PtrLLRbNode, canvas: CanvasHandler) {
	if(h === null) return h;

	for(const _ of flip(h.v, canvas)) yield;
	if(isRed(h.v.rNode!.v.lNode)) {
		let gen = rotateRight((h.v.rNode as Ptr<ElementLLRbtreeNode>).v, canvas);
		while(true) {
			let result = await gen.next();
			if(result.done) {
				h.v.rNode = result.value;
				break;
			}
			yield;
		}

		gen = rotateLeft(h.v, canvas);
		while(true) {
			let result = await gen.next();
			if(result.done) {
				h = result.value;
				break;
			}
			yield;
		}
		for(const _ of flip(h!.v, canvas)) yield;
	}
	return h;
}

export async function *moveRedRight(h: PtrLLRbNode, canvas: CanvasHandler) {
	if(h === null) return h;

	for(const _ of flip(h.v, canvas)) yield;
	if(isRed((h.v.lNode as Ptr<ElementLLRbtreeNode>).v.lNode)) {
		let gen = rotateRight(h.v, canvas);
		while(true) {
			let result = await gen.next();
			if(result.done) {
				h = result.value;
				break;
			}
			yield;
		}
		for(const _ of flip(h.v, canvas)) yield;
	}
	return h;
}

export async function *fixUp(h: PtrLLRbNode, canvas: CanvasHandler) {
	if(h === null) return h;

	if(isRed(h.v.rNode)) {
		let gen = rotateLeft(h.v, canvas);
		while(true) {
			let result = await gen.next();
			if(result.done) {
				h = result.value;
				break;
			}
			yield;
		}
	}

	if(h && isRed(h.v.lNode) && isRed((h.v.lNode as Ptr<ElementLLRbtreeNode>).v.lNode)) {
		let gen = rotateRight(h.v, canvas);
		while(true) {
			let result = await gen.next();
			if(result.done) {
				h = result.value;
				break;
			}
			yield;
		}
	}

	if(h && isRed(h.v.lNode) && isRed(h.v.rNode)) {
		for(const _ of flip(h.v, canvas)) yield;
	}

	return h;
}
