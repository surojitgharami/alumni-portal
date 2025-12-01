from typing import Optional


async def send_email(
    to_email: str,
    subject: str,
    body: str,
    html_body: Optional[str] = None
) -> bool:
    print(f"Email would be sent to: {to_email}")
    print(f"Subject: {subject}")
    print(f"Body: {body[:100]}...")
    return True


async def send_payment_confirmation(
    to_email: str,
    user_name: str,
    amount: float,
    purpose: str,
    payment_id: str
):
    subject = f"Payment Confirmation - Alumni Portal"
    body = f"""
Dear {user_name},

Your payment has been successfully processed.

Payment Details:
- Amount: INR {amount / 100:.2f}
- Purpose: {purpose.title()}
- Payment ID: {payment_id}

Thank you for your payment!

Best regards,
Alumni Portal Team
"""
    return await send_email(to_email, subject, body)


async def send_event_registration_confirmation(
    to_email: str,
    user_name: str,
    event_title: str,
    ticket_id: str,
    event_date: str
):
    subject = f"Event Registration Confirmed - {event_title}"
    body = f"""
Dear {user_name},

Your registration for the event has been confirmed.

Event Details:
- Event: {event_title}
- Date: {event_date}
- Ticket ID: {ticket_id}

Please keep this ticket ID for check-in at the event.

Best regards,
Alumni Portal Team
"""
    return await send_email(to_email, subject, body)


async def send_welcome_email(
    to_email: str,
    user_name: str
):
    subject = "Welcome to Alumni Portal"
    body = f"""
Dear {user_name},

Welcome to the Alumni Portal! Your account has been successfully created.

To unlock all features including:
- Posting jobs
- Joining paid events
- Receiving event invitations

Please complete your membership payment.

Best regards,
Alumni Portal Team
"""
    return await send_email(to_email, subject, body)
