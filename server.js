const express = require("express");
const crypto = require("crypto");
const app = express();

app.use(express.json());

// In-memory storage (use a database in production)
const strings = new Map();

// Helper function to compute SHA-256 hash
function computeSHA256(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

// Helper function to check if string is palindrome
function isPalindrome(str) {
  const cleaned = str.toLowerCase().replace(/\s/g, "");
  return cleaned === cleaned.split("").reverse().join("");
}

// Helper function to count unique characters
function countUniqueCharacters(str) {
  return new Set(str).size;
}

// Helper function to count words
function countWords(str) {
  return str
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

// Helper function to create character frequency map
function createCharFrequencyMap(str) {
  const map = {};
  for (const char of str) {
    map[char] = (map[char] || 0) + 1;
  }
  return map;
}

// Helper function to analyze string
function analyzeString(value) {
  return {
    length: value.length,
    is_palindrome: isPalindrome(value),
    unique_characters: countUniqueCharacters(value),
    word_count: countWords(value),
    sha256_hash: computeSHA256(value),
    character_frequency_map: createCharFrequencyMap(value),
  };
}

// Helper function to parse natural language query
function parseNaturalLanguage(query) {
  const filters = {};
  const lowerQuery = query.toLowerCase();

  // Parse word count
  if (lowerQuery.includes("single word")) {
    filters.word_count = 1;
  } else if (lowerQuery.match(/(\d+)\s+words?/)) {
    filters.word_count = parseInt(lowerQuery.match(/(\d+)\s+words?/)[1]);
  }

  // Parse palindrome
  if (lowerQuery.includes("palindrom")) {
    filters.is_palindrome = true;
  }

  // Parse length constraints
  const longerThan = lowerQuery.match(/longer than (\d+)/);
  if (longerThan) {
    filters.min_length = parseInt(longerThan[1]) + 1;
  }

  const shorterThan = lowerQuery.match(/shorter than (\d+)/);
  if (shorterThan) {
    filters.max_length = parseInt(shorterThan[1]) - 1;
  }

  const minLength = lowerQuery.match(/at least (\d+) characters?/);
  if (minLength) {
    filters.min_length = parseInt(minLength[1]);
  }

  const maxLength = lowerQuery.match(/at most (\d+) characters?/);
  if (maxLength) {
    filters.max_length = parseInt(maxLength[1]);
  }

  // Parse contains character
  const containsLetter = lowerQuery.match(
    /contain(?:ing|s)? (?:the )?letter ([a-z])/
  );
  if (containsLetter) {
    filters.contains_character = containsLetter[1];
  }

  // Parse first vowel
  if (lowerQuery.includes("first vowel")) {
    filters.contains_character = "a";
  }

  return filters;
}

// Helper function to apply filters
function applyFilters(data, filters) {
  return data.filter((item) => {
    if (
      filters.is_palindrome !== undefined &&
      item.properties.is_palindrome !== filters.is_palindrome
    ) {
      return false;
    }
    if (
      filters.min_length !== undefined &&
      item.properties.length < filters.min_length
    ) {
      return false;
    }
    if (
      filters.max_length !== undefined &&
      item.properties.length > filters.max_length
    ) {
      return false;
    }
    if (
      filters.word_count !== undefined &&
      item.properties.word_count !== filters.word_count
    ) {
      return false;
    }
    if (
      filters.contains_character !== undefined &&
      !item.value
        .toLowerCase()
        .includes(filters.contains_character.toLowerCase())
    ) {
      return false;
    }
    return true;
  });
}

// 1. POST /strings - Create/Analyze String
app.post("/strings", (req, res) => {
  const { value } = req.body;

  // Validate request
  if (!req.body.hasOwnProperty("value")) {
    return res.status(400).json({ error: 'Missing "value" field' });
  }

  if (typeof value !== "string") {
    return res
      .status(422)
      .json({ error: 'Invalid data type for "value" (must be string)' });
  }

  // Check if string already exists
  if (strings.has(value)) {
    return res
      .status(409)
      .json({ error: "String already exists in the system" });
  }

  // Analyze and store string
  const properties = analyzeString(value);
  const stringData = {
    id: properties.sha256_hash,
    value,
    properties,
    created_at: new Date().toISOString(),
  };

  strings.set(value, stringData);

  res.status(201).json(stringData);
});

// 2. GET /strings/:string_value - Get Specific String
app.get("/strings/:string_value", (req, res) => {
  const stringValue = req.params.string_value;

  if (!strings.has(stringValue)) {
    return res
      .status(404)
      .json({ error: "String does not exist in the system" });
  }

  res.status(200).json(strings.get(stringValue));
});

// 4. GET /strings/filter-by-natural-language - Natural Language Filtering
app.get("/strings/filter-by-natural-language", (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Missing query parameter" });
  }

  try {
    const parsedFilters = parseNaturalLanguage(query);

    if (Object.keys(parsedFilters).length === 0) {
      return res
        .status(400)
        .json({ error: "Unable to parse natural language query" });
    }

    const allStrings = Array.from(strings.values());
    const filtered = applyFilters(allStrings, parsedFilters);

    res.status(200).json({
      data: filtered,
      count: filtered.length,
      interpreted_query: {
        original: query,
        parsed_filters: parsedFilters,
      },
    });
  } catch (error) {
    res.status(400).json({ error: "Unable to parse natural language query" });
  }
});

// 3. GET /strings - Get All Strings with Filtering
app.get("/strings", (req, res) => {
  const filters = {};

  // Parse query parameters
  if (req.query.is_palindrome !== undefined) {
    if (req.query.is_palindrome === "true") {
      filters.is_palindrome = true;
    } else if (req.query.is_palindrome === "false") {
      filters.is_palindrome = false;
    } else {
      return res.status(400).json({
        error: "Invalid value for is_palindrome (must be true or false)",
      });
    }
  }

  if (req.query.min_length !== undefined) {
    const minLength = parseInt(req.query.min_length);
    if (isNaN(minLength) || minLength < 0) {
      return res.status(400).json({
        error: "Invalid value for min_length (must be a positive integer)",
      });
    }
    filters.min_length = minLength;
  }

  if (req.query.max_length !== undefined) {
    const maxLength = parseInt(req.query.max_length);
    if (isNaN(maxLength) || maxLength < 0) {
      return res.status(400).json({
        error: "Invalid value for max_length (must be a positive integer)",
      });
    }
    filters.max_length = maxLength;
  }

  if (req.query.word_count !== undefined) {
    const wordCount = parseInt(req.query.word_count);
    if (isNaN(wordCount) || wordCount < 0) {
      return res.status(400).json({
        error: "Invalid value for word_count (must be a positive integer)",
      });
    }
    filters.word_count = wordCount;
  }

  if (req.query.contains_character !== undefined) {
    if (
      typeof req.query.contains_character !== "string" ||
      req.query.contains_character.length !== 1
    ) {
      return res.status(400).json({
        error:
          "Invalid value for contains_character (must be a single character)",
      });
    }
    filters.contains_character = req.query.contains_character;
  }

  // Get all strings and apply filters
  const allStrings = Array.from(strings.values());
  const filtered = applyFilters(allStrings, filters);

  res.status(200).json({
    data: filtered,
    count: filtered.length,
    filters_applied: filters,
  });
});

// 5. DELETE /strings/:string_value - Delete String
app.delete("/strings/:string_value", (req, res) => {
  const stringValue = req.params.string_value;

  if (!strings.has(stringValue)) {
    return res
      .status(404)
      .json({ error: "String does not exist in the system" });
  }

  strings.delete(stringValue);
  res.status(204).send();
});

// // Health check endpoint
// app.get("/health", (req, res) => {
//   res.status(200).json({ status: "ok" });
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`String Analyzer Service running on port ${PORT}`);
});

module.exports = app;
