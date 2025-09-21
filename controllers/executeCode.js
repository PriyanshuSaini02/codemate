const express = require("express");
const axios = require("axios");
const router = express.Router();

// Judge0 API endpoint
const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com/submissions";

// 🔐 If using RapidAPI, you need your key:
const JUDGE0_HEADERS = {
  "content-type": "application/json",
  "X-RapidAPI-Key": process.env.API_KEY, // keep in .env
  "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
};

router.post("/", async (req, res) => {
  try {
    const { language_id, source_code, stdin } = req.body;

    // Step 1: Submit code to Judge0
const submission = await axios.post(
  `${JUDGE0_URL}?base64_encoded=false&wait=true`,
  {
    language_id,
    source_code,
    stdin,
  },
  { headers: JUDGE0_HEADERS }
);

    // Step 2: Return result back
    res.json({
      stdout: submission.data.stdout,
      stderr: submission.data.stderr,
      status: submission.data.status.description,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Code execution failed" });
  }
});

module.exports = router;
