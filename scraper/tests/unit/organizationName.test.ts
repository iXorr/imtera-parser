import { parseOrganizationName } from "../../src/organizationName.ts";

describe("parseOrganizationName", () => {
  test("отрезает суффикс «— Яндекс Карты» (длинное тире)", () => {
    expect(parseOrganizationName("Кафе Пушкинъ — Яндекс Карты")).toBe("Кафе Пушкинъ");
  });

  test("отрезает суффикс «— Яндекс.Карты» (с точкой, без пробела)", () => {
    expect(parseOrganizationName("Сбербанк — Яндекс.Карты")).toBe("Сбербанк");
  });

  test("работает с обычным дефисом вместо длинного тире", () => {
    expect(parseOrganizationName("МакДональдс - Яндекс Карты")).toBe("МакДональдс");
  });

  test("title без суффикса возвращается как есть", () => {
    expect(parseOrganizationName("Просто название")).toBe("Просто название");
  });

  test("пустая строка после обрезки суффикса даёт null", () => {
    expect(parseOrganizationName("— Яндекс Карты")).toBeNull();
  });

  test("пустой title даёт null", () => {
    expect(parseOrganizationName("")).toBeNull();
  });

  test("отрезает префикс «Отзывы о »", () => {
    expect(parseOrganizationName("Отзывы о «Кафе Пушкинъ» — Яндекс Карты")).toBe("«Кафе Пушкинъ»");
  });

  test("отрезает префикс «Отзывы о » вместе с адресом после названия", () => {
    expect(parseOrganizationName("Отзывы о «Дом еврейской культуры ЕСОД» на Чкаловской, Санкт-Петербург, Большая Разночинная улица, 25 — Яндекс Карты"))
      .toBe("«Дом еврейской культуры ЕСОД» на Чкаловской, Санкт-Петербург, Большая Разночинная улица, 25");
  });
});
