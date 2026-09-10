"""
forensics.py — Lightweight Image Forensics (Pillow + NumPy only)
Performs:
1. Error Level Analysis (ELA): 90% JPEG re-save residual measurement
2. EXIF Metadata Inspection: detects photo editing / tampering software
3. Noise-Consistency Grid: patch variance analysis via array slicing
Returns:
- forensic_score: float (0.0 to 1.0, higher = more suspicious)
- suspicious_regions: List[Dict[str, int]] with {x, y, w, h} coordinates
- metadata_flag: bool
"""

import io
from typing import Dict, Any, List, Tuple
from PIL import Image, ExifTags
import numpy as np


KNOWN_EDITING_SOFTWARE = [
    "photoshop", "gimp", "snapseed", "lightroom", "canva",
    "picsart", "pixlr", "paint.net", "coreldraw", "pixelmator",
    "vsco", "facetune", "adobe"
]


def check_exif_metadata(img: Image.Image) -> Tuple[bool, str]:
    """Inspects EXIF and image info metadata for known photo editing software tags."""
    found_flags = []
    
    # 1. Inspect PIL info dictionary
    if hasattr(img, "info") and isinstance(img.info, dict):
        for k, v in img.info.items():
            val_str = str(v).lower()
            for sw in KNOWN_EDITING_SOFTWARE:
                if sw in val_str:
                    found_flags.append(f"Found '{sw}' in metadata field '{k}'")
                
    # 2. Inspect standard EXIF tags
    try:
        exif = img.getexif()
        if exif:
            for tag_id, value in exif.items():
                tag_name = ExifTags.TAGS.get(tag_id, str(tag_id)).lower()
                val_str = str(value).lower()
                for sw in KNOWN_EDITING_SOFTWARE:
                    if sw in val_str:
                        found_flags.append(f"Found '{sw}' in EXIF tag '{tag_name}'")
    except Exception:
        pass
        
    if found_flags:
        return True, "; ".join(found_flags)
    return False, "Clean camera/scanner metadata (no editing software tags detected)."


def compute_ela_and_regions(
    orig_img: Image.Image,
    quality: int = 90,
    amplify: float = 15.0
) -> Tuple[float, List[Dict[str, int]]]:
    """
    Computes Error Level Analysis (ELA).
    Re-saves the image at 90% JPEG quality, measures absolute pixel residual,
    and identifies localized clusters with anomalous error rates.
    """
    orig_rgb = orig_img.convert("RGB")
    orig_arr = np.array(orig_rgb, dtype=np.float32)
    
    # In-memory JPEG recompression
    buf = io.BytesIO()
    orig_rgb.save(buf, format="JPEG", quality=quality)
    buf.seek(0)
    resaved_rgb = Image.open(buf).convert("RGB")
    resaved_arr = np.array(resaved_rgb, dtype=np.float32)
    
    # Absolute difference and amplification
    diff = np.abs(orig_arr - resaved_arr)
    err_magnitude = np.mean(diff * amplify, axis=2)
    
    h, w = err_magnitude.shape
    grid_h = 36
    grid_w = 36
    
    block_means = []
    block_coords = []
    
    # Grid analysis of localized ELA residuals
    for y in range(0, h - grid_h + 1, grid_h):
        for x in range(0, w - grid_w + 1, grid_w):
            patch = err_magnitude[y:y + grid_h, x:x + grid_w]
            block_means.append(float(np.mean(patch)))
            block_coords.append({"x": x, "y": y, "w": grid_w, "h": grid_h})
            
    if not block_means:
        return 0.0, []
        
    b_arr = np.array(block_means)
    med = float(np.median(b_arr))
    p95 = float(np.percentile(b_arr, 95))
    std = float(np.std(b_arr))
    
    suspicious_boxes: List[Dict[str, int]] = []
    
    # Flag blocks whose ELA residual is significantly elevated above local median
    # Disregard extreme card edges/banners (first/last 20px) to prevent border false positives
    for idx, mean_val in enumerate(block_means):
        bx = block_coords[idx]["x"]
        by = block_coords[idx]["y"]
        if by < 24 or by > h - 40 or bx < 20 or bx > w - 30:
            continue
        if mean_val > med * 2.2 and mean_val > p95 and std > 1.0:
            suspicious_boxes.append(block_coords[idx])
            
    # Calculate normalized ELA anomaly score
    disparity_ratio = (np.max(b_arr) - med) / max(1.0, std) if std > 0.01 else 0.0
    ela_score = min(1.0, (len(suspicious_boxes) * 0.12) + (max(0.0, disparity_ratio - 2.0) * 0.10))
    
    return float(round(ela_score, 3)), suspicious_boxes


