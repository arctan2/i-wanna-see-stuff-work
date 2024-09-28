import { GAP, getDevicePixelRatio, setCanvasSize } from "../canvas";
import { Point } from "../geometry";
import { ElementHandler, panHandler } from "./element-handler";

class Finder {
	private exceptList: Array<ElementHandler> = [];
	private typeList: Array<string> = [];

	except(...args: Array<ElementHandler>) {
		this.exceptList = args;
		return this;
	}

	ofTypes(...args: Array<string>) {
		this.typeList = args;
		return this;
	}

	find<T>(x: number, y: number, canvas: CanvasHandler): T | null {
		for(let i = canvas.elements.length - 1; i >= 0; i--) {
			const e = canvas.elements[i].isIntersect(x, y, canvas);
			if(e && !this.exceptList.includes(e) && this.typeList.includes(e.constructor.name)) {
				return e as T;
 			}
		}
		return null;
	}
}

export interface Transform {
	x: number,
	y: number,
	scale: number,
}

export class CanvasHandler {
	playgroundCanvas: HTMLCanvasElement;
	toolCanvas: HTMLCanvasElement;
	lineCanvas: HTMLCanvasElement;

	ctx: CanvasRenderingContext2D;
	toolCtx: CanvasRenderingContext2D;
	lineCtx: CanvasRenderingContext2D;

	isDisplayGrid: boolean = false;

	finder: Finder = new Finder();

	elements: Array<ElementHandler> = [];

	width = 0;
	height = 0;

	domHeight = 0;
	domWidth = 0;

	halfWidth = 0;
	halfHeight = 0;

	transform: Transform;
	DPR: number;
	scalexDPR: number;

	constructor() {
		this.playgroundCanvas = document.createElement("canvas");
		this.ctx = this.playgroundCanvas.getContext('2d') as CanvasRenderingContext2D;

		this.toolCanvas = document.createElement("canvas");
		this.toolCtx = this.playgroundCanvas.getContext('2d') as CanvasRenderingContext2D;

		this.lineCanvas = document.createElement("canvas");
		this.lineCtx = this.playgroundCanvas.getContext('2d') as CanvasRenderingContext2D;

		this.transform = { x: 0, y: 0, scale: 1 };
		this.DPR = getDevicePixelRatio();
		this.scalexDPR = this.transform.scale * this.DPR;
	}

	init(
		pgndCanvas: HTMLCanvasElement,
		toolCanvas: HTMLCanvasElement,
		lineCanvas: HTMLCanvasElement
	) {
		this.playgroundCanvas = pgndCanvas;
		this.ctx = pgndCanvas.getContext('2d') as CanvasRenderingContext2D;

		this.toolCanvas = toolCanvas;
		this.toolCtx = toolCanvas.getContext('2d') as CanvasRenderingContext2D;

		this.lineCanvas = lineCanvas;
		this.lineCtx = lineCanvas.getContext('2d') as CanvasRenderingContext2D;

		this.lineCtx.scale(this.DPR, this.DPR);
	}

	setZoom(v: number) {
		this.transform.scale = v;
		this.scalexDPR = this.transform.scale * this.DPR;
		this.redraw();
	}

	setIsDisplayGrid(v: boolean) {
		this.isDisplayGrid = v;
		if(this.isDisplayGrid) {
			this.lineCanvas.style.display = "block";
			this.updateLineCanvas();
		} else {
			this.lineCanvas.style.display = "none";
		}
	}

	setSize(w: number, h: number) {
		this.domWidth = w;
		this.domHeight = h;

		this.width = w * this.DPR;
		this.height = h * this.DPR;

		this.halfWidth = Math.floor(this.width / 2);
		this.halfHeight = Math.floor(this.height / 2);

		setCanvasSize(this.playgroundCanvas, w, h);
		setCanvasSize(this.lineCanvas, w, h);
		this.lineCtx.scale(this.DPR, this.DPR);
	}

	addElements(...element: Array<ElementHandler>) {
		for(let el of element) {
			this.elements.push(el);
			el.draw(this.ctx);
		}
	}

	removeElements(...args: Array<ElementHandler>) {
		if(args.length === 1) {
			const idx = this.elements.findIndex((e) => e === args[0]);
			if(idx !== -1) {
				this.elements.splice(idx, 1);
			}
		} else {
			this.elements = this.elements.filter(e => !args.includes(e));
		}
	}

