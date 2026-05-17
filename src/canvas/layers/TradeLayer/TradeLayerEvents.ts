import { CHART_CONFIG } from "../../../config/chartConfig";
import { normalizePrice } from "../../../helpers/math";
import type { TradeHandleHitbox, TradeLayerEventsOptions, TradeProtectionHandleType } from "./TradeLayer.types";
import type { CanvasMousePoint, HitboxArea, SupportedPointerEventType } from "./TradeLayerEvents.types";
import { TRADE_LAYER_EVENT_TYPES_TO_HANDLE } from "./TradeLayerEvents.types";

export class TradeLayerEvents {
	readonly #canvas: HTMLCanvasElement;

	readonly #getHandleHitboxes: () => TradeHandleHitbox[];

	readonly #onDrag: TradeLayerEventsOptions["onDrag"];

	readonly #onMissingProtectionDrag: TradeLayerEventsOptions["onMissingProtectionDrag"];

	readonly #onMissingProtectionDragEnd: TradeLayerEventsOptions["onMissingProtectionDragEnd"];

	readonly #onMissingProtectionDragCancel: TradeLayerEventsOptions["onMissingProtectionDragCancel"];

	readonly #onTradeModified: TradeLayerEventsOptions["onTradeModified"];

	readonly #onTradeCloseClicked: TradeLayerEventsOptions["onTradeCloseClicked"];

	#activeDragHitbox: TradeHandleHitbox | null = null;

	#activeMissingProtectionHitbox: TradeHandleHitbox | null = null;

	#hasActiveMissingProtectionMoved = false;

	#dragStartMouseY = 0;

	#lastMouseY = 0;

	constructor(options: TradeLayerEventsOptions) {
		this.#canvas = options.canvas;

		this.#getHandleHitboxes = options.getHandleHitboxes;

		this.#onDrag = options.onDrag;

		this.#onMissingProtectionDrag = options.onMissingProtectionDrag;

		this.#onMissingProtectionDragEnd = options.onMissingProtectionDragEnd;

		this.#onMissingProtectionDragCancel = options.onMissingProtectionDragCancel;

		this.#onTradeModified = options.onTradeModified;

		this.#onTradeCloseClicked = options.onTradeCloseClicked;
	}

