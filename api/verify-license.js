// Vercel Serverless Function to verify Gumroad licenses

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { license_key } = req.body;

  if (!license_key) {
    return res.status(400).json({ 
      success: false, 
      error: 'License key is required' 
    });
  }

  try {
    // Verify with Gumroad API
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        product_id: process.env.GUMROAD_PRODUCT_ID,
        license_key: license_key,
      }),
    });

    const data = await response.json();

    // Check if license is valid
    if (data.success && data.purchase) {
      // Optional: Check if refunded or chargebacked
      if (data.purchase.refunded || data.purchase.chargebacked) {
        return res.status(200).json({
          success: false,
          error: 'This license has been refunded or chargebacked'
        });
      }

      // License is valid
      return res.status(200).json({
        success: true,
        purchase: {
          email: data.purchase.email,
          sale_timestamp: data.purchase.sale_timestamp,
        }
      });
    } else {
      // Invalid license
      return res.status(200).json({
        success: false,
        error: 'Invalid license key'
      });
    }
  } catch (error) {
    console.error('Gumroad verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Verification service temporarily unavailable'
    });
  }
}
