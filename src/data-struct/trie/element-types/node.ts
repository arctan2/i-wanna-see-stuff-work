import { GAP, circleFill, circleStroke } from "../../canvas";
import { getContrastFg } from "../../utils";
import { Line, Point } from "../../geometry";
import { ShallowRef, shallowRef } from "vue";

export class TrieNode {
	public static radius = GAP * 6 / 2;
	public static diameter = TrieNode.radius * 2;
	static borderWidth = 3;
	static fontSize = 12;
	public static defaultBg = "#cacaca";

	char: string;

	isWordEnd: ShallowRef<boolean> = shallowRef(false);
	word: string = "";

	bg: string = "";
	color: string = "";
	borderColor: string = "";

	x = -1;
	y = -1;

	constructor(char: string) {
		this.char = char;
		this.resetStyle();
	}

	setStyle(bg?: string, borderColor?: string) {
		this.bg = bg || this.bg;
		this.color = getContrastFg(this.bg);
		this.borderColor = borderColor || this.borderColor;
		return this;
	}

	get defaultBg() {
		return this.isWordEnd.value ? "#ff0050" : TrieNode.defaultBg;
	}

	resetStyle() {
		this.bg = this.defaultBg;
		this.color = getContrastFg(this.bg);
		this.borderColor = "";
		return this;
	}

	paint(ctx: CanvasRenderingContext2D) {
		const { x, y } = this;

		ctx.fillStyle = this.bg;
		circleFill(ctx, x, y, TrieNode.radius);

		ctx.fillStyle = getContrastFg(this.bg);
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
		ctx.font = "16px monospace";
		let text = String(this.char);
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
			circleStroke(ctx, this.x, this.y, TrieNode.radius);
		}
	}

	setXY(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	get top() {
		return this.y - TrieNode.radius;
	}

	get bottom() {
		return this.y + TrieNode.radius;
	}

	get left() {
		return this.x - TrieNode.radius;
	}

	get right() {
		return this.x + TrieNode.radius;
	}

	totalWidth() {
		return TrieNode.diameter;
	}

	intersects(x: number, y: number, {x: ox, y: oy}: Point): boolean {
		return new Line(
			new Point(this.x + ox, this.y + oy),
			new Point(x, y)
		).distance() < TrieNode.radius;
	}
}

export const gapX = TrieNode.diameter;
export const gapY = TrieNode.diameter + TrieNode.radius;

