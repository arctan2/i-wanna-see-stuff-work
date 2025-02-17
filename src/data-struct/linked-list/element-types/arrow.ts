import { circleFill } from "../../canvas";
import { Line } from "../../geometry";
import { Transform } from "../../handler/canvas-handler";

interface P {
	x: number, y: number
}

export class Arrow {
	head = { x: -1, y: -1 };
	tail = { x: -1, y: -1 };

	static notPointingColor = "#AAAAAA";
	static pointingColor = "#FFFFFF";
	static insertColor = "#FFFF00"
	static invalidInsert = "#FF0000";

	static drawFromTo(ctx: CanvasRenderingContext2D, tail: P, head: P, color: string) {
		const a = new Arrow();
		a.bg = color;
		a.head = head;
		a.tail = tail;
		a.paint(ctx);
	}

	bg: string | CanvasGradient = Arrow.notPointingColor;

	paint(ctx: CanvasRenderingContext2D) {
		const { x: fromx, y: fromy } = this.tail;
		const { x: tox, y: toy } = this.head;
		const headlen = 15;
		const dx = tox - fromx;
		const dy = toy - fromy;
		const angle = Math.atan2(dy, dx);

		circleFill(ctx, this.tail.x, this.tail.y, 4, this.bg.toString());

		ctx.fillStyle = this.bg;
		ctx.strokeStyle = this.bg;

		ctx.beginPath();
		ctx.moveTo(fromx, fromy);
		ctx.lineTo(tox, toy);
		ctx.stroke();

		ctx.beginPath();
		ctx.lineWidth = 2;
		ctx.moveTo(tox, toy);
		ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
		ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
		ctx.closePath();
		ctx.stroke();
		ctx.fill();
	}

	intersects(x: number, y: number, transform: Transform): boolean {
		const p = new Line(this.tail, this.head).getPositionAlongTheLine(0.98);
		const mag = 10;
		const _x = p.x + transform.x;
		const _y = p.y + transform.y;
		const lowx = _x - mag;
		const lowy = _y - mag;
		const highx = _x + mag;
		const highy = _y + mag;
		return x >= lowx && x <= highx && y >= lowy && y <= highy;
	}
}

