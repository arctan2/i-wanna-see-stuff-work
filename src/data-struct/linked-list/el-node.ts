import { GAP } from "../canvas";
import { Line, Point } from "../geometry";
import { EventState } from "../handler/event-handler";
import { CanvasHandler } from "../handler/canvas-handler";
import { setErrorPopupText, focusedElement, DELAY } from "../global";
import { Arrow } from "./element-types/arrow";
import { LLNode } from "./element-types/node";
import { ElementArrow } from "./el-arrow";
import { ElementHandler } from "../handler/element-handler";
import { sleep } from "../utils";
import allocator, { AllocDisplay, Dealloc, Null, Ptr } from "../memory-allocator/allocator";
import { Ref, ShallowReactive, ref } from "vue";

export class ElementLLNode extends LLNode implements ElementHandler, AllocDisplay, Dealloc {
	arrow: ElementArrow;

	referedBy: Set<ElementLLNode> = new Set();
	nextRef: Ref<Ptr<ElementLLNode> | null> = ref(null);
	ptr: ShallowReactive<Ptr<ElementLLNode>>;

	pointerEnter(_state: EventState, _canvas: CanvasHandler) {};
	pointerUp(_state: EventState, _canvas: CanvasHandler): ElementHandler | null { return null };
	pointerLeave(_state: EventState, _canvas: CanvasHandler) {};

	static Size = Ptr.Size + Ptr.Size;

	constructor(x: number, y: number, value: string) {
		super(value);
		this.x = x;
		this.y = y;
		this.arrow = new ElementArrow(this);
		this.updateArrowTail();
		this.arrow.head = { x: this.arrow.tail.x + GAP, y: this.arrow.tail.y };

		this.ptr = allocator.malloc(ElementLLNode.Size, this);
	}

	get next(): ElementLLNode | null {
		return this.nextRef.value?.v || null;
	}
	set next(v: Ptr<ElementLLNode> | null) {
		this.nextRef.value = v;
	}

    toBytes(): Array<string> {
		return [...this.value.toBytes(), ...(this.next?.ptr.toBytes() || Null.Bytes)]
	}

    toString(): string {
		return ` lnode { val: ${this.value}, next: ${this.nextRef.value || 'NULL'} } `;
	}

    toDisplayableBlocks() {
		return [
			` lnode { val: `,
			{ ptr: this.value.toString() },
			`, next: `,
			this.nextRef.value ? { ptr: this.nextRef.value.toString() } : 'NULL',
			` } `
		];
	}

	dealloc() {
		allocator.free(this.value);
	}

	pointerDy: number = -1;
	pointerDx: number = -1;

	updateArrowTail() {
		this.arrow.tail = {
			x: (this.dividerX() + this.right) / 2,
			y: (this.y + this.bottom) / 2
		};
	}

	updateArrowHead() {
		if(this.next) {
			this.arrow.head.x = this.next.left + GAP;
			this.arrow.head.y = (this.next.top + this.next.bottom) / 2;
			this.arrow.rectifyHead();
		}
	}

	defaultArrowPointPos(): Point {
		return new Point(this.left + GAP, (this.top + this.bottom) / 2);
	}

	moveTo(x: number, y: number) {
		this.setXY(x, y);

		if(this.referedBy.size > 0) {
			for(let r of this.referedBy) {
				r.arrow.head.x = this.left + GAP;
				r.arrow.head.y = (this.top + this.bottom) / 2;
				r.arrow.rectifyHead();
			}
		}
	}

	pointerMove(state: EventState, canvas: CanvasHandler): void {
		if(state.pointerDown.x === -1) return;
		let { x, y } = state.pointerMove;
		let { x: prevx, y: prevy } = this;

		x = Math.floor(x / GAP) * GAP - this.pointerDx;
		y = Math.floor(y / GAP) * GAP - this.pointerDy;

		this.arrow.tail.x += x - prevx;
		this.arrow.tail.y += y - prevy;

		this.moveTo(x, y);

		this.updateArrowHead();

		canvas.redraw();
	}

