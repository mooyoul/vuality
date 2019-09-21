import * as execa from "execa";
import * as fs from "fs";
import * as tempy from "tempy";

export type Input = Buffer | string;

export interface AssessmentOption {
  scale?: { width: number; height: number; };
}

export interface PSNRStat {
  avg?: number;
  y?: number;
  u?: number;
  v?: number;
  r?: number;
  g?: number;
  b?: number;
  a?: number;
}

export interface PSNRFrame {
  n: number;
  mse: PSNRStat;
  psnr: PSNRStat;
}

export interface PSNR {
  psnr: PSNRStat;
  mse: PSNRStat;
  frames: PSNRFrame[];
}

export interface SSIMStat {
  all?: number;
  y?: number;
  u?: number;
  v?: number;
  r?: number;
  g?: number;
  b?: number;
}

export interface SSIMFrame {
  n: number;
  ssim: SSIMStat;
}

export interface SSIM {
  ssim: SSIMStat;
  frames: SSIMFrame[];
}

type PSNRStatKey = keyof PSNRStat;
type SSIMStatKey = keyof SSIMStat;

const parseNumber = (str: string): number => str === "inf" ? Infinity : Number(str);

export class Vuality {
  public constructor(private readonly ffmpegPath: string = "ffmpeg") {}

  public async psnr(input: Input, reference: string, options: AssessmentOption = {}): Promise<PSNR> {
    const res = await this.exec("psnr", input, reference, options);

    return this.parsePSNRStat(res);
  }

  public psnrSync(input: Input, reference: string, options: AssessmentOption = {}): PSNR {
    const res = this.execSync("psnr", input, reference, options);

    return this.parsePSNRStat(res);
  }

  public async ssim(input: Input, reference: string, options: AssessmentOption = {}): Promise<SSIM> {
    const res = await this.exec("ssim", input, reference, options);

    return this.parseSSIMStat(res);
  }

  public ssimSync(input: Input, reference: string, options: AssessmentOption = {}): SSIM {
    const res = this.execSync("ssim", input, reference, options);

    return this.parseSSIMStat(res);
  }

