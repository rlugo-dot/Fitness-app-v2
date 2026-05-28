import httpx
from app.config import RESEND_API_KEY, FROM_EMAIL, APP_URL


async def send_email(to: str, subject: str, html: str) -> bool:
    if not RESEND_API_KEY:
        return False
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
                json={"from": FROM_EMAIL, "to": [to], "subject": subject, "html": html},
                timeout=10,
            )
        return r.status_code in (200, 201)
    except Exception:
        return False


def _base(body: str) -> str:
    return f"""
    <div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:32px 16px;color:#111">
      <div style="text-align:center;margin-bottom:28px">
        <div style="display:inline-flex;align-items:center;justify-content:center;
                    width:56px;height:56px;background:#16a34a;border-radius:16px;
                    font-size:28px;font-weight:bold;color:#fff">P</div>
        <p style="margin:8px 0 0;font-size:13px;color:#6b7280;font-weight:500;letter-spacing:.04em">PHITNESS</p>
      </div>
      {body}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0">
      <p style="font-size:11px;color:#9ca3af;text-align:center">
        Filipino Health &amp; Nutrition · <a href="{APP_URL}" style="color:#16a34a">phitness.app</a>
      </p>
    </div>
    """


async def send_application_approved(to: str, name: str, monthly_fee: int) -> bool:
    first = name.split()[0]
    html = _base(f"""
      <h2 style="margin:0 0 8px;font-size:22px">🎉 You're approved, {first}!</h2>
      <p style="color:#374151;line-height:1.6">
        Great news — your Phitness professional application has been reviewed and <strong>approved</strong>.
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:20px 0">
        <p style="margin:0;font-size:14px;color:#15803d;font-weight:600">Next step: Complete your listing</p>
        <p style="margin:8px 0 0;font-size:13px;color:#166534;line-height:1.5">
          Your listing fee is <strong>₱{monthly_fee:,}/month</strong>.
          Once payment is confirmed, your profile will go live and you'll get access to your Pro Portal.
        </p>
      </div>
      <p style="color:#374151;font-size:13px;line-height:1.6">
        We'll reach out with payment instructions. If you have questions, just reply to this email.
      </p>
      <a href="{APP_URL}" style="display:inline-block;margin-top:8px;padding:12px 24px;
         background:#16a34a;color:#fff;border-radius:10px;text-decoration:none;
         font-weight:600;font-size:14px">Open Phitness</a>
    """)
    return await send_email(to, "Your Phitness application was approved! 🎉", html)


async def send_application_rejected(to: str, name: str, notes: str | None) -> bool:
    first = name.split()[0]
    notes_block = (
        f'<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin:20px 0">'
        f'<p style="margin:0;font-size:13px;color:#991b1b"><strong>Reviewer notes:</strong> {notes}</p></div>'
        if notes else ""
    )
    html = _base(f"""
      <h2 style="margin:0 0 8px;font-size:22px">Application update, {first}</h2>
      <p style="color:#374151;line-height:1.6">
        Thank you for your interest in joining Phitness as a professional.
        After reviewing your application, we're unable to approve it at this time.
      </p>
      {notes_block}
      <p style="color:#374151;font-size:13px;line-height:1.6">
        If you believe this was a mistake or have updated credentials, feel free to reply to this email.
      </p>
    """)
    return await send_email(to, "Update on your Phitness application", html)


async def send_application_activated(to: str, name: str) -> bool:
    first = name.split()[0]
    html = _base(f"""
      <h2 style="margin:0 0 8px;font-size:22px">You're live on Phitness! 🚀</h2>
      <p style="color:#374151;line-height:1.6">
        Hi {first}, your profile is now <strong>live</strong> in the Phitness professional directory.
        Filipino health seekers can now find and book sessions with you.
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:20px 0">
        <p style="margin:0;font-size:14px;color:#15803d;font-weight:600">Access your Pro Portal</p>
        <p style="margin:8px 0 0;font-size:13px;color:#166534;line-height:1.5">
          Log in to Phitness with this email address. Go to <strong>Profile → Pro Portal</strong>
          to manage bookings, toggle your availability, and view client data.
        </p>
      </div>
      <a href="{APP_URL}" style="display:inline-block;margin-top:8px;padding:12px 24px;
         background:#16a34a;color:#fff;border-radius:10px;text-decoration:none;
         font-weight:600;font-size:14px">Go to My Pro Portal →</a>
    """)
    return await send_email(to, "Your Phitness profile is live! 🚀", html)
