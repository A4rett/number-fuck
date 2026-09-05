NUMBER FINDER V4
=================

V4 uses multiple phone-data providers:
1) CallerKit
2) NumLookupAPI
3) NumVerify
plus public Google searches for Telegram, Snapchat, Instagram, Facebook and TikTok.

IMPORTANT
---------
API keys must be stored in Vercel Environment Variables, NOT in index.html or GitHub.

Vercel variables:
CALLERKIT_API_KEY
NUMLOOKUP_API_KEY
NUMVERIFY_API_KEY

CallerKit's current docs specify POST and an Api-key header. The exact endpoint/body can vary by their account/docs, so CALLERKIT_API_URL is also supported. If CallerKit gives you a different endpoint in your dashboard, set:
CALLERKIT_API_URL = that exact endpoint

NumLookupAPI:
GET https://api.numlookupapi.com/v1/validate/{number}
Header: apikey: YOUR_KEY

NumVerify:
GET https://apilayer.net/api/validate?access_key=YOUR_KEY&number=NUMBER

After adding environment variables in Vercel, redeploy the project.

Use only lawful, public/authorized data. Social buttons search public web pages and do not bypass private account settings.