	findIntersection(x: number, y: number): ElementHandler {
		for(let i = this.elements.length - 1; i >= 0; i--) {
			const e = this.elements[i].isIntersect(x, y, this);
			if(e) {
				return e;
			}
		}
		return panHandler;
	}
	
	findIntersectionExcept(x: number, y: number, except: Array<ElementHandler>): ElementHandler | null {
		for(let i = this.elements.length - 1; i >= 0; i--) {
			const e = this.elements[i].isIntersect(x, y, this);
			if(e && !except.includes(e)) {
				return e;
			}
		}
		return null;
	}

	findIntersectionOfType(x: number, y: number, ofTypes: Array<string>): ElementHandler | null {
		for(let i = this.elements.length - 1; i >= 0; i--) {
			const e = this.elements[i].isIntersect(x, y, this);
			if(e && ofTypes.includes(e.constructor.name)) {
				return e;
			}
		}
		return null;
	}

	updateLineCanvas() {
		if(!this.isDisplayGrid) {
			return;
		}
		const ctx = this.lineCtx;

		ctx.clearRect(0, 0, this.width, this.height);

		ctx.strokeStyle = "#505050";

		for(let x = this.transform.x % GAP; x < this.width; x += GAP) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, this.height);
			ctx.stroke();
		}

		for(let y = this.transform.y % GAP; y < this.height; y += GAP) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(this.width, y);
			ctx.stroke();
		}
	}

	panTo(x: number, y: number) {
		this.transform.x = x;
		this.transform.y = y;
		this.updateLineCanvas();
		this.redraw();
	}

	async scrollTo(x: number, y: number, step: number) {
		return new Promise<void>(resolve => {
			if(step <= 0) {
				this.panTo(x, y);
				return resolve();
			}

			const dx = (x - this.transform.x >= 0) ? 1 : -1;
			const dy = (y - this.transform.y >= 0) ? 1 : -1;
			const magx = dx * step;
			const magy = dy * step;
			const destx = step * Math.floor(x / step);
			const desty = step * Math.floor(y / step);

			const scroll = () => {
				const dx = Math.abs(this.transform.x - destx) > step;
				const dy = Math.abs(this.transform.y - desty) > step;
				if(dx) this.transform.x += magx;
				if(dy) this.transform.y += magy;
				if(!dx && !dy) {
					this.panTo(x, y);
					return resolve();
				}
				this.updateLineCanvas();
				this.redraw();
				window.requestAnimationFrame(scroll);
			}
			scroll();
		})
	}

	toVirtualPosition(x: number, y: number) {
		return new Point(x - this.transform.x, y - this.transform.y);
	}

	setTransform(ctx: CanvasRenderingContext2D) {
		ctx.setTransform(
			this.scalexDPR,
			0, 0,
			this.scalexDPR,
			this.transform.x * this.DPR,
			this.transform.y * this.DPR
		);
	}

	resetTransform(ctx: CanvasRenderingContext2D) {
		ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);
	}

	// displayDebug() {
	// 	line(this.ctx, this.transform.x, 0, this.transform.x, this.height, this.DPR, "#FF0000");
	// 	line(this.ctx, 0, this.transform.y, this.width, this.transform.y, this.DPR, "#FF0000");

	// 	document.getElementById("debug")?.remove();
	// 	const d = document.createElement("div");
	// 	d.id = "debug"
	// 	d.style.position = "fixed";
	// 	d.style.color = "white";
	// 	d.style.bottom = "0";
	// 	d.style.left = "0";
	// 	d.style.fontSize = "0.8rem";
	// 	d.innerText = `transform { x: ${this.transform.x}, y: ${this.transform.y} }`;
	// 	document.body.appendChild(d);
	// }

	clear() {
		this.resetTransform(this.ctx);

		this.ctx.clearRect(0, 0, this.width, this.height);

		// this.displayDebug();

		this.setTransform(this.ctx);
	}

	redraw() {
		this.clear();
		this.draw();
	}

	draw() {
		for(let i = 0; i < this.elements.length; i++) {
			this.elements[i].draw(this.ctx);
		}
	}
}
