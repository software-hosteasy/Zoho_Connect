const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // Or global fetch in Node 18+
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Combined Zoho + optional audit proxy
app.post("/proxy", async (req, res) => {
  const { listing_id, name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // 1️⃣ Submit to Zoho CRM
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

    if (!zohoData.data || zohoData.data[0].code !== "SUCCESS") {
      return res.status(400).json({ error: "Zoho submission failed", details: zohoData });
    }

    // 2️⃣ Optional audit request (only if listing_id is provided)
    if (listing_id) {
      try {
        const auditRes = await fetch("https://your-external-api.com/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listing_id })
        });

        const auditData = await auditRes.json();
        console.log("Audit success:", auditData);
      } catch (auditError) {
        console.warn("Audit failed:", auditError.message);
        // We don't stop the response if audit fails
      }
    }

    // ✅ Final success response
    res.status(200).json({ message: "Submitted to Zoho successfully", data: zohoData });

  } catch (error) {
    console.error("Zoho Error:", error);
    res.status(500).json({ error: "Error submitting to Zoho" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
