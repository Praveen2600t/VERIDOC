import os
import io
from PIL import Image, ImageDraw, PngImagePlugin

def create_sample_docs():
    output_dir = os.path.dirname(__file__)
    os.makedirs(output_dir, exist_ok=True)
    
    clean_path = os.path.join(output_dir, "aadhaar_clean.png")
    edited_path = os.path.join(output_dir, "aadhaar_edited.png")
    pan_clean_path = os.path.join(output_dir, "pan_clean.png")
    pan_mismatch_path = os.path.join(output_dir, "pan_mismatched.png")

    w, h = 800, 500
    
    # -------------------------------------------------------------
    # 1. Create Clean Aadhaar Card (Valid Verhoeff: 5432 8765 4320)
    # -------------------------------------------------------------
    img = Image.new('RGB', (w, h), color=(250, 252, 255))
    draw = ImageDraw.Draw(img)
    draw.rectangle([10, 10, w-10, h-10], outline=(200, 215, 230), width=3)
    
    draw.rectangle([10, 10, w-10, 80], fill=(15, 23, 42))
    draw.rectangle([10, 80, w-10, 86], fill=(245, 158, 11))
    draw.rectangle([10, 86, w-10, 92], fill=(255, 255, 255))
    draw.rectangle([10, 92, w-10, 98], fill=(16, 185, 129))
    
    draw.text((30, 25), "GOVERNMENT OF INDIA", fill=(255, 255, 255))
    draw.text((30, 48), "UNIQUE IDENTIFICATION AUTHORITY OF INDIA", fill=(226, 232, 240))
    draw.text((w-180, 35), "AADHAAR", fill=(245, 158, 11))

    # Photo Box
    draw.rectangle([40, 130, 190, 310], fill=(220, 230, 242), outline=(148, 163, 184), width=2)
    draw.ellipse([85, 155, 145, 215], fill=(100, 116, 139))
    draw.ellipse([60, 220, 170, 305], fill=(100, 116, 139))

    draw.text((220, 135), "Name / பெயர் / പേര്:", fill=(100, 116, 139))
    draw.text((220, 160), "PRITHIKA C", fill=(15, 23, 42))
    draw.text((220, 195), "DOB: 15/08/2002    GENDER: FEMALE", fill=(30, 41, 59))
    draw.text((220, 230), "Address / വിലാസം:", fill=(100, 116, 139))
    draw.text((220, 255), "Kollam Sub District, Kollam, Kerala - 691001", fill=(71, 85, 105))

    # Fake QR Code Box
    draw.rectangle([w-210, 130, w-40, 300], fill=(255, 255, 255), outline=(203, 213, 225), width=2)
    for rx in range(w-200, w-50, 15):
        for ry in range(140, 290, 15):
            if (rx + ry) % 7 == 0 or (rx * ry) % 5 == 0:
                draw.rectangle([rx, ry, rx+10, ry+10], fill=(15, 23, 42))

    # Bottom Aadhaar Number Bar (Valid Verhoeff ID: 5432 8765 4320)
    draw.rectangle([10, h-100, w-10, h-10], fill=(241, 245, 249))
    draw.line([10, h-100, w-10, h-100], fill=(226, 232, 240), width=2)
    draw.text((240, h-85), "YOUR AADHAAR NUMBER / आधार संख्या :", fill=(100, 116, 139))
    draw.text((220, h-55), "5432  8765  4320", fill=(220, 38, 38))
    
    img.save(clean_path, quality=95)
    print(f"[OK] Generated clean Aadhaar: {clean_path}")

    # -------------------------------------------------------------
    # 2. Create Tampered Aadhaar Card (Invalid Verhoeff: 5432 8765 4329 & ELA patch)
    # -------------------------------------------------------------
    edited_img = img.copy()
    edited_draw = ImageDraw.Draw(edited_img)
    
    # Overwrite number with 5432 8765 4329
    edited_draw.rectangle([430, h-62, 560, h-22], fill=(255, 255, 255))
    edited_draw.text((435, h-55), "4329", fill=(180, 20, 20))
    
    # Tamper photo area with noticeable digital splice patch
    photo_patch_box = (45, 135, 185, 305)
    photo_patch = edited_img.crop(photo_patch_box)
    patch_buf = io.BytesIO()
    photo_patch.save(patch_buf, 'JPEG', quality=25)
    patch_buf.seek(0)
    degraded_photo = Image.open(patch_buf).convert('RGB')
    edited_img.paste(degraded_photo, photo_patch_box)
    
    # Add EXIF metadata
    meta = PngImagePlugin.PngInfo()
    meta.add_text("Software", "Adobe Photoshop 2024 (Windows)")
    meta.add_text("Comment", "Altered portrait layer")
    edited_img.save(edited_path, quality=90, pnginfo=meta)
    print(f"[OK] Generated tampered Aadhaar: {edited_path}")

    # -------------------------------------------------------------
    # 3. Create Clean PAN Card (PRITHIKA CHANDRAN, ABCDE1234F)
    # -------------------------------------------------------------
    pan_img = Image.new('RGB', (w, h), color=(240, 249, 255))
    pdraw = ImageDraw.Draw(pan_img)
    pdraw.rectangle([10, 10, w-10, h-10], outline=(186, 230, 253), width=3)
    pdraw.rectangle([10, 10, w-10, 75], fill=(3, 105, 161))
    pdraw.text((30, 22), "INCOME TAX DEPARTMENT", fill=(255, 255, 255))
    pdraw.text((30, 44), "GOVT. OF INDIA", fill=(224, 242, 254))
    pdraw.text((w-220, 30), "PERMANENT ACCOUNT CARD", fill=(255, 255, 255))

    pdraw.rectangle([40, 110, 180, 280], fill=(224, 242, 254), outline=(125, 211, 252), width=2)
    pdraw.ellipse([80, 135, 140, 195], fill=(2, 132, 199))
    pdraw.ellipse([55, 200, 165, 275], fill=(2, 132, 199))

    pdraw.text((220, 115), "Name:", fill=(100, 116, 139))
    pdraw.text((220, 140), "PRITHIKA CHANDRAN", fill=(15, 23, 42))
    pdraw.text((220, 175), "Father's Name: Chandran Pillai", fill=(51, 65, 85))
    pdraw.text((220, 210), "Date of Birth: 15/08/2002", fill=(51, 65, 85))
    pdraw.text((220, 250), "Permanent Account Number:", fill=(100, 116, 139))
    pdraw.text((220, 275), "ABCDE1234F", fill=(15, 23, 42))
    
    pan_img.save(pan_clean_path, quality=95)
    print(f"[OK] Generated matching PAN: {pan_clean_path}")

    # -------------------------------------------------------------
    # 4. Create Mismatched PAN Card (ANANYA VERMA, XYZPK9876Q)
    # -------------------------------------------------------------
    mismatch_img = pan_img.copy()
    mdraw = ImageDraw.Draw(mismatch_img)
    mdraw.rectangle([215, 135, 550, 170], fill=(240, 249, 255))
    mdraw.text((220, 140), "ANANYA VERMA", fill=(15, 23, 42))
    mdraw.rectangle([215, 205, 550, 235], fill=(240, 249, 255))
    mdraw.text((220, 210), "Date of Birth: 01/01/1998", fill=(51, 65, 85))
    mdraw.rectangle([215, 270, 550, 310], fill=(240, 249, 255))
    mdraw.text((220, 275), "XYZPK9876Q", fill=(15, 23, 42))

    mismatch_img.save(pan_mismatch_path, quality=95)
    print(f"[OK] Generated mismatched PAN: {pan_mismatch_path}")

if __name__ == "__main__":
    create_sample_docs()