def compute_noise_variance_grid(
    orig_img: Image.Image,
    grid_size: Tuple[int, int] = (16, 12)
) -> Tuple[float, List[Dict[str, int]]]:
    """
    Noise-consistency check: converts to grayscale array, splits into a grid of
    patches via array slicing, computes np.var() per patch, and flags patches
    deviating significantly from the expected variance profile.
    """
    gray = orig_img.convert("L")
    arr = np.array(gray, dtype=np.float32)
    h, w = arr.shape
    
    cols, rows = grid_size
    patch_w = max(16, w // cols)
    patch_h = max(16, h // rows)
    
    variances = []
    positions = []
    
    for r in range(rows):
        for c in range(cols):
            x1 = c * patch_w
            y1 = r * patch_h
            x2 = min(w, x1 + patch_w)
            y2 = min(h, y1 + patch_h)
            if x2 > x1 and y2 > y1:
                patch = arr[y1:y2, x1:x2]
                var_val = float(np.var(patch))
                variances.append(var_val)
                positions.append({"x": x1, "y": y1, "w": x2 - x1, "h": y2 - y1})
                
    if not variances:
        return 0.0, []
        
    var_arr = np.array(variances)
    med_var = float(np.median(var_arr))
    std_var = float(np.std(var_arr))
    
    outlier_boxes: List[Dict[str, int]] = []
    if std_var > 1e-3:
        for idx, var_val in enumerate(variances):
            pos = positions[idx]
            # Ignore border strips
            if pos["y"] < 24 or pos["y"] > h - 40:
                continue
            z_score = abs(var_val - med_var) / std_var
            # Detect sharp localized variance discontinuity
            if z_score > 2.8 and var_val < med_var * 0.25:
                # Strongly blurred patch inside an otherwise textured area
                outlier_boxes.append(pos)
                
    noise_score = min(1.0, len(outlier_boxes) * 0.15)
    return float(round(noise_score, 3)), outlier_boxes


def merge_overlapping_boxes(boxes: List[Dict[str, int]], padding: int = 8) -> List[Dict[str, int]]:
    """Merges spatially adjacent or overlapping suspicious bounding boxes."""
    if not boxes:
        return []
        
    merged = []
    used = [False] * len(boxes)
    
    for i in range(len(boxes)):
        if used[i]:
            continue
        cur = dict(boxes[i])
        used[i] = True
        
        expanded = True
        while expanded:
            expanded = False
            for j in range(len(boxes)):
                if not used[j]:
                    cand = boxes[j]
                    overlap = not (
                        cur["x"] + cur["w"] + padding < cand["x"] or
                        cand["x"] + cand["w"] + padding < cur["x"] or
                        cur["y"] + cur["h"] + padding < cand["y"] or
                        cand["y"] + cand["h"] + padding < cur["y"]
                    )
                    if overlap:
                        nx = min(cur["x"], cand["x"])
                        ny = min(cur["y"], cand["y"])
                        nw = max(cur["x"] + cur["w"], cand["x"] + cand["w"]) - nx
                        nh = max(cur["y"] + cur["h"], cand["y"] + cand["h"]) - ny
                        cur = {"x": nx, "y": ny, "w": nw, "h": nh}
                        used[j] = True
                        expanded = True
                        
        merged.append(cur)
        
    return merged[:8]  # Cap at top 8 clusters


def analyze_image_forensics(img: Image.Image) -> Dict[str, Any]:
    """
    Executes full multi-factor image forensics using Pillow + NumPy only.
    Returns:
    {
        "forensic_score": float (0.0 to 1.0),
        "suspicious_regions": [{"x": int, "y": int, "w": int, "h": int}],
        "metadata_flag": bool,
        "details": Dict[str, Any]
    }
    """
    # 1. EXIF Metadata Check
    metadata_flag, meta_reason = check_exif_metadata(img)
    
    # 2. Error Level Analysis (ELA)
    ela_score, ela_boxes = compute_ela_and_regions(img, quality=90)
    
    # 3. Noise consistency
    noise_score, noise_boxes = compute_noise_variance_grid(img)
    
    # Combine & merge suspicious regions
    all_raw_boxes = ela_boxes + noise_boxes
    suspicious_regions = merge_overlapping_boxes(all_raw_boxes)
    
    # Composite calculation (0.0 to 1.0)
    # ELA (45%), Noise (25%), Metadata Flag (30%)
    composite = (0.45 * ela_score) + (0.25 * noise_score) + (0.30 if metadata_flag else 0.0)
    
    # If suspicious regions are localized on the document, ensure appropriate baseline
    if suspicious_regions:
        composite = max(composite, min(0.85, 0.40 + len(suspicious_regions) * 0.08))
    elif not metadata_flag:
        # Natural document with no anomalies
        composite = min(composite, 0.12)
        
    composite = float(round(max(0.0, min(1.0, composite)), 3))
    
    return {
        "forensic_score": composite,
        "suspicious_regions": suspicious_regions,
        "metadata_flag": metadata_flag,
        "details": {
            "ela_score": ela_score,
            "noise_score": noise_score,
            "metadata_reason": meta_reason,
            "anomalous_patches_count": len(suspicious_regions)
        }
    }
