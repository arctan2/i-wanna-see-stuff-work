import { Point } from "../geometry";
import { ElementLLRbtreeNode, PtrLLRbNode } from "./el-llrbtree-node";
import { LLRbtreeNode } from "./element-types/node";

let prevNodes = new Map<number, ElementLLRbtreeNode>;
let leftNeighbors = new Map<ElementLLRbtreeNode, ElementLLRbtreeNode>;
let prelims = new Map<ElementLLRbtreeNode, number>;
let modifiers = new Map<ElementLLRbtreeNode, number>;
let adjustedLocs = new Map<ElementLLRbtreeNode, Point>;
let topAdjustment = new Point(0, 0);

const MAX_DEPTH = Infinity;

export function getNewCoords(root: ElementLLRbtreeNode) {
	prevNodes = new Map<number, ElementLLRbtreeNode>;
	leftNeighbors = new Map<ElementLLRbtreeNode, ElementLLRbtreeNode>;
	prelims = new Map<ElementLLRbtreeNode, number>;
	modifiers = new Map<ElementLLRbtreeNode, number>;
	adjustedLocs = new Map<ElementLLRbtreeNode, Point>;
	topAdjustment = new Point(0, 0);

	positionTree(root);

	return adjustedLocs;
}


function positionTree(node: ElementLLRbtreeNode) {
	firstWalk(node, 0);

	topAdjustment = new Point(node.x - prelim(node), node.y);
	adjustedLocs.set(node, topAdjustment);

	secondWalk(node, 0, 0);
}

function firstWalk(node: ElementLLRbtreeNode, level: number) {
	setLeftNeighbor(node, getPrevNodeAtLevel(level));
	setPrevNodeAtLevel(level, node);
	modifiers.set(node, 0);

	if(node.isLeaf() || level === MAX_DEPTH) {
		const leftSibling = node.getLeftSibling();
		if(leftSibling !== null) {
			prelims.set(node, prelim(leftSibling) + LLRbtreeNode.diameter + meanNodeSize(leftSibling, node));
		} else {
			prelims.set(node, 0);
		}
	} else {
		const leftMost = node.getFirstChild() as ElementLLRbtreeNode;
		let rightMost = leftMost;

		firstWalk(leftMost, level + 1);

		while(rightMost.hasRightSibling()) {
			rightMost = rightMost.getRightSibling() as ElementLLRbtreeNode;
			firstWalk(rightMost, level + 1);
		}

		let mid = (prelim(leftMost) + prelim(rightMost)) / 2;

		const leftSibling = node.getLeftSibling();

		if(leftSibling !== null) {
			prelims.set(node, prelim(leftSibling) + LLRbtreeNode.diameter + meanNodeSize(leftSibling, node));
			modifiers.set(node, prelim(node) - mid);
			apportion(node);
		} else {
			prelims.set(node, mid);
		}
	}
}

function secondWalk(node: ElementLLRbtreeNode, level: number, modSum: number) {
	if(level <= MAX_DEPTH) {
		const xTemp = topAdjustment.x + prelim(node) + modSum;
		const yTemp = topAdjustment.y + (level * (LLRbtreeNode.diameter + (LLRbtreeNode.radius / 2)));

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

function apportion(node: ElementLLRbtreeNode) {
	let leftMost: PtrLLRbNode = node.ptr;
	let neighbor = getLeftNeighbor(leftMost?.v || null);
	let compareDepth = 0;

	while(leftMost !== null && neighbor !== null) {
		let leftModSum = 0;
		let rightModSum = 0;
		let ancestorLeftmost = leftMost.v;
		let ancestorNeighbor = neighbor;

		for(let i = 0; i < compareDepth; i++) {
			ancestorLeftmost = ancestorLeftmost.parentNode as ElementLLRbtreeNode;
			ancestorNeighbor = ancestorNeighbor.parentNode as ElementLLRbtreeNode;

			rightModSum += modifier(ancestorLeftmost);
			leftModSum += modifier(ancestorNeighbor);
		}

		let moveDistance = prelim(neighbor) + leftModSum + LLRbtreeNode.radius + meanNodeSize(leftMost.v, neighbor)
							- prelim(leftMost.v) - rightModSum;

		if(moveDistance > 0) {
			let tempPtr: null | ElementLLRbtreeNode = node;
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

function getLeftMost(node: PtrLLRbNode, depth: number): PtrLLRbNode {
	if (depth <= 0) {
		return node;
	}

	if(node === null || node.v.isLeaf()) {
		return null;
	}

	let ancestor = node.v.getFirstChild() as ElementLLRbtreeNode;
	let leftMost = getLeftMost(ancestor.ptr, depth - 1);
	while(!leftMost && ancestor.hasRightSibling()) {
		ancestor = ancestor.getRightSibling() as ElementLLRbtreeNode;
		leftMost = getLeftMost(ancestor.ptr, depth - 1);
	}

	return leftMost;
}

function prelim(node: ElementLLRbtreeNode | null): number {
	if(node === null) return 0;
	return prelims.get(node) || 0;
}

function modifier(node: ElementLLRbtreeNode | null): number {
	if(node === null) return 0;
	return modifiers.get(node) || 0;
}

function getPrevNodeAtLevel(level: number) {
	return prevNodes.get(level) || null;
}

function setPrevNodeAtLevel(level: number, node: ElementLLRbtreeNode) {
	return prevNodes.set(level, node);
}

function setLeftNeighbor(node: ElementLLRbtreeNode, leftNeighbor: ElementLLRbtreeNode | null) {
	if(leftNeighbor) {
		leftNeighbors.set(node, leftNeighbor);
	}
}

function getLeftNeighbor(node: ElementLLRbtreeNode | null): ElementLLRbtreeNode | null {
	if(node === null) return null;
	return leftNeighbors.get(node) || null;
}

function meanNodeSize(_left: ElementLLRbtreeNode | null, _right: ElementLLRbtreeNode | null): number {
	return LLRbtreeNode.diameter;
}