	cancelActiveInteraction() {
		if (this.#activeMissingProtectionHitbox) {
			this.#onMissingProtectionDragCancel?.();
		}

		this.#activeDragHitbox = null;
		this.#activeMissingProtectionHitbox = null;
		this.#hasActiveMissingProtectionMoved = false;
		this.#dragStartMouseY = 0;
		this.#lastMouseY = 0;
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
		if (event.type === "pointermove" && this.#activeMissingProtectionHitbox) {
			return this.handleActiveMissingProtectionDrag(event, mousePoint);
		}

		if (event.type === "pointermove" && this.#activeDragHitbox) {
			return this.handleActiveDrag(event, mousePoint);
		}

		/**
		 * =========================
		 * Drag End
		 * =========================
		 */
		if (event.type === "pointerup") {
			if (this.#activeMissingProtectionHitbox) {
				return this.handleMissingProtectionDragEnd();
			}

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
		return TRADE_LAYER_EVENT_TYPES_TO_HANDLE.includes(eventType as SupportedPointerEventType);
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

	private handleActiveMissingProtectionDrag(
		event: PointerEvent | WheelEvent | MouseEvent,
		mousePoint: CanvasMousePoint,
	) {
		if (
			!this.#activeMissingProtectionHitbox ||
			!this.isProtectionHandleType(this.#activeMissingProtectionHitbox.type)
		) {
			return false;
		}

		const totalDeltaY = mousePoint.y - this.#dragStartMouseY;
		const activationThresholdPx = CHART_CONFIG.tradeHandles.missingProtectionHandles.dragActivationThresholdPx;

		if (!this.#hasActiveMissingProtectionMoved && Math.abs(totalDeltaY) < activationThresholdPx) {
			this.consumeEvent(event);
			return true;
		}

		this.#hasActiveMissingProtectionMoved = true;

		const nextPrice = this.getNextMissingProtectionPrice(mousePoint.y);

		this.#activeMissingProtectionHitbox.price = nextPrice;

		this.#onMissingProtectionDrag?.({
			trade: this.#activeMissingProtectionHitbox.trade,
			type: this.#activeMissingProtectionHitbox.type,
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

	private getNextMissingProtectionPrice(mouseY: number) {
		if (
			!this.#activeMissingProtectionHitbox ||
			!this.isProtectionHandleType(this.#activeMissingProtectionHitbox.type)
		) {
			return 0;
		}

		const rawPrice = normalizePrice(
			this.#activeMissingProtectionHitbox.viewport.minPrice +
				((this.#canvas.height - mouseY) / this.#canvas.height) *
					this.#activeMissingProtectionHitbox.viewport.priceRange,
		);

		return this.constrainProtectionPrice({
			price: rawPrice,
			hitbox: this.#activeMissingProtectionHitbox,
			type: this.#activeMissingProtectionHitbox.type,
		});
	}

	private handleDragEnd() {
		if (this.#activeDragHitbox) {
			this.modifyActiveDragTrade();
		}

		this.#activeDragHitbox = null;

		return false;
	}

	private handleMissingProtectionDragEnd() {
		if (
			this.#activeMissingProtectionHitbox &&
			this.#hasActiveMissingProtectionMoved &&
			this.isProtectionHandleType(this.#activeMissingProtectionHitbox.type)
		) {
			this.#onMissingProtectionDragEnd?.({
				trade: this.#activeMissingProtectionHitbox.trade,
				type: this.#activeMissingProtectionHitbox.type,
				price: normalizePrice(this.#activeMissingProtectionHitbox.price),
			});
		} else {
			this.#onMissingProtectionDragCancel?.();
		}

		this.#activeMissingProtectionHitbox = null;
		this.#hasActiveMissingProtectionMoved = false;

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
		if (hitbox.kind === "missingProtectionHandle") {
			return this.handleMissingProtectionHandleHover(event, hitbox, mousePoint);
		}

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

	private handleMissingProtectionHandleHover(
		event: PointerEvent | WheelEvent | MouseEvent,
		hitbox: TradeHandleHitbox,
		mousePoint: CanvasMousePoint,
	) {
		document.body.style.cursor = "ns-resize";

		if (event.type === "pointerdown") {
			this.startMissingProtectionDrag(hitbox, mousePoint.y);
			this.consumeEvent(event);
			return true;
		}

		this.consumeEvent(event);

		return true;
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

	private startMissingProtectionDrag(hitbox: TradeHandleHitbox, mouseY: number) {
		this.#activeMissingProtectionHitbox = hitbox;
		this.#dragStartMouseY = mouseY;
		this.#lastMouseY = mouseY;
		this.#hasActiveMissingProtectionMoved = false;
	}

	private resetCursorIfIdle() {
		if (!this.#activeDragHitbox && !this.#activeMissingProtectionHitbox) {
			document.body.style.cursor = "default";
		}
	}

	private isPointInsideArea(point: CanvasMousePoint, area: HitboxArea) {
		const isInsideX = point.x >= area.x && point.x <= area.x + area.width;
		const isInsideY = point.y >= area.y && point.y <= area.y + area.height;

		return isInsideX && isInsideY;
	}

	private isProtectionHandleType(type: TradeHandleHitbox["type"]): type is TradeProtectionHandleType {
		return type === "stopLoss" || type === "takeProfit";
	}

	private constrainProtectionPrice({
		price,
		hitbox,
		type,
	}: {
		price: number;
		hitbox: TradeHandleHitbox;
		type: TradeProtectionHandleType;
	}) {
		const direction = this.getProtectionDirection({
			hitbox,
			type,
		});

		if (direction > 0) {
			return normalizePrice(Math.max(price, hitbox.trade.openPrice));
		}

		return normalizePrice(Math.min(price, hitbox.trade.openPrice));
	}

	private getProtectionDirection({ hitbox, type }: { hitbox: TradeHandleHitbox; type: TradeProtectionHandleType }) {
		const isBuyTrade = this.isBuyTrade(hitbox);
		const direction = type === "takeProfit" ? 1 : -1;

		return isBuyTrade ? direction : -direction;
	}

	private isBuyTrade(hitbox: TradeHandleHitbox) {
		return String(hitbox.trade.type).toLowerCase().includes("buy");
	}

	private consumeEvent(event: PointerEvent | WheelEvent | MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
	}
}
