import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("wachtwoorden", () => {
  it("herkent het juiste wachtwoord", () => {
    const stored = hashPassword("een-lang-wachtwoord");
    expect(verifyPassword("een-lang-wachtwoord", stored)).toBe(true);
  });

  it("wijst een onjuist wachtwoord af", () => {
    const stored = hashPassword("een-lang-wachtwoord");
    expect(verifyPassword("iets-anders", stored)).toBe(false);
  });

  it("bevat geen dollarteken, zodat .env-bestanden het niet uitbreiden", () => {
    expect(hashPassword("test-wachtwoord")).not.toContain("$");
  });

  it("wijst onzin in de opgeslagen waarde af zonder te crashen", () => {
    expect(verifyPassword("x", "")).toBe(false);
    expect(verifyPassword("x", "scrypt:zz:zz")).toBe(false);
    expect(verifyPassword("x", "onzin")).toBe(false);
  });
});
