import { OrganizationNotFoundError } from "../../src/scraper.js";

describe("OrganizationNotFoundError", () => {
  test("это Error с понятным сообщением и сохранённым url", () => {
    const url = "https://yandex.ru/maps/org/-/NONE/reviews/";
    const error = new OrganizationNotFoundError(url);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("OrganizationNotFoundError");
    expect(error.organizationUrl).toBe(url);
    expect(error.message).toContain(url);
  });
});
