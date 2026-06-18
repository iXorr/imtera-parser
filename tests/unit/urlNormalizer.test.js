import { extractBusinessId, toReviewsUrl, InvalidOrganizationUrlError } from "../../src/urlNormalizer.js";

describe("extractBusinessId", () => {
  test("каноническая ссылка вида /maps/org/-/<id>/reviews/", () => {
    expect(extractBusinessId("https://yandex.ru/maps/org/-/1057721048/reviews/")).toBe("1057721048");
  });

  test("ссылка со слагом организации вместо дефиса", () => {
    expect(extractBusinessId("https://yandex.ru/maps/org/gosudarstvenny_ermitazh/1057721048/?ll=1,2")).toBe(
      "1057721048"
    );
  });

  test("ссылка другой локали (yandex.com/en)", () => {
    expect(extractBusinessId("https://yandex.com/maps/org/-/1057721048/reviews/")).toBe("1057721048");
  });

  test("голая ссылка без слага /maps/org/<id>", () => {
    expect(extractBusinessId("https://yandex.ru/maps/org/1057721048")).toBe("1057721048");
  });

  test("попап-ссылка с oid в urlencoded poi[uri]", () => {
    const url =
      "https://yandex.ru/maps/56/chelyabinsk/?ll=61.4%2C55.1&mode=poi&poi%5Bpoint%5D=61.4%2C55.1&poi%5Buri%5D=ymapsbm1%3A%2F%2Forg%3Foid%3D1102942936&z=14.69";
    expect(extractBusinessId(url)).toBe("1102942936");
  });

  test("бросает InvalidOrganizationUrlError для не-Яндекс.Карт ссылки", () => {
    expect(() => extractBusinessId("https://google.com")).toThrow(InvalidOrganizationUrlError);
  });

  test("сообщение ошибки содержит исходный url", () => {
    const url = "https://google.com";
    expect(() => extractBusinessId(url)).toThrow(url);
  });
});

describe("toReviewsUrl", () => {
  test("всегда строит канонический yandex.ru-url независимо от исходного хоста", () => {
    expect(toReviewsUrl("https://yandex.com/maps/org/-/1057721048/reviews/")).toBe(
      "https://yandex.ru/maps/org/-/1057721048/reviews/"
    );
  });

  test("игнорирует хост входной ссылки даже если он не yandex (SSRF-защита)", () => {
    expect(toReviewsUrl("https://evil.example/maps/org/-/1057721048/reviews/")).toBe(
      "https://yandex.ru/maps/org/-/1057721048/reviews/"
    );
  });
});
