import os
import io
from PIL import Image, ImageDraw, PngImagePlugin
import qrcode

def create_sample_docs():
    output_dir = os.path.dirname(__file__)
    os.makedirs(output_dir, exist_ok=True)
    
    clean_path = os.path.join(output_dir, "aadhaar_clean.png")
    edited_path = os.path.join(output_dir, "aadhaar_edited.png")
    pan_clean_path = os.path.join(output_dir, "pan_clean.png")
    pan_mismatch_path = os.path.join(output_dir, "pan_mismatched.png")

    w, h = 800, 500
    
    # -------------------------------------------------------------
    # Generate real readable QR code
    # -------------------------------------------------------------
    qr = qrcode.QRCode(version=1, box_size=4, border=3)
    qr.add_data('543287654320')
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert('RGB')

    # -------------------------------------------------------------
    # 1. Create Clean Aadhaar Card (Valid Verhoeff: 5432 8765 4320)
    # -------------------------------------------------------------
    img = Image.new('RGB', (w, h), color=(250, 252, 255))
    draw = ImageDraw.Draw(img)
    draw.rectangle([10, 10, w-10, h-10], outline=(200, 215, 230), width=3)
    
    # Header Bands (Tricolour inspired)
    draw.rectangle([10, 10, w-10, 75], fill=(15, 23, 42))
    draw.rectangle([10, 75, w-10, 81], fill=(245, 158, 11))
    draw.rectangle([10, 81, w-10, 87], fill=(255, 255, 255))
    draw.rectangle([10, 87, w-10, 93], fill=(16, 185, 129))
    
    draw.text((30, 20), "भारत सरकार | GOVERNMENT OF INDIA", fill=(255, 255, 255))
    draw.text((30, 42), "भारतीय विशिष्ट पहचान प्राधिकरण | UIDAI", fill=(226, 232, 240))
    draw.text((w-160, 30), "आधार", fill=(245, 158, 11))

    # Photo Box on Left
    draw.rectangle([40, 120, 190, 300], fill=(220, 230, 242), outline=(148, 163, 184), width=2)
    draw.ellipse([85, 145, 145, 205], fill=(100, 116, 139))
    draw.ellipse([60, 210, 170, 295], fill=(100, 116, 139))

    # Details Area
    draw.text((215, 120), "Name / பெயர் / नाम :", fill=(100, 116, 139))
    draw.text((215, 142), "Demo Person", fill=(15, 23, 42))
    draw.text((215, 172), "Father: Demo Father", fill=(51, 65, 85))
    draw.text((215, 202), "DOB: 15/08/1998   YOB: 1998", fill=(30, 41, 59))
    draw.text((215, 232), "Gender / लिंग / பாலினம் : MALE", fill=(30, 41, 59))
    draw.text((215, 262), "Address: Kollam Sub District, Kollam, Kerala - 691001", fill=(71, 85, 105))

    # Real QR Code on Right
    img.paste(qr_img, (w - 180, 120))

    # Red Horizontal Divider
    draw.line([20, h - 90, w - 20, h - 90], fill=(220, 38, 38), width=2)

    # Bottom Aadhaar Number Bar (Valid Verhoeff: 5432 8765 4320)
    draw.rectangle([10, h - 85, w - 10, h - 10], fill=(241, 245, 249))
    draw.text((240, h - 75), "YOUR AADHAAR NUMBER / आधार संख्या :", fill=(100, 116, 139))
    draw.text((220, h - 45), "5432  8765  4320", fill=(220, 38, 38))
    
    img.save(clean_path, quality=95)
    print(f"[OK] Generated clean Aadhaar with scannable QR: {clean_path}")

    # -------------------------------------------------------------
    # 2. Create Tampered Aadhaar Card (Invalid Verhoeff: 5432 8765 4329 & ELA patch)
    # -------------------------------------------------------------
    edited_img = img.copy()
    edited_draw = ImageDraw.Draw(edited_img)
    
    # Overwrite number with 5432 8765 4329
    edited_draw.rectangle([430, h - 52, 560, h - 12], fill=(241, 245, 249))
    edited_draw.text((435, h - 45), "4329", fill=(180, 20, 20))
    
    # Tamper photo area with noticeable digital splice patch
    photo_patch_box = (45, 125, 185, 295)
    photo_patch = edited_img.crop(photo_patch_box)
    patch_buf = io.BytesIO()
    photo_patch.save(patch_buf, 'JPEG', quality=20)
    patch_buf.seek(0)
    degraded_photo = Image.open(patch_buf).convert('RGB')
    edited_img.paste(degraded_photo, photo_patch_box)
    
    # Add EXIF metadata
    meta = PngImagePlugin.PngInfo()
    meta.add_text("Software", "Adobe Photoshop 2024 (Windows)")
    meta.add_text("Comment", "Altered portrait and UID layer")
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