	remove(canvas: CanvasHandler) {
		allocator.free(this.ptr);
		canvas.removeElements(this, this.arrow);
	}

	removeRefs(...args: Array<ElementLLNode>) {
		for(let a of args) {
			this.referedBy.delete(a);
		}
	}

	async scrollTo(canvas: CanvasHandler) {
		const x = this.x + canvas.transform.x;
		const y = this.y + canvas.transform.y;
		if(!(x > 0 && x < canvas.width && y > 0 && y < canvas.height)) {
			await canvas.scrollTo(canvas.halfWidth - this.x, canvas.halfHeight - this.y, 30);
		}
	}

	setNext(next: Ptr<ElementLLNode> | null) {
		this.next = next;
		if(next === null) {
			this.arrow.bg = Arrow.notPointingColor;
		} else {
			this.arrow.bg = Arrow.pointingColor;
			next.v.referedBy.add(this);
		}
	}

	async insertLLNode(toInsertStart: ElementLLNode, canvas: CanvasHandler) {
		const arrow = this.arrow;
		const toInsertArrow = toInsertStart.arrow;
		const next = this.next;

		if(next === null) throw "next is a null";

		toInsertArrow.bg = Arrow.notPointingColor;
		await toInsertArrow.animateArrowHeadTo(canvas, new Point(toInsertArrow.tail.x + GAP, toInsertArrow.tail.y));

		let rectified = arrow.getRectifiedPos(toInsertStart, new Line(arrow.tail, toInsertStart.defaultArrowPointPos()));
		await arrow.animateArrowHeadTo(canvas, rectified);

		rectified = toInsertArrow.getRectifiedPos(next, new Line(toInsertArrow.tail, next.defaultArrowPointPos()));
		await toInsertArrow.animateArrowHeadTo(canvas, rectified);

		toInsertStart.setNext(next.ptr);
		next.removeRefs(this);
		this.setNext(toInsertStart.ptr);

		toInsertArrow.bg = Arrow.pointingColor;
		canvas.redraw();
	}

	async deleteLLNode(canvas: CanvasHandler) {
		const arrow = this.arrow;

		arrow.bg = Arrow.notPointingColor;
		await arrow.animateArrowHeadTo(canvas, new Point(arrow.tail.x + GAP, arrow.tail.y));

		this.remove(canvas);

		if(this.referedBy.size === 0 && this.next === null) {
			canvas.redraw();
			return;
		}

		if(this.referedBy.size === 0) {
			(this.next as ElementLLNode).referedBy.delete(this);
			canvas.redraw();
			return;
		}

		const next = this.next;
		if(next === null) {
			for(let r of this.referedBy) {
				r.next = null;
				r.arrow.bg = Arrow.notPointingColor;
			}
		} else {
			if(next.next === this) {
				this.referedBy.delete(next);
				next.next = null;
				next.arrow.bg = Arrow.notPointingColor;
			}
			for(let r of this.referedBy) {
				r.next = null;
				r.arrow.bg = Arrow.pointingColor;
				let rectified = r.arrow.getRectifiedPos(next, new Line(r.arrow.tail, next.defaultArrowPointPos()));
				await r.arrow.animateArrowHeadTo(canvas, rectified);
				r.next = this.next?.ptr || null;
				next.referedBy.add(r);
			}
		}

		canvas.redraw();
	}

	async deleteAllReachable(canvas: CanvasHandler) {
		let node: ElementLLNode = this;

		while(node) {
			const next = node.next;
			const arrow = node.arrow;

			arrow.bg = Arrow.notPointingColor;
			await arrow.animateArrowHeadTo(canvas, new Point(arrow.tail.x + GAP, arrow.tail.y));

			if(node.referedBy.size === 0 && next === null) {
				node.remove(canvas);
				canvas.redraw();
				return;
			}

			if(next && node.referedBy.size === 0) {
				node.remove(canvas);
				next.referedBy.delete(this);
				node = next;
				continue;
			}

			for(let r of node.referedBy) {
				r.next = null;
				r.arrow.bg = Arrow.notPointingColor;
			}

			node.remove(canvas);
			node = next as ElementLLNode;
		}

		canvas.redraw();
	}


