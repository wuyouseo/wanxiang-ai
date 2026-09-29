import { IMAGE_DIMENSIONS, IMAGE_MODEL_LABELS, IMAGE_MODEL_OPTIONS, IMAGE_RATIOS, IMAGE_SIZE_TIERS } from "../../lib/constants";
import type { ImageModelId, ImageRatio, ImageSizeTier } from "../../lib/types";
import { Card } from "../ui/Card";
import { RatioPicker } from "../ui/RatioPicker";
import { SegmentedControl } from "../ui/SegmentedControl";

export function ImageParamPanel({
  size,
  ratio,
  onSizeChange,
  onRatioChange,
  model,
  onModelChange,
}: {
  size: ImageSizeTier;
  ratio: ImageRatio;
  onSizeChange: (v: ImageSizeTier) => void;
  onRatioChange: (v: ImageRatio) => void;
  /** When provided, shows a generation-model selector row. */
  model?: ImageModelId;
  onModelChange?: (v: ImageModelId) => void;
}) {
  const [w, h] = IMAGE_DIMENSIONS[ratio][size];

  return (
    <Card className="flex flex-col gap-5 p-5">
      {model && onModelChange && (
        <div className="flex items-start gap-5">
          <span className="w-14 flex-shrink-0 pt-2 text-xs text-text-muted">模型</span>
          <div className="flex flex-col gap-2">
            <SegmentedControl
              options={IMAGE_MODEL_OPTIONS}
              value={model}
              onChange={onModelChange}
              labels={IMAGE_MODEL_LABELS}
            />
            <p className="text-xs text-text-muted">不同代次的模型在细节与提示词遵循上略有差异</p>
          </div>
        </div>
      )}
      <div className="flex items-center gap-5">
        <span className="w-14 flex-shrink-0 text-xs text-text-muted">尺寸</span>
        <SegmentedControl options={IMAGE_SIZE_TIERS} value={size} onChange={onSizeChange} />
      </div>
      <div className="flex items-start gap-5">
        <span className="w-14 flex-shrink-0 pt-2 text-xs text-text-muted">比例</span>
        <RatioPicker options={IMAGE_RATIOS} value={ratio} onChange={onRatioChange} />
      </div>
      <p className="text-xs text-text-muted">
        预计输出：{w} × {h} px
      </p>
    </Card>
  );
}
