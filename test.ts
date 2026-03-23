import { GoogleGenAI } from '@google/genai';
try {
  new GoogleGenAI({ apiKey: "undefined" });
  console.log("Success with 'undefined'");
} catch (e) {
  console.error("Error with 'undefined':", e.message);
}
try {
  new GoogleGenAI({ apiKey: "" });
  console.log("Success with ''");
} catch (e) {
  console.error("Error with '':", e.message);
}
try {
  new GoogleGenAI({ apiKey: undefined });
  console.log("Success with undefined");
} catch (e) {
  console.error("Error with undefined:", e.message);
}
