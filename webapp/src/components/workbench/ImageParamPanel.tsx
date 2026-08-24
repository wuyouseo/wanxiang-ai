import { IMAGE_DIMENSIONS, IMAGE_RATIOS, IMAGE_SIZE_TIERS } from "../../lib/constants";
import type { ImageRatio, ImageSizeTier } from "../../lib/types";
import { Card } from "../ui/Card";
import { RatioPicker } from "../ui/RatioPicker";
import { SegmentedControl } from "../ui/SegmentedControl";

export function ImageParamPanel({
  size,
  ratio,
  onSizeChange,
  onRatioChange,
}: {
  size: ImageSizeTier;
  ratio: ImageRatio;
  onSizeChange: (v: ImageSizeTier) => void;
  onRatioChange: (v: ImageRatio) => void;
}) {
  const [w, h] = IMAGE_DIMENSIONS[ratio][size];

  return (
    <Card className="flex flex-col gap-5 p-5">
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