  private parsePSNRStat(content: string): PSNR {
    const extract = (dict: { [key: string]: string }, prefix: string) =>
      Object.keys(dict)
        .filter((k) => k.startsWith(prefix))
        .reduce((hash, k) => {
          hash[k.replace(prefix, "") as PSNRStatKey] = parseNumber(dict[k]);
          return hash;
        }, {} as PSNRStat);

    const frames: PSNRFrame[] = content.trim().split("\n")
      .map((row) => {
        const tokens = row.trim().split(/\s+/);

        // n:28 mse_avg:3.76 mse_y:4.94 mse_u:1.31 mse_v:1.51 psnr_avg:42.38 psnr_y:41.19 psnr_u:46.96 psnr_v:46.34
        const dict = tokens.reduce((hash, token) => {
          const [ key, value ] = token.split(":");

          if (key && value) {
            hash[key.trim().toLowerCase()] = value.trim();
          }

          return hash;
        }, {} as { [key: string]: string });

        return {
          n: parseNumber(dict.n),
          mse: extract(dict, "mse_"),
          psnr: extract(dict, "psnr_"),
        };
      });

    const summary = (() => {
      const mse = {} as PSNRStat;
      const psnr = {} as PSNRStat;

      for (const frame of frames) {
        for (const k of Object.keys(frame.mse)) {
          const key = k as PSNRStatKey;
          mse[key] = (mse[key] || 0) + frame.mse[key]!;
        }
        for (const k of Object.keys(frame.psnr)) {
          const key = k as PSNRStatKey;
          psnr[key] = (psnr[key] || 0) + frame.psnr[key]!;
        }
      }

      return {
        mse: Object.keys(mse).reduce((hash, k) => {
          const key = k as PSNRStatKey;
          hash[key] = mse[key]! / frames.length;

          return hash;
        }, {} as PSNRStat),
        psnr: Object.keys(psnr).reduce((hash, k) => {
          const key = k as PSNRStatKey;
          hash[key] = psnr[key]! / frames.length;

          return hash;
        }, {} as PSNRStat),
      };
    })();

    return {
      psnr: summary.psnr,
      mse: summary.mse,
      frames,
    };
  }
  private parseSSIMStat(content: string): SSIM {
    const extract = (dict: { [key: string]: string }) =>
      Object.keys(dict)
        .filter((k) => k !== "n")
        .reduce((hash, k) => {
          hash[k as SSIMStatKey] = parseNumber(dict[k]);
          return hash;
        }, {} as SSIMStat);

    const frames: SSIMFrame[] = content.trim().split("\n")
      .map((row) => {
        const tokens = row.trim().split(/\s+/);

        // n:28 mse_avg:3.76 mse_y:4.94 mse_u:1.31 mse_v:1.51 psnr_avg:42.38 psnr_y:41.19 psnr_u:46.96 psnr_v:46.34
        const dict = tokens.reduce((hash, token) => {
          const [ key, value ] = token.split(":");

          if (key && value) {
            hash[key.trim().toLowerCase()] = value.trim();
          }

          return hash;
        }, {} as { [key: string]: string });

        return {
          n: parseNumber(dict.n),
          ssim: extract(dict),
        };
      });

    const summary = (() => {
      const ssim = {} as SSIMStat;

      for (const frame of frames) {
        for (const k of Object.keys(frame.ssim)) {
          const key = k as SSIMStatKey;
          ssim[key] = (ssim[key] || 0) + frame.ssim[key]!;
        }
      }

      return {
        ssim: Object.keys(ssim).reduce((hash, k) => {
          const key = k as SSIMStatKey;
          hash[key] = ssim[key]! / frames.length;

          return hash;
        }, {} as SSIMStat),
      };
    })();

    return {
      ssim: summary.ssim,
      frames,
    };
  }

  private async exec(type: "psnr" | "ssim", input: Input, reference: string, options: AssessmentOption = {}) {
    const outputPath = tempy.file();

    const filters: string[] = (() => {
      return options.scale ? [
        `[0:v] scale=${options.scale.width}:${options.scale.height} [i]`,
        `[1:v] scale=${options.scale.width}:${options.scale.height} [r]`,
        `[i][r] ${type}=${outputPath}`,
      ] : [
        `[0:v][1:v] ${type}=${outputPath}`,
      ];
    })();

    await execa(this.ffmpegPath, [
      "-i", Buffer.isBuffer(input) ? "-" : input,
      "-i", reference,
      "-filter_complex", filters.join(";"),
      "-f", "null",
      "-",
    ], { input: Buffer.isBuffer(input) ? input : undefined });

    return await new Promise<string>((resolve, reject) => {
      fs.readFile(outputPath, { encoding: "utf8" }, (e, data) => {
        if (e) { return reject(e); }

        resolve(data);
      });
    });
  }

  private execSync(type: "psnr" | "ssim", input: Input, reference: string, options: AssessmentOption = {}) {
    const outputPath = tempy.file();

    const filters: string[] = (() => {
      return options.scale ? [
        `[0:v] scale=${options.scale.width}:${options.scale.height} [i]`,
        `[1:v] scale=${options.scale.width}:${options.scale.height} [r]`,
        `[i][r] ${type}=${outputPath}`,
      ] : [
        `[0:v][1:v] ${type}=${outputPath}`,
      ];
    })();

    execa.sync(this.ffmpegPath, [
      "-i", Buffer.isBuffer(input) ? "-" : input,
      "-i", reference,
      "-filter_complex", filters.join(";"),
      "-f", "null",
      "-",
    ], { input: Buffer.isBuffer(input) ? input : undefined });

    return fs.readFileSync(outputPath, { encoding: "utf8" }) as string;
  }
}
