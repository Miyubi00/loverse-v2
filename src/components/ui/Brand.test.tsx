import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import logoSource from "../../../public/logo.svg?raw";
import { BrandMark, BrandPlate, Wordmark } from "./Brand";

const sourcePaths = [...logoSource.matchAll(/<path\b[^>]*d="([^"]+)"/g)].map((match) => match[1]);

afterEach(cleanup);

describe("Brand", () => {
  it("renders the official icon paths without redrawing them", () => {
    const { container } = render(<BrandMark title="Loverse" />);
    const paths = [...container.querySelectorAll("path")].map((path) => path.getAttribute("d"));
    expect(paths).toEqual(sourcePaths);
    expect(sourcePaths.length).toBeGreaterThan(0);
  });

  it("renders the official lockup at its 680:220 ratio", () => {
    const { container } = render(
      <MemoryRouter>
        <Wordmark />
      </MemoryRouter>,
    );
    const image = container.querySelector("img");
    expect(image?.getAttribute("src")).toBe("/logo.png");
    expect(image?.getAttribute("alt")).toBe("Loverse");
    expect(image?.getAttribute("width")).toBe("680");
    expect(image?.getAttribute("height")).toBe("220");
    expect(container.textContent).toBe("");
  });

  it("places the lockup on a dark plate for light surfaces", () => {
    const { container } = render(
      <MemoryRouter>
        <BrandPlate />
      </MemoryRouter>,
    );
    const link = container.querySelector("a");
    expect(link?.className).toContain("bg-ink-950");
    expect(link?.querySelector('img[src="/logo.png"][width="680"][height="220"]')).toBeTruthy();
    expect(container.textContent).toBe("");
  });
});
