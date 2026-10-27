import { describe, expect, it } from "vitest";
import { calcCrops, calcFitr, calcMoney, calcRikaz, moneyNisabValue, type MoneyInput } from "./calc";

const base: MoneyInput = {
  gold21PerGram: 3000,
  silverPerGram: 0,
  cash: 0,
  tradeGoods: 0,
  investments: 0,
  debtsOwedToYou: 0,
  savedGold: [],
  adornmentGold: [],
  includeAdornment: false,
  silverGrams: 0,
  dueDebts: 0,
  hawlComplete: true,
};

describe("money nisab (85 g of 21K gold)", () => {
  it("is 85 x the 21K gram price", () => {
    expect(moneyNisabValue(3000)).toBe(255000);
  });
});

describe("calcMoney", () => {
  it("charges 2.5% above the nisab", () => {
    const r = calcMoney({ ...base, cash: 300000 });
    expect(r.status).toBe("due");
    expect(r.zakatDue).toBe(7500);
  });

  it("is due exactly at the nisab and not due one pound below", () => {
    expect(calcMoney({ ...base, cash: 255000 })).toMatchObject({ status: "due", zakatDue: 6375 });
    expect(calcMoney({ ...base, cash: 254999 }).status).toBe("below_nisab");
  });

  it("deducts debts that are due before comparing with the nisab", () => {
    const r = calcMoney({ ...base, cash: 300000, dueDebts: 100000 });
    expect(r.netWealth).toBe(200000);
    expect(r.status).toBe("below_nisab");
    const r2 = calcMoney({ ...base, cash: 400000, dueDebts: 100000 });
    expect(r2.zakatDue).toBe(7500);
  });

  it("does not charge before a full year has passed", () => {
    const r = calcMoney({ ...base, cash: 300000, hawlComplete: false });
    expect(r.status).toBe("hawl_pending");
    expect(r.zakatDue).toBe(0);
  });

  it("combines cash, trade goods, investments and collectible debts", () => {
    const r = calcMoney({ ...base, cash: 100000, tradeGoods: 100000, investments: 50000, debtsOwedToYou: 50000 });
    expect(r.totalAssets).toBe(300000);
    expect(r.zakatDue).toBe(7500);
  });

  it("values saved gold by purity: 85 g of 21K equals the nisab", () => {
    const r = calcMoney({ ...base, savedGold: [{ grams: 85, karat: 21 }] });
    expect(r.breakdown.savedGold).toBe(255000);
    expect(r).toMatchObject({ status: "due", zakatDue: 6375 });
  });

  it("values 24K and 18K gold relative to the 21K price", () => {
    const r = calcMoney({
      ...base,
      savedGold: [
        { grams: 10, karat: 24 },
        { grams: 10, karat: 18 },
      ],
    });
    // 10*3000*24/21 + 10*3000*18/21
    expect(r.breakdown.savedGold).toBe(60000);
  });

  it("excludes worn adornment gold by default and includes it on the Hanafi switch", () => {
    const adorn = [{ grams: 100, karat: 21 }];
    const off = calcMoney({ ...base, adornmentGold: adorn });
    expect(off.breakdown.adornmentGold).toBe(0);
    expect(off.status).toBe("below_nisab");
    const on = calcMoney({ ...base, adornmentGold: adorn, includeAdornment: true });
    expect(on.breakdown.adornmentGold).toBe(300000);
    expect(on.zakatDue).toBe(7500);
  });

  it("asks for a gold price instead of guessing", () => {
    expect(calcMoney({ ...base, gold21PerGram: 0, cash: 1e6 }).status).toBe("need_price");
  });

  it("needs a silver price when silver is entered", () => {
    expect(calcMoney({ ...base, silverGrams: 600, cash: 300000 }).status).toBe("need_silver_price");
    const r = calcMoney({ ...base, silverGrams: 600, silverPerGram: 50 });
    expect(r.breakdown.silver).toBe(30000);
  });

  it("ignores negative / NaN inputs", () => {
    const r = calcMoney({ ...base, cash: -5, tradeGoods: NaN, dueDebts: -100 });
    expect(r.totalAssets).toBe(0);
    expect(r.dueDebts).toBe(0);
  });
});

describe("calcCrops", () => {
  it("Hanafi (Dar al-Ifta): no nisab, 10% rain-fed", () => {
    expect(calcCrops({ yieldKg: 100, irrigation: "rain", school: "hanafi", pricePerKg: 0 })).toMatchObject({
      status: "due",
      zakatKg: 10,
      nisabKg: null,
    });
  });
  it("machine irrigation is 5% and mixed is 7.5%", () => {
    expect(calcCrops({ yieldKg: 1000, irrigation: "machine", school: "hanafi", pricePerKg: 0 }).zakatKg).toBe(50);
    expect(calcCrops({ yieldKg: 1000, irrigation: "mixed", school: "hanafi", pricePerKg: 0 }).zakatKg).toBe(75);
  });
  it("jumhur: nothing below 653 kg", () => {
    expect(calcCrops({ yieldKg: 652, irrigation: "rain", school: "jumhur", pricePerKg: 0 }).status).toBe("below_nisab");
    expect(calcCrops({ yieldKg: 653, irrigation: "rain", school: "jumhur", pricePerKg: 0 }).status).toBe("due");
  });
  it("adds the cash equivalent when a price is given", () => {
    const r = calcCrops({ yieldKg: 1000, irrigation: "rain", school: "hanafi", pricePerKg: 12 });
    expect(r.zakatKg).toBe(100);
    expect(r.zakatCash).toBe(1200);
  });
  it("needs a yield", () => {
    expect(calcCrops({ yieldKg: 0, irrigation: "rain", school: "hanafi", pricePerKg: 0 }).status).toBe("need_yield");
  });
});

describe("rikaz and fitr", () => {
  it("rikaz is one fifth", () => {
    expect(calcRikaz(50000).zakatDue).toBe(10000);
  });
  it("fitr multiplies persons by the announced amount", () => {
    expect(calcFitr(5, 35).total).toBe(175);
    expect(calcFitr(2.9, 35).total).toBe(70);
  });
});
