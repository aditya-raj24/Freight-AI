import os
import base64
import smtplib
import requests
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

# Load env variables
load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REFRESH_TOKEN = os.getenv("REFRESH_TOKEN")
EMAIL_USER = os.getenv("EMAIL_USER")

def get_oauth2_access_token():
    """Retrieves a fresh access token from Google OAuth2 server using the refresh token."""
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": REFRESH_TOKEN,
        "grant_type": "refresh_token"
    }
    response = requests.post(token_url, data=data)
    response_data = response.json()
    if "access_token" in response_data:
        return response_data["access_token"]
    else:
        raise Exception(f"Failed to retrieve Google OAuth2 access token: {response_data}")

def send_email(to_email, subject, html_content):
    """Sends an email using Gmail's SMTP server via XOAUTH2 authentication."""
    try:
        access_token = get_oauth2_access_token()
        
        # Format the XOAUTH2 authentication string
        auth_string = f"user={EMAIL_USER}\x01auth=Bearer {access_token}\x01\x01"
        auth_string_encoded = base64.b64encode(auth_string.encode('utf-8')).decode('utf-8')
        
        # Connect to Gmail SMTP
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.ehlo()
        server.starttls() # Secure connection
        server.ehlo()
        
        # Authenticate
        server.docmd("AUTH", "XOAUTH2 " + auth_string_encoded)
        
        # Build MIME Message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"Freight App <{EMAIL_USER}>"
        msg['To'] = to_email
        
        msg.attach(MIMEText(html_content, 'html'))
        
        # Send
        server.sendmail(EMAIL_USER, to_email, msg.as_string())
        server.quit()
        print(f"Email sent successfully to {to_email}")
    except Exception as e:
        print(f"Error sending email: {e}")

# Premium HTML Template Builder
def get_premium_template(title, name, main_message, detail_text=None, accent_color="#0284c7"):
    return f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background-color: {accent_color}; padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Freight App</h1>
        <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">{title}</p>
      </div>
      <div style="padding: 40px 32px;">
        <p style="margin: 0 0 16px 0; font-size: 18px; color: #1e293b; font-weight: 600;">Hello {name},</p>
        <p style="margin: 0 0 32px 0; font-size: 16px; color: #475569; line-height: 1.6;">{main_message}</p>
        
        {f'''
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
          <span style="display: block; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 8px; font-weight: 600;">Shipment / Payment Amount</span>
          <span style="display: block; font-size: 36px; font-weight: 800; color: {accent_color};">{detail_text}</span>
        </div>
        ''' if detail_text else ''}
        
        <p style="margin: 0; font-size: 14px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 24px;">
          Securely powered by Freight App.<br/>
          Please do not reply to this automated message.
        </p>
      </div>
    </div>
    """

# Specialized Sending Functions
def send_registration_email(user_email, name):
    subject = "Welcome to Freight App"
    html = get_premium_template(
        "Welcome Aboard 🚀", 
        name, 
        "Your account has been successfully created. You can now manage your shipments and logistics securely.", 
        None, 
        "#0284c7"
    )
    send_email(user_email, subject, html)

def send_transaction_email(user_email, name, amount, to_account):
    subject = "Booking Successful"
    html = get_premium_template(
        "Booking Successful ✅", 
        name, 
        f"Your booking/transfer to account ending in {str(to_account)[-4:]} was securely processed.", 
        f"Rupees {amount}", 
        "#0284c7"
    )
    send_email(user_email, subject, html)

def send_received_funds_email(user_email, name, amount, from_name):
    subject = "Funds Received Successfully"
    html = get_premium_template(
        "Funds Received 💸", 
        name, 
        f"Great news! Your account has just been credited with funds from <b>{from_name}</b>.", 
        f"+Rupees {amount}", 
        "#10b981"
    )
    send_email(user_email, subject, html)
