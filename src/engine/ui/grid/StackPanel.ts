import type { Container } from "@pixi/display";
import type { GridOptions } from "./Grid";
import { Grid } from "./Grid";

/**
 * Stack panel
 * Puts all the elements top to bottom or side by side
 * It's actually a Grid with only one row or column
 */
export class StackPanel extends Grid {
	constructor(options: StackOptions) {
		const gridOptions: GridOptions = options as any;
		gridOptions.orientation = options.orientation == "horizontal" ? "rows" : "columns";
		gridOptions.colOrRowNumber = 1;
		gridOptions.spacingX = options.spacing;
		gridOptions.spacingY = options.spacing;
		gridOptions.offsetX = options.offset;
		gridOptions.offsetY = options.offset;
		gridOptions.fixedWidth = options.fixedSize;
		gridOptions.fixedHeight = options.fixedSize;

		super(gridOptions);
	}
}

interface StackOptions {
	elements?: Container[];
	orientation?: "horizontal" | "vertical";
	fixedSize?: number;
	spacing?: number;
	offset?: number;
	anchorX?: number;
	anchorY?: number;
}
