const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

let accessToken = process.env.ZOHO_ACCESS_TOKEN;

// 🔁 Refresh token function
async function refreshAccessToken() {
  try {
    const response = await fetch("https://accounts.zoho.com/oauth/v2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: "refresh_token"
      })
    });

    const data = await response.json();

    if (data.access_token) {
      accessToken = data.access_token;
      console.log("✅ Refreshed Zoho access token");
    } else {
      console.error("❌ Failed to refresh token", data);
    }
  } catch (err) {
    console.error("Token refresh error:", err);
  }
}

// 🔁 Ensure fresh token every 50 minutes
setInterval(refreshAccessToken, 1000 * 60 * 50);
refreshAccessToken(); // also refresh at startup

// 🔹 Zoho CRM submission route
app.post("/submit-to-zoho", async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const zohoRes = await fetch("https://www.zohoapis.com/crm/v2/Leads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        data: [{
          Last_Name: name,
          Email: email,
          Phone: phone
        }]
      })
    });

    const zohoData = await zohoRes.json();

    if (zohoData.data?.[0]?.code === "SUCCESS") {
      res.status(200).json({ message: "Submitted to Zoho successfully", data: zohoData });
    } else {
      res.status(400).json({ error: "Zoho submission failed", details: zohoData });
    }
  } catch (err) {
    console.error("Zoho Error:", err);
    res.status(500).json({ error: "Error submitting to Zoho" });
  }
});

// ✅ Add your audit logic here too (if needed)

// 🔧 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
