import { GAP } from "../canvas";
import { Point } from "../geometry";
import { AllocDisplay, Ptr } from "../memory-allocator/allocator";
import { gapX, gapY } from "./element-types/node";

interface WalkersNode extends AllocDisplay {
	x: number;
	y: number;

	getLeftSibling: () => WalkersNode | null;
	getRightSibling: () => WalkersNode | null;
	getFirstChild: () => WalkersNode | null;
	hasRightSibling: () => boolean;
	isLeaf: () => boolean;
	ptr: Ptr<WalkersNode>;
	parentNode: WalkersNode | null;
	totalWidth: () => number;
}

let prevNodes = new Map<number, WalkersNode>;
let leftNeighbors = new Map<WalkersNode, WalkersNode>;
let prelims = new Map<WalkersNode, number>;
let modifiers = new Map<WalkersNode, number>;
let adjustedLocs = new Map<WalkersNode, Point>;
let topAdjustment = new Point(0, 0);

const MAX_DEPTH = Infinity;

export function getNewCoords(root: WalkersNode) {
	prevNodes = new Map<number, WalkersNode>;
	leftNeighbors = new Map<WalkersNode, WalkersNode>;
	prelims = new Map<WalkersNode, number>;
	modifiers = new Map<WalkersNode, number>;
	adjustedLocs = new Map<WalkersNode, Point>;
	topAdjustment = new Point(0, 0);

	positionTree(root);

	return adjustedLocs;
}

const SUBTREE_SEP = GAP * 4;

function positionTree(node: WalkersNode) {
	firstWalk(node, 0);

	topAdjustment = new Point(node.x - prelim(node), node.y);
	adjustedLocs.set(node, topAdjustment);

	secondWalk(node, 0, 0);
}

function firstWalk(node: WalkersNode, level: number) {
	setLeftNeighbor(node, getPrevNodeAtLevel(level));
	setPrevNodeAtLevel(level, node);
	modifiers.set(node, 0);

	if(node.isLeaf() || level === MAX_DEPTH) {
		const leftSibling = node.getLeftSibling();
		if(leftSibling !== null) {
			prelims.set(node, prelim(leftSibling) + gapX + meanNodeSize(leftSibling, node))
		} else {
			prelims.set(node, 0);
		}
	} else {
		const leftMost = node.getFirstChild() as WalkersNode;
		let rightMost = leftMost;

		firstWalk(leftMost, level + 1);

		while(rightMost.hasRightSibling()) {
			rightMost = rightMost.getRightSibling() as WalkersNode;
			firstWalk(rightMost, level + 1);
		}

		let mid = (prelim(leftMost) + prelim(rightMost)) / 2;

		const leftSibling = node.getLeftSibling();

		if(leftSibling !== null) {
			prelims.set(node, prelim(leftSibling) + gapX + meanNodeSize(leftSibling, node));
			modifiers.set(node, prelim(node) - mid);
			apportion(node);
		} else {
			prelims.set(node, mid);
		}
	}
}

function secondWalk(node: WalkersNode, level: number, modSum: number) {
	if(level <= MAX_DEPTH) {
		const xTemp = topAdjustment.x + prelim(node) + modSum;
		const yTemp = topAdjustment.y + (level * gapY);

		adjustedLocs.set(node, new Point(xTemp, yTemp));

		const firstChild = node.getFirstChild();
		if(firstChild) {
			secondWalk(firstChild, level + 1, modSum + modifier(node));
		}

		const rightSibling = node.getRightSibling();
		if(rightSibling !== null) {
			secondWalk(rightSibling, level, modSum);
		}
	}
}

function apportion(node: WalkersNode) {
	let leftMost: Ptr<WalkersNode> | null = node.ptr;
	let neighbor = getLeftNeighbor(leftMost?.v || null);
	let compareDepth = 0;

	while(leftMost !== null && neighbor !== null) {
		let leftModSum = 0;
		let rightModSum = 0;
		let ancestorLeftmost = leftMost.v;
		let ancestorNeighbor = neighbor;

		for(let i = 0; i < compareDepth; i++) {
			ancestorLeftmost = ancestorLeftmost.parentNode as WalkersNode;
			ancestorNeighbor = ancestorNeighbor.parentNode as WalkersNode;

			rightModSum += modifier(ancestorLeftmost);
			leftModSum += modifier(ancestorNeighbor);
		}

		let moveDistance = prelim(neighbor) + leftModSum + SUBTREE_SEP + meanNodeSize(leftMost.v, neighbor)
							- prelim(leftMost.v) - rightModSum;

		if(moveDistance > 0) {
			let tempPtr: null | WalkersNode = node;
			let leftSiblings = 0;

			while((tempPtr !== null) && (tempPtr !== ancestorNeighbor)) {
				leftSiblings++;
				tempPtr = tempPtr.getLeftSibling();
			}

			if(tempPtr !== null) {
				const portion = moveDistance / leftSiblings;
				tempPtr = node;

				while(tempPtr && tempPtr !== ancestorNeighbor) {
					prelims.set(tempPtr, prelim(tempPtr) + moveDistance);
					modifiers.set(tempPtr, modifier(tempPtr) + moveDistance);
					moveDistance -= portion;
					tempPtr = tempPtr.getLeftSibling();
				}
			} else {
				return;
			}
		}

		compareDepth++;

		leftMost = getLeftMost(node.ptr, compareDepth);
		if(leftMost) {
			neighbor = leftNeighbors.get(leftMost.v) || null;
		}
	}
}

function getLeftMost(node: Ptr<WalkersNode> | null, depth: number): Ptr<WalkersNode> | null {
	if (depth <= 0) {
		return node;
	}

	if(node === null || node.v.isLeaf()) {
		return null;
	}

	let ancestor = node.v.getFirstChild() as WalkersNode;
	let leftMost = getLeftMost(ancestor.ptr, depth - 1);
	while(!leftMost && ancestor.hasRightSibling()) {
		ancestor = ancestor.getRightSibling() as WalkersNode;
		leftMost = getLeftMost(ancestor.ptr, depth - 1);
	}

	return leftMost;
}

function prelim(node: WalkersNode | null): number {
	if(node === null) return 0;
	return prelims.get(node) || 0;
}

function modifier(node: WalkersNode | null): number {
	if(node === null) return 0;
	return modifiers.get(node) || 0;
}

function getPrevNodeAtLevel(level: number) {
	return prevNodes.get(level) || null;
}

function setPrevNodeAtLevel(level: number, node: WalkersNode) {
	return prevNodes.set(level, node);
}

function setLeftNeighbor(node: WalkersNode, leftNeighbor: WalkersNode | null) {
	if(leftNeighbor) {
		leftNeighbors.set(node, leftNeighbor);
	}
}

function getLeftNeighbor(node: WalkersNode | null): WalkersNode | null {
	if(node === null) return null;
	return leftNeighbors.get(node) || null;
}

function meanNodeSize(leftNode: WalkersNode | null, rightNode: WalkersNode | null) {
	let nodeSize = 0;
	let count = 0;
	if(leftNode) {
		nodeSize += leftNode.totalWidth();
		count++;
	}

	if(rightNode) {
		nodeSize += rightNode.totalWidth();
		count++;
	}

	return nodeSize / count;
}
