import * as execa from "execa";
import * as fs from "fs";
import * as tempy from "tempy";

export type Input = Buffer | string;

export interface AssessmentOption {
  scale?: { width: number; height: number; };
}

export interface Stat {
  avg: number;
  y: number;
  u: number;
  v: number;
}

export interface PSNRFrameStat {
  n: number;
  mse: Stat;
  psnr: Stat;
}

export interface PSNRStat {
  psnr: Stat;
  mse: Stat;
  frames: PSNRFrameStat[];
}

export interface SSIMFrameStat {
  n: number;
  ssim: Stat;
}

export interface SSIMStat {
  ssim: Stat;
  frames: SSIMFrameStat[];
}

const parseNumber = (str: string): number => str === "inf" ? Infinity : Number(str);

export class Vuality {
  public constructor(private readonly ffmpegPath: string = "ffmpeg") {}

  public async psnr(input: Input, reference: string, options: AssessmentOption = {}): Promise<PSNRStat> {
    const res = await this.exec("psnr", input, reference, options);

    return this.parsePSNRStat(res);
  }

  public psnrSync(input: Input, reference: string, options: AssessmentOption = {}): PSNRStat {
    const res = this.execSync("psnr", input, reference, options);

    return this.parsePSNRStat(res);
  }

  public async ssim(input: Input, reference: string, options: AssessmentOption = {}): Promise<SSIMStat> {
    const res = await this.exec("ssim", input, reference, options);

    return this.parseSSIMStat(res);
  }

  public ssimSync(input: Input, reference: string, options: AssessmentOption = {}): SSIMStat {
    const res = this.execSync("ssim", input, reference, options);

    return this.parseSSIMStat(res);
  }

  private parsePSNRStat(content: string): PSNRStat {
    const frames: PSNRFrameStat[] = content.trim().split("\n")
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
          mse: {
            avg: parseNumber(dict.mse_avg),
            y: parseNumber(dict.mse_y),
            u: parseNumber(dict.mse_u),
            v: parseNumber(dict.mse_v),
          },
          psnr: {
            avg: parseNumber(dict.psnr_avg),
            y: parseNumber(dict.psnr_y),
            u: parseNumber(dict.psnr_u),
            v: parseNumber(dict.psnr_v),
          },
        };
      });

    return {
      psnr: {
        avg: frames.reduce((acc, frame) => acc + frame.psnr.avg, 0) / frames.length,
        y: frames.reduce((acc, frame) => acc + frame.psnr.y, 0) / frames.length,
        u: frames.reduce((acc, frame) => acc + frame.psnr.u, 0) / frames.length,
        v: frames.reduce((acc, frame) => acc + frame.psnr.v, 0) / frames.length,
      },
      mse: {
        avg: frames.reduce((acc, frame) => acc + frame.mse.avg, 0) / frames.length,
        y: frames.reduce((acc, frame) => acc + frame.mse.y, 0) / frames.length,
        u: frames.reduce((acc, frame) => acc + frame.mse.u, 0) / frames.length,
        v: frames.reduce((acc, frame) => acc + frame.mse.v, 0) / frames.length,
      },
      frames,
    };
  }
  private parseSSIMStat(content: string): SSIMStat {
    const frames: SSIMFrameStat[] = content.trim().split("\n")
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
          ssim: {
            avg: parseNumber(dict.all),
            y: parseNumber(dict.y),
            u: parseNumber(dict.u),
            v: parseNumber(dict.v),
          },
        };
      });

    return {
      ssim: {
        avg: frames.reduce((acc, frame) => acc + frame.ssim.avg, 0) / frames.length,
        y: frames.reduce((acc, frame) => acc + frame.ssim.y, 0) / frames.length,
        u: frames.reduce((acc, frame) => acc + frame.ssim.u, 0) / frames.length,
        v: frames.reduce((acc, frame) => acc + frame.ssim.v, 0) / frames.length,
      },
      frames,
    };
  }

  private async exec(type: "psnr" | "ssim", input: Input, reference: string, options: AssessmentOption = {}) {
    const outputPath = tempy.file();

    const filters: string[] = (() => {
      const base = [
        `movie=${reference} [exp]`,
      ];

      return options.scale ? [
        ...base,
        `[0:v] scale=${options.scale.width}:${options.scale.height} [act]`,
        `[exp][act]${type}=${outputPath} [out]`,
      ] : [
        ...base,
        `[exp][0:v]${type}=${outputPath} [out]`,
      ];
    })();

    await execa(this.ffmpegPath, [
      "-i", Buffer.isBuffer(input) ? "-" : input,
      "-vf", filters.join(";"),
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
        `movie=${reference}, scale=${options.scale.width}:${options.scale.height} [exp]`,
        `[0:v] scale=${options.scale.width}:${options.scale.height} [act]`,
        `[exp][act]${type}=${outputPath} [out]`,
      ] : [
        `movie=${reference} [exp]`,
        `[exp][0:v]${type}=${outputPath} [out]`,
      ];
    })();

    execa.sync(this.ffmpegPath, [
      "-i", Buffer.isBuffer(input) ? "-" : input,
      "-vf", filters.join(";"),
      "-f", "null",
      "-",
    ], { input: Buffer.isBuffer(input) ? input : undefined });

    return fs.readFileSync(outputPath, { encoding: "utf8" }) as string;
  }
}