	async grad(arrow: Arrow, canvas: CanvasHandler, ctx: CanvasRenderingContext2D) {
		return new Promise<void>(resolve => {
			let stop = 0;
			const fn = () => {
				let grd = ctx.createLinearGradient(arrow.tail.x, arrow.tail.y, arrow.head.x, arrow.head.y);
				grd.addColorStop(stop, "#FFFF00");
				grd.addColorStop(stop, "#FFFFFF");

				stop += 0.05;

				arrow.bg = grd;
				canvas.redraw();

				if(stop >= 1) {
					arrow.bg = "#FFFFFF";
					return resolve();
				}
				window.requestAnimationFrame(fn);
			}
			window.requestAnimationFrame(fn);
		})
	}

	async find(value: string, canvas: CanvasHandler) {
		const ctx = canvas.playgroundCanvas.getContext("2d");
		if(ctx === null) return;
		const visited = new Set<ElementLLNode>();
		let node: ElementLLNode | null = this;

		while(node !== null) {
			if(visited.has(node)) {
				break;
			}
			visited.add(node);

			node.setBg("#FFFFFF");
			node.color = "#000000";

			node.draw(canvas.ctx);

			await sleep(DELAY);

			if(node.value.v.chars === value) {
				break;
			}

			node.setBg("#FF0000");
			node.color = "#FFFFFF";
			node.draw(canvas.ctx);

			await sleep(DELAY);

			node.resetStyle();

			const arrow = node.arrow;

			node = node.next;

			if(node) {
				const x = node.x + canvas.transform.x;
				const y = node.y + canvas.transform.y;
				if(!(x > 0 && x < canvas.width && y > 0 && y < canvas.height)) {
					await Promise.all([
						this.grad(arrow, canvas, ctx),
						canvas.scrollTo(canvas.halfWidth - node.x, canvas.halfHeight - node.y, 10)
					]);
				} else {
					await this.grad(arrow, canvas, ctx);
				}
			}
			canvas.draw();
		}

		if(node === null) {
			canvas.redraw();
			setErrorPopupText("Element not found");
		} else if(node.value.v.chars !== value) {
			canvas.redraw();
			setErrorPopupText("Cycle detected. Aborting.");
		} else {
			node.bg = "#00FF00";
			node.draw(canvas.ctx);
			node.resetStyle();
		}
	}

	pointerDown(state: EventState): void {
		let { x: nodex, y: nodey } = this;
		let { x: statex, y: statey } = state.pointerDown;
		this.pointerDx = Math.floor((statex - nodex) / GAP) * GAP;
		this.pointerDy = Math.floor((statey - nodey) / GAP) * GAP;
	}

	focus() {
	}

	unfocus() {
	}

	isIntersect(x: number, y: number, canvas: CanvasHandler): null | ElementHandler {
		if(this.intersects(x, y, canvas.transform)) return this;
		return null;
	}

	drawBorder(ctx: CanvasRenderingContext2D, color: string) {
		ctx.strokeStyle = color;
		ctx.lineWidth = 3;
		const wb2 = ctx.lineWidth / 2;
		ctx.strokeRect(this.x - wb2, this.y - wb2, LLNode.width + ctx.lineWidth, LLNode.height + ctx.lineWidth);
	}

	draw(ctx: CanvasRenderingContext2D) {
		if(this === focusedElement.value) {
			this.drawBorder(ctx, "#FFFF00");
		}

		this.paint(ctx);
		this.arrow.draw(ctx);
	}
}

