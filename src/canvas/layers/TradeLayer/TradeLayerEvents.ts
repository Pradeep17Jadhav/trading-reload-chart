import type { TradeHandleHitbox, TradeLayerEventsOptions } from "./TradeLayer.types";

const EVENT_TYPES_TO_HANDLE = ["mousedown", "mousemove", "mouseup", "wheel"] as const;

export class TradeLayerEvents {
	readonly #canvas: HTMLCanvasElement;

	readonly #getHandleHitboxes: () => TradeHandleHitbox[];

	constructor(options: TradeLayerEventsOptions) {
		this.#canvas = options.canvas;

		this.#getHandleHitboxes = options.getHandleHitboxes;
	}

	handlePointerEvent(event: PointerEvent | WheelEvent | MouseEvent) {
		if (!EVENT_TYPES_TO_HANDLE.includes(event.type as (typeof EVENT_TYPES_TO_HANDLE)[number])) {
			return false;
		}
		const rect = this.#canvas.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;
		const handleHitboxes = this.#getHandleHitboxes();
		for (const hitbox of handleHitboxes) {
			const isInsideX = mouseX >= hitbox.x && mouseX <= hitbox.x + hitbox.width;
			const isInsideY = mouseY >= hitbox.y && mouseY <= hitbox.y + hitbox.height;

			if (isInsideX && isInsideY) {
				console.log("Trade handle interaction", {
					eventType: event.type,
					type: hitbox.type,
					trade: hitbox.trade,
				});

				event.stopPropagation();
				event.preventDefault();
				return true;
			}
		}

		return false;
	}
}
