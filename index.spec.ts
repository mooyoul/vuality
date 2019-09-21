import { expect } from "chai";

import { Vuality } from "./index";

describe(Vuality.name, () => {
  let vuality: Vuality;

  beforeEach(() => {
    vuality = new Vuality();
  });

  describe("#psnr", () => {
    context("when input = reference", () => {
      it("should return PSNRStat", async () => {
        const stat = await vuality.psnr("fixtures/reference.mp4", "fixtures/reference.mp4");
        expect(stat.mse).to.deep.eq({ avg: 0, y: 0, u: 0, v: 0 });
        expect(stat.psnr).to.deep.eq({ avg: Infinity, y: Infinity, u: Infinity, v: Infinity });
        stat.frames.forEach((frame, i) => {
          expect(frame.n).to.be.eq(i + 1);
          expect(frame.mse).to.deep.eq({ avg: 0, y: 0, u: 0, v: 0 });
          expect(frame.psnr).to.deep.eq({ avg: Infinity, y: Infinity, u: Infinity, v: Infinity });
        });
      });

      it("should return PSNRStat", async () => {
        const stat = await vuality.psnr("fixtures/input.gif", "fixtures/input.gif");
        expect(stat.mse).to.deep.eq({ avg: 0, r: 0, g: 0, b: 0, a: 0 });
        expect(stat.psnr).to.deep.eq({ avg: Infinity, r: Infinity, g: Infinity, b: Infinity, a: Infinity });
        stat.frames.forEach((frame, i) => {
          expect(frame.n).to.be.eq(i + 1);
          expect(frame.mse).to.deep.eq({ avg: 0, r: 0, g: 0, b: 0, a: 0 });
          expect(frame.psnr).to.deep.eq({ avg: Infinity, r: Infinity, g: Infinity, b: Infinity, a: Infinity });
        });
      });
    });

    context("when input != reference", () => {
      it("should return PSNRStat", async () => {
        const stat = await vuality.psnr("fixtures/input.gif", "fixtures/reference.mp4", {
          scale: { width: 496, height: 498 },
        });

        expect(stat).to.deep.eq(require("./fixtures/psnr.json"));
      });

      it("should return PSNRStat", async () => {
        const stat = await vuality.psnr("fixtures/reference.mp4", "fixtures/input.gif", {
          scale: { width: 496, height: 498 },
        });

        expect(stat).to.deep.eq(require("./fixtures/psnr.json"));
      });
    });
  });

  describe("#psnrSync", () => {
    context("when input = reference", () => {
      it("should return PSNRStat", () => {
        const stat = vuality.psnrSync("fixtures/reference.mp4", "fixtures/reference.mp4");
        expect(stat.mse).to.deep.eq({ avg: 0, y: 0, u: 0, v: 0 });
        expect(stat.psnr).to.deep.eq({ avg: Infinity, y: Infinity, u: Infinity, v: Infinity });
        stat.frames.forEach((frame, i) => {
          expect(frame.n).to.be.eq(i + 1);
          expect(frame.mse).to.deep.eq({ avg: 0, y: 0, u: 0, v: 0 });
          expect(frame.psnr).to.deep.eq({ avg: Infinity, y: Infinity, u: Infinity, v: Infinity });
        });
      });

      it("should return PSNRStat", () => {
        const stat = vuality.psnrSync("fixtures/input.gif", "fixtures/input.gif");
        expect(stat.mse).to.deep.eq({ avg: 0, r: 0, g: 0, b: 0, a: 0 });
        expect(stat.psnr).to.deep.eq({ avg: Infinity, r: Infinity, g: Infinity, b: Infinity, a: Infinity });
        stat.frames.forEach((frame, i) => {
          expect(frame.n).to.be.eq(i + 1);
          expect(frame.mse).to.deep.eq({ avg: 0, r: 0, g: 0, b: 0, a: 0 });
          expect(frame.psnr).to.deep.eq({ avg: Infinity, r: Infinity, g: Infinity, b: Infinity, a: Infinity });
        });
      });
    });

    context("when input != reference", () => {
      it("should return PSNRStat", () => {
        const stat = vuality.psnrSync("fixtures/input.gif", "fixtures/reference.mp4", {
          scale: { width: 496, height: 498 },
        });

        expect(stat).to.deep.eq(require("./fixtures/psnr.json"));
      });

      it("should return PSNRStat", () => {
        const stat = vuality.psnrSync("fixtures/reference.mp4", "fixtures/input.gif", {
          scale: { width: 496, height: 498 },
        });

        expect(stat).to.deep.eq(require("./fixtures/psnr.json"));
      });
    });
  });

  describe("#ssim", () => {
    context("when input = reference", () => {
      it("should return SSIMStat", async () => {
        const stat = await vuality.ssim("fixtures/reference.mp4", "fixtures/reference.mp4");
        expect(stat.ssim).to.deep.eq({ all: 1, y: 1, u: 1, v: 1 });
        stat.frames.forEach((frame, i) => {
          expect(frame.n).to.be.eq(i + 1);
          expect(frame.ssim).to.deep.eq({ all: 1, y: 1, u: 1, v: 1 });
        });
      });

      it("should return SSIMStat", async () => {
        const stat = await vuality.ssim("fixtures/input.gif", "fixtures/input.gif");
        expect(stat.ssim).to.deep.eq({ all: 1, r: 1, g: 1, b: 1 });
        stat.frames.forEach((frame, i) => {
          expect(frame.n).to.be.eq(i + 1);
          expect(frame.ssim).to.deep.eq({ all: 1, r: 1, g: 1, b: 1 });
        });
      });
    });

    context("when input != reference", () => {
      it("should return SSIMStat", async () => {
        const stat = await vuality.ssim("fixtures/input.gif", "fixtures/reference.mp4", {
          scale: { width: 496, height: 498 },
        });

        expect(stat).to.deep.eq(require("./fixtures/ssim.json"));
      });

      it("should return SSIMStat", async () => {
        const stat = await vuality.ssim("fixtures/reference.mp4", "fixtures/input.gif", {
          scale: { width: 496, height: 498 },
        });

        expect(stat).to.deep.eq(require("./fixtures/ssim.json"));
      });
    });
  });

  describe("#ssimSync", () => {
    context("when input = reference", () => {
      it("should return SSIMStat", () => {
        const stat = vuality.ssimSync("fixtures/reference.mp4", "fixtures/reference.mp4");
        expect(stat.ssim).to.deep.eq({ all: 1, y: 1, u: 1, v: 1 });
        stat.frames.forEach((frame, i) => {
          expect(frame.n).to.be.eq(i + 1);
          expect(frame.ssim).to.deep.eq({ all: 1, y: 1, u: 1, v: 1 });
        });
      });

      it("should return SSIMStat", () => {
        const stat = vuality.ssimSync("fixtures/input.gif", "fixtures/input.gif");
        expect(stat.ssim).to.deep.eq({ all: 1, r: 1, g: 1, b: 1 });
        stat.frames.forEach((frame, i) => {
          expect(frame.n).to.be.eq(i + 1);
          expect(frame.ssim).to.deep.eq({ all: 1, r: 1, g: 1, b: 1 });
        });
      });
    });

    context("when input != reference", () => {
      it("should return SSIMStat", () => {
        const stat = vuality.ssimSync("fixtures/input.gif", "fixtures/reference.mp4", {
          scale: { width: 496, height: 498 },
        });

        expect(stat).to.deep.eq(require("./fixtures/ssim.json"));
      });

      it("should return SSIMStat", () => {
        const stat = vuality.ssimSync("fixtures/reference.mp4", "fixtures/input.gif", {
          scale: { width: 496, height: 498 },
        });

        expect(stat).to.deep.eq(require("./fixtures/ssim.json"));
      });
    });
  });
});
