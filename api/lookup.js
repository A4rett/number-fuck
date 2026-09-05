export default async function handler(req, res) {
  const phone = String(req.query.phone || "").trim();

  if (!phone) {
    return res.status(400).json({
      error: "Phone number is required"
    });
  }

  const results = [];
  const errors = [];

  const callerKey = process.env.CALLERKIT_API_KEY;
  const numlookupKey = process.env.NUMLOOKUP_API_KEY;
  const numverifyKey = process.env.NUMVERIFY_API_KEY;

  // =========================
  // CALLERKIT
  // =========================
  if (callerKey) {
    try {
      const endpoint =
        process.env.CALLERKIT_API_URL ||
        "https://api.caller-kit.com/v1/lookup";

      const r = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Api-key": callerKey,
          "Authorization": `Bearer ${callerKey}`
        },
        body: JSON.stringify({
          phone_number: phone,
          phone: phone,
          number: phone
        })
      });

      const text = await r.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      if (r.ok) {
        results.push({
          source: "CallerKit",
          data
        });
      } else {
        errors.push({
          source: "CallerKit",
          status: r.status,
          response: data
        });
      }
    } catch (error) {
      errors.push({
        source: "CallerKit",
        error: error.message
      });
    }
  }

  // =========================
  // NUMLOOKUP API
  // =========================
  if (numlookupKey) {
    try {
      const url =
        "https://api.numlookupapi.com/v1/validate/" +
        encodeURIComponent(phone);

      const r = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          apikey: numlookupKey
        }
      });

      const data = await r.json();

      if (r.ok) {
        results.push({
          source: "NumLookupAPI",
          data
        });
      } else {
        errors.push({
          source: "NumLookupAPI",
          status: r.status,
          response: data
        });
      }
    } catch (error) {
      errors.push({
        source: "NumLookupAPI",
        error: error.message
      });
    }
  }

  // =========================
  // NUMVERIFY
  // =========================
  if (numverifyKey) {
    try {
      const url = new URL(
        "https://apilayer.net/api/validate"
      );

      url.searchParams.set(
        "access_key",
        numverifyKey
      );

      url.searchParams.set(
        "number",
        phone
      );

      const r = await fetch(url);
      const data = await r.json();

      if (r.ok && data.success !== false) {
        results.push({
          source: "NumVerify",
          data
        });
      } else {
        errors.push({
          source: "NumVerify",
          status: r.status,
          response: data
        });
      }
    } catch (error) {
      errors.push({
        source: "NumVerify",
        error: error.message
      });
    }
  }

  // =========================
  // NOTHING CONNECTED
  // =========================
  if (!results.length) {
    return res.status(500).json({
      error:
        "هیچ API ـی بە سەرکەوتوویی وەڵامی نەدا.",
      details: errors
    });
  }

  // =========================
  // FIND VALUE
  // =========================
  function findValue(keys) {
    for (const item of results) {
      const data = item.data || {};

      for (const key of keys) {
        if (
          data[key] !== undefined &&
          data[key] !== null &&
          data[key] !== ""
        ) {
          return data[key];
        }
      }

      // nested data
      if (data.data) {
        for (const key of keys) {
          if (
            data.data[key] !== undefined &&
            data.data[key] !== null &&
            data.data[key] !== ""
          ) {
            return data.data[key];
          }
        }
      }

      // nested result
      if (data.result) {
        for (const key of keys) {
          if (
            data.result[key] !== undefined &&
            data.result[key] !== null &&
            data.result[key] !== ""
          ) {
            return data.result[key];
          }
        }
      }
    }

    return null;
  }

  // =========================
  // RESPONSE
  // =========================
  return res.status(200).json({
    success: true,

    name: findValue([
      "primary_name",
      "name",
      "full_name",
      "caller_name",
      "contact_name",
      "owner_name"
    ]),

    alias: findValue([
      "alias",
      "aliases",
      "other_names",
      "alternate_names"
    ]),

    country: findValue([
      "country_name",
      "country"
    ]),

    location: findValue([
      "location",
      "city",
      "region",
      "state"
    ]),

    carrier: findValue([
      "carrier",
      "network"
    ]),

    line_type: findValue([
      "line_type",
      "type"
    ]),

    spam: findValue([
      "spam",
      "spam_detected",
      "spam_count"
    ]),

    valid: findValue([
      "valid",
      "is_valid"
    ]),

    sources: results.map(
      item => item.source
    ),

    debug: {
      successful_sources: results.map(
        item => item.source
      ),
      failed_sources: errors.map(
        item => item.source
      )
    }
  });
}
