import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "localhost")
SMTP_PORT = int(os.getenv("SMTP_PORT", "1025"))
SMTP_USER = os.getenv("SMTP_USER", None)
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", None)
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "noreply@alumniportal.com")
SMTP_TLS = os.getenv("SMTP_TLS", "True").lower() == "true"


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    plain_text: Optional[str] = None
) -> bool:
    """Send email using SMTP - graceful fallback if SMTP unavailable"""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SMTP_FROM_EMAIL
        msg["To"] = to_email

        if plain_text:
            msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        try:
            async with aiosmtplib.SMTP(hostname=SMTP_HOST, port=SMTP_PORT, timeout=5) as smtp:
                if SMTP_TLS:
                    await smtp.starttls()
                if SMTP_USER and SMTP_PASSWORD:
                    await smtp.login(SMTP_USER, SMTP_PASSWORD)
                await smtp.send_message(msg)
        except Exception as e:
            logger.warning(f"SMTP unavailable, skipping email: {str(e)}")
            return False

        logger.info(f"Email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False


async def send_membership_confirmation(user_email: str, user_name: str, amount: int):
    """Send membership payment confirmation"""
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>Membership Payment Confirmed! 🎉</h2>
            <p>Hi {user_name},</p>
            <p>Your membership payment of ₹{amount/100:.2f} has been successfully processed.</p>
            <p>You now have access to:</p>
            <ul>
                <li>Post job opportunities</li>
                <li>Create and join events</li>
                <li>Alumni directory</li>
                <li>Reunion tickets</li>
            </ul>
            <p>Welcome to the alumni community!</p>
            <p>Best regards,<br>Alumni Portal Team</p>
        </body>
    </html>
    """
    await send_email(user_email, "Membership Activated ✓", html_content)


async def send_event_registration(user_email: str, user_name: str, event_name: str):
    """Send event registration confirmation"""
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>Event Registration Confirmed! 📅</h2>
            <p>Hi {user_name},</p>
            <p>You have successfully registered for <strong>{event_name}</strong>.</p>
            <p>Check your dashboard for ticket details and event information.</p>
            <p>See you there!<br>Alumni Portal Team</p>
        </body>
    </html>
    """
    await send_email(user_email, f"Registered for {event_name}", html_content)


async def send_job_posted_notification(recipients: list, job_title: str, company: str):
    """Send job posting notification to all alumni"""
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>New Job Opportunity! 💼</h2>
            <p>A new job has been posted on our portal:</p>
            <p><strong>{job_title}</strong> at <strong>{company}</strong></p>
            <p>Log in to your dashboard to view details and apply.</p>
            <p>Best regards,<br>Alumni Portal Team</p>
        </body>
    </html>
    """
    for email in recipients:
        await send_email(email, f"New Job: {job_title} at {company}", html_content)


async def send_admin_broadcast(recipients: list, subject: str, message: str):
    """Send broadcast message from admin"""
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>{subject}</h2>
            <p>{message}</p>
            <p>Alumni Portal Team</p>
        </body>
    </html>
    """
    for email in recipients:
        await send_email(email, subject, html_content)
