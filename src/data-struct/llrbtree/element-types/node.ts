import { ShallowRef, shallowRef } from "vue";
import { GAP, circleFill, circleStroke } from "../../canvas";
import { getContrastFg } from "../../utils";
import { Line, Point } from "../../geometry";

export class LLRbtreeNode {
	public static radius = GAP * 6 / 2;
	public static diameter = LLRbtreeNode.radius * 2;
	static borderWidth = 3;
	static Red = "#ff2626";
	static Black = "#000000";
	static fontSize = 12;

	key: ShallowRef<number | "">;
	isBlackRef: ShallowRef<boolean>;

	bg: string = "";
	color: string = "";
	borderColor: string = "";

	x = -1;
	y = -1;

	constructor(key: number | "") {
		this.key = shallowRef(key);
		this.isBlackRef = shallowRef(false);
		this.resetStyle();
	}

	setStyle(bg?: string, borderColor?: string) {
		this.bg = bg || this.bg;
		this.color = getContrastFg(this.bg);
		this.borderColor = borderColor || this.borderColor;
		return this;
	}

	resetStyle() {
		this.bg = this.defaultBg;
		this.color = getContrastFg(this.bg);
		this.borderColor = "";
		return this;
	}

	get isBlack() {
		return this.isBlackRef.value;
	}

	set isBlack(v: boolean) {
		this.isBlackRef.value = v;

		if(this.bg === LLRbtreeNode.Red || this.bg === LLRbtreeNode.Black) {
			this.bg = this.defaultBg;
		}
	}

	paint(ctx: CanvasRenderingContext2D) {
		const { x, y } = this;

		ctx.fillStyle = this.bg;
		circleFill(ctx, x, y, LLRbtreeNode.radius);

		ctx.fillStyle = this.color;
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
		ctx.font = "16px monospace";
		let text = String(this.key.value);
		const tlen = text.length;
		if(tlen > 5) {
			text = text.slice(0, 5) + " ";
		}
		ctx.fillText(text, this.x, this.y);
		if(tlen > 5) {
			ctx.font = "9px monospace";
			ctx.fillText("..", this.x + 22, this.y + 2);
		}

		if(this.borderColor !== "") {
			ctx.strokeStyle = this.borderColor;
			ctx.lineWidth = 3;
			circleStroke(ctx, this.x, this.y, LLRbtreeNode.radius);
		}
	}

	setXY(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	get top() {
		return this.y;
	}

	get bottom() {
		return this.y + LLRbtreeNode.radius;
	}

	get left() {
		return this.x;
	}

	get right() {
		return this.x + LLRbtreeNode.radius;
	}

	get defaultBg() {
		return this.isBlack ? LLRbtreeNode.Black : LLRbtreeNode.Red;
	}

	intersects(x: number, y: number, {x: ox, y: oy}: Point): boolean {
		return new Line(
			new Point(this.x + ox, this.y + oy),
			new Point(x, y)
		).distance() < LLRbtreeNode.radius;
	}
}

