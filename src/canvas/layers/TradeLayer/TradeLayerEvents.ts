import { normalizePrice } from "../../../helpers/math";
import type { TradeHandleHitbox, TradeLayerEventsOptions } from "./TradeLayer.types";

const EVENT_TYPES_TO_HANDLE = ["pointerdown", "pointermove", "pointerup"] as const;

type SupportedPointerEventType = (typeof EVENT_TYPES_TO_HANDLE)[number];

type CanvasMousePoint = {
	x: number;
	y: number;
};

type HitboxArea = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export class TradeLayerEvents {
	readonly #canvas: HTMLCanvasElement;

	readonly #getHandleHitboxes: () => TradeHandleHitbox[];

	readonly #onDrag: TradeLayerEventsOptions["onDrag"];

	readonly #onTradeModified: TradeLayerEventsOptions["onTradeModified"];

	readonly #onTradeCloseClicked: TradeLayerEventsOptions["onTradeCloseClicked"];

	#activeDragHitbox: TradeHandleHitbox | null = null;

	#lastMouseY = 0;

	constructor(options: TradeLayerEventsOptions) {
		this.#canvas = options.canvas;

		this.#getHandleHitboxes = options.getHandleHitboxes;

		this.#onDrag = options.onDrag;

		this.#onTradeModified = options.onTradeModified;

		this.#onTradeCloseClicked = options.onTradeCloseClicked;
	}

	handlePointerEvent(event: PointerEvent | WheelEvent | MouseEvent) {
		if (!this.isSupportedEventType(event.type)) {
			return false;
		}

		const mousePoint = this.getCanvasMousePoint(event);

		/**
		 * =========================
		 * Active Drag
		 * =========================
		 */
		if (event.type === "pointermove" && this.#activeDragHitbox) {
			return this.handleActiveDrag(event, mousePoint);
		}

		/**
		 * =========================
		 * Drag End
		 * =========================
		 */
		if (event.type === "pointerup") {
			return this.handleDragEnd();
		}

		const hoveredHitbox = this.getHoveredHitbox(mousePoint);

		if (!hoveredHitbox) {
			this.resetCursorIfIdle();
			return false;
		}

		return this.handleHoveredHitbox(event, hoveredHitbox, mousePoint);
	}

	private isSupportedEventType(eventType: string): eventType is SupportedPointerEventType {
		return EVENT_TYPES_TO_HANDLE.includes(eventType as SupportedPointerEventType);
	}

	private getCanvasMousePoint(event: PointerEvent | WheelEvent | MouseEvent): CanvasMousePoint {
		const rect = this.#canvas.getBoundingClientRect();

		return {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
		};
	}

	private handleActiveDrag(event: PointerEvent | WheelEvent | MouseEvent, mousePoint: CanvasMousePoint) {
		if (!this.#activeDragHitbox) {
			return false;
		}

		const deltaY = mousePoint.y - this.#lastMouseY;

		this.#lastMouseY = mousePoint.y;

		const nextPrice = this.getNextDragPrice(deltaY);

		this.#activeDragHitbox.price = nextPrice;

		this.#onDrag?.({
			trade: this.#activeDragHitbox.trade,
			type: this.#activeDragHitbox.type,
			price: nextPrice,
		});

		this.consumeEvent(event);

		return true;
	}

	private getNextDragPrice(deltaY: number) {
		if (!this.#activeDragHitbox) {
			return 0;
		}

		const pricePerPixel = this.#activeDragHitbox.viewport.priceRange / this.#canvas.height;

		return normalizePrice(this.#activeDragHitbox.price - deltaY * pricePerPixel);
	}

	private handleDragEnd() {
		if (this.#activeDragHitbox) {
			this.modifyActiveDragTrade();
		}

		this.#activeDragHitbox = null;

		return false;
	}

	private modifyActiveDragTrade() {
		if (!this.#activeDragHitbox) {
			return;
		}

		const price = normalizePrice(this.#activeDragHitbox.price);

		if (this.#activeDragHitbox.type === "stopLoss") {
			this.#onTradeModified?.({
				ticket: this.#activeDragHitbox.trade.ticket,
				sl: price,
			});

			return;
		}

		this.#onTradeModified?.({
			ticket: this.#activeDragHitbox.trade.ticket,
			tp: price,
		});
	}

	private getHoveredHitbox(mousePoint: CanvasMousePoint) {
		const handleHitboxes = this.#getHandleHitboxes();

		return handleHitboxes.find((hitbox) => this.isPointInsideArea(mousePoint, hitbox)) ?? null;
	}

	private handleHoveredHitbox(
		event: PointerEvent | WheelEvent | MouseEvent,
		hitbox: TradeHandleHitbox,
		mousePoint: CanvasMousePoint,
	) {
		const isInsideCloseButton = this.isPointInsideArea(mousePoint, hitbox.closeButtonArea);
		const isInsideLabelArea = this.isPointInsideArea(mousePoint, hitbox.labelArea);

		if (isInsideCloseButton) {
			return this.handleCloseButtonHover(event, hitbox);
		}

		this.updateHandleCursor(hitbox);

		/**
		 * =========================
		 * Drag Start
		 * =========================
		 */
		if (isInsideLabelArea && event.type === "pointerdown" && hitbox.type !== "startPrice") {
			this.startDrag(hitbox, mousePoint.y);
		}

		if (hitbox.type !== "startPrice") {
			this.consumeEvent(event);
			return true;
		}

		return false;
	}

	private handleCloseButtonHover(event: PointerEvent | WheelEvent | MouseEvent, hitbox: TradeHandleHitbox) {
		document.body.style.cursor = "pointer";

		if (event.type !== "pointerdown") {
			return hitbox.type !== "startPrice";
		}

		this.handleCloseButtonClick(hitbox);
		this.consumeEvent(event);

		return true;
	}

	private handleCloseButtonClick(hitbox: TradeHandleHitbox) {
		if (hitbox.type === "startPrice") {
			this.#onTradeCloseClicked?.({
				ticket: hitbox.trade.ticket,
			});

			return;
		}

		this.#onTradeModified?.({
			ticket: hitbox.trade.ticket,
			...(hitbox.type === "stopLoss" ? { sl: null } : {}),
			...(hitbox.type === "takeProfit" ? { tp: null } : {}),
		});
	}

	private updateHandleCursor(hitbox: TradeHandleHitbox) {
		document.body.style.cursor = hitbox.type === "startPrice" ? "crosshair" : "ns-resize";
	}

	private startDrag(hitbox: TradeHandleHitbox, mouseY: number) {
		this.#activeDragHitbox = hitbox;
		this.#lastMouseY = mouseY;
	}

	private resetCursorIfIdle() {
		if (!this.#activeDragHitbox) {
			document.body.style.cursor = "crosshair";
		}
	}

	private isPointInsideArea(point: CanvasMousePoint, area: HitboxArea) {
		const isInsideX = point.x >= area.x && point.x <= area.x + area.width;
		const isInsideY = point.y >= area.y && point.y <= area.y + area.height;

		return isInsideX && isInsideY;
	}

	private consumeEvent(event: PointerEvent | WheelEvent | MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
	}
}
