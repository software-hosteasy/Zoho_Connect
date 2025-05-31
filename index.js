const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // Or built-in `fetch` if using Node 18+
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Existing audit route
app.post("/proxy", async (req, res) => {
  const { listing_id } = req.body;

  try {
    const response = await fetch("https://your-external-api.com/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error("Audit API error:", err);
    res.status(500).json({ error: "Failed to fetch audit" });
  }
});

// 🔹 New Zoho CRM route
app.post("/submit-to-zoho", async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const zohoResponse = await fetch("https://www.zohoapis.com/crm/v2/Leads", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.ZOHO_ACCESS_TOKEN}`,
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

    const zohoData = await zohoResponse.json();

    if (zohoData.data && zohoData.data[0].code === "SUCCESS") {
      res.status(200).json({ message: "Submitted to Zoho successfully", data: zohoData });
    } else {
      res.status(400).json({ error: "Zoho submission failed", details: zohoData });
    }
  } catch (error) {
    console.error("Zoho Error:", error);
    res.status(500).json({ error: "Error submitting to Zoho" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
