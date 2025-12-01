import qrcode
from io import BytesIO
import base64


def generate_ticket_qr(ticket_id: str, event_id: str, user_id: str) -> str:
    qr_data = f"TICKET:{ticket_id}|EVENT:{event_id}|USER:{user_id}"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{img_base64}"


def decode_ticket_qr(qr_string: str) -> dict:
    try:
        parts = qr_string.split("|")
        data = {}
        for part in parts:
            key, value = part.split(":")
            data[key.lower()] = value
        return data
    except Exception:
        return None
