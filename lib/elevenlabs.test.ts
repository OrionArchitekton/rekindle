import { describe, expect, it } from "vitest";
import { speechToken, verifySpeechToken } from "./elevenlabs";

describe("speech token signing", () => {
  const text = "Spark, open the project tonight.";

  it("verifies a token it signed", () => {
    expect(verifySpeechToken(text, speechToken(text))).toBe(true);
  });

  it("rejects a forged token", () => {
    expect(verifySpeechToken(text, "0".repeat(64))).toBe(false);
  });

  it("rejects a valid token replayed against different text", () => {
    expect(verifySpeechToken("some other speech", speechToken(text))).toBe(false);
  });

  it("rejects malformed tokens", () => {
    expect(verifySpeechToken(text, "")).toBe(false);
    expect(verifySpeechToken(text, "not-hex")).toBe(false);
    expect(verifySpeechToken(text, speechToken(text).slice(0, 32))).toBe(false);
  });
});
