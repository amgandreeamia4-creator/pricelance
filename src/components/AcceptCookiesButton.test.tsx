import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AcceptCookiesButton from "./AcceptCookiesButton";

describe("AcceptCookiesButton", () => {
  it("renders the banner on first load when no consent has been stored", () => {
    const html = renderToStaticMarkup(<AcceptCookiesButton />);

    expect(html).toContain("Cookies on PriceLance");
    expect(html).toContain("Accept");
  });
});
