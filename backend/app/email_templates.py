"""Email templates with HTML and plain text"""

def get_alumni_upgrade_template(name: str, unsubscribe_link: str = ""):
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #0F4C81;">Welcome to Alumni Network!</h1>
            <p>Hi {name},</p>
            <p>Congratulations! You have been automatically upgraded to <strong>Alumni</strong> status.</p>
            <p>You now have access to:</p>
            <ul>
                <li>Exclusive job opportunities</li>
                <li>Alumni networking events</li>
                <li>Achievement tracking</li>
                <li>Alumni directory</li>
                <li>Discussion board</li>
            </ul>
            <p><a href="https://alumni.example.com/login" style="background-color: #0F4C81; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a></p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">
                {f'<a href="{unsubscribe_link}" style="color: #0F4C81;">Unsubscribe</a>' if unsubscribe_link else ''}
            </p>
        </div>
    </body>
    </html>
    """
    
    text = f"""
    Welcome to Alumni Network!
    
    Hi {name},
    
    Congratulations! You have been automatically upgraded to Alumni status.
    
    You now have access to:
    - Exclusive job opportunities
    - Alumni networking events
    - Achievement tracking
    - Alumni directory
    - Discussion board
    
    Login: https://alumni.example.com/login
    
    {f'Unsubscribe: {unsubscribe_link}' if unsubscribe_link else ''}
    """
    
    return {"html": html, "text": text}

def get_password_reset_template(reset_link: str, name: str, unsubscribe_link: str = ""):
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #0F4C81;">Password Reset</h1>
            <p>Hi {name},</p>
            <p>We received a request to reset your password. Click the link below to proceed:</p>
            <p><a href="{reset_link}" style="background-color: #0F4C81; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
            <p>This link expires in 24 hours.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">
                {f'<a href="{unsubscribe_link}" style="color: #0F4C81;">Unsubscribe</a>' if unsubscribe_link else ''}
            </p>
        </div>
    </body>
    </html>
    """
    
    text = f"""
    Password Reset
    
    Hi {name},
    
    We received a request to reset your password. Click the link below to proceed:
    
    {reset_link}
    
    This link expires in 24 hours.
    
    If you didn't request this, please ignore this email.
    
    {f'Unsubscribe: {unsubscribe_link}' if unsubscribe_link else ''}
    """
    
    return {"html": html, "text": text}

def get_event_registration_template(event_name: str, date: str, name: str, unsubscribe_link: str = ""):
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #0F4C81;">Event Confirmation</h1>
            <p>Hi {name},</p>
            <p>You're registered for: <strong>{event_name}</strong></p>
            <p>Date: <strong>{date}</strong></p>
            <p>See you there!</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">
                {f'<a href="{unsubscribe_link}" style="color: #0F4C81;">Unsubscribe from newsletters</a>' if unsubscribe_link else ''}
            </p>
        </div>
    </body>
    </html>
    """
    
    text = f"""
    Event Confirmation
    
    Hi {name},
    
    You're registered for: {event_name}
    Date: {date}
    
    See you there!
    
    {f'Unsubscribe: {unsubscribe_link}' if unsubscribe_link else ''}
    """
    
    return {"html": html, "text": text}

def get_payment_confirmation_template(amount: str, date: str, name: str, unsubscribe_link: str = ""):
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #16A34A;">Payment Confirmed</h1>
            <p>Hi {name},</p>
            <p>Thank you for your payment!</p>
            <p>Amount: <strong>₹{amount}</strong></p>
            <p>Date: <strong>{date}</strong></p>
            <p>Your alumni membership is now active.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">
                {f'<a href="{unsubscribe_link}" style="color: #0F4C81;">Unsubscribe</a>' if unsubscribe_link else ''}
            </p>
        </div>
    </body>
    </html>
    """
    
    text = f"""
    Payment Confirmed
    
    Hi {name},
    
    Thank you for your payment!
    
    Amount: ₹{amount}
    Date: {date}
    
    Your alumni membership is now active.
    
    {f'Unsubscribe: {unsubscribe_link}' if unsubscribe_link else ''}
    """
    
    return {"html": html, "text": text}
