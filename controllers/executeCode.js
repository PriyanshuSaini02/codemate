const axios = require("axios");

// Judge0 language ID mapping
const languageMap = {
  javascript: 63, // Node.js
  python: 71, // Python 3
  java: 62, // OpenJDK 13
  cpp: 54, // C++ (GCC 9.2.0)
};

const ExecuteFun = async (req, res) => {
  try {
    const { source_code, language_id, stdin } = req.body;

    // Use the language name to get the numeric ID from the map
    const judge0LanguageId = languageMap[language_id];

    if (!judge0LanguageId) {
      return res
        .status(400)
        .json({
          status: "Error",
          stderr: `Unsupported language: ${language_id}`,
        });
    }

    const judge0ApiUrl =
      process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com";
    const rapidApiHost =
      process.env.RAPIDAPI_HOST || "judge0-ce.p.rapidapi.com";
    const rapidApiKey = process.env.API_KEY;

    if (!rapidApiKey) {
      return res
        .status(500)
        .json({
          status: "Error",
          stderr: "Server misconfiguration: JUDGE0_API_KEY is not set",
        });
    }

    // 1. Submit the code
    const submissionRes = await axios.post(
      `${judge0ApiUrl}/submissions`,
      {
        source_code: source_code,
        language_id: judge0LanguageId,
        stdin: stdin,
        // You can add options like `expected_output`, `wall_time_limit`, `memory_limit` etc.
      },
      {
        headers: {
          "x-rapidapi-host": rapidApiHost,
          "x-rapidapi-key": rapidApiKey,
          "Content-Type": "application/json",
        },
      }
    );

    const submissionToken = submissionRes.data.token;

    // 2. Poll for the result
    let resultData;
    let isDone = false;
    const startTime = Date.now();
    const timeout = 10000; // 10 seconds timeout

    while (!isDone && Date.now() - startTime < timeout) {
      const resultRes = await axios.get(
        `${judge0ApiUrl}/submissions/${submissionToken}`,
        {
          headers: {
            "x-rapidapi-host": rapidApiHost,
            "x-rapidapi-key": rapidApiKey,
          },
        }
      );

      resultData = resultRes.data;
      // Status ID 3 means Accepted, 11 means compilation error, etc.
      // Check Judge0 docs for all status IDs.
      // Status ID 1 and 2 mean In Queue or Processing.
      if (resultData.status?.id > 2) {
        isDone = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Wait 500ms before polling again
      }
    }

    if (!isDone) {
      return res
        .status(504)
        .json({ status: "Timeout", stderr: "Execution timed out." });
    }

    // 3. Return the result
    res.json({
      status: resultData.status?.description,
      stdout: resultData.stdout,
      stderr: resultData.stderr,
      compile_output: resultData.compile_output,
    });
  } catch (error) {
    console.error("Judge0 API error:", error.response?.data || error.message);
    res
      .status(500)
      .json({ status: "Error", stderr: "Failed to execute code." });
  }
};

module.exports = ExecuteFun;
