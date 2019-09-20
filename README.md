# vuality

[![Build Status](https://github.com/mooyoul/vuality/workflows/workflow/badge.svg)](https://github.com/mooyoul/vuality/actions)
[![Semantic Release enabled](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com/)
[![MIT license](http://img.shields.io/badge/license-MIT-blue.svg)](http://mooyoul.mit-license.org/)

Video Quality Assessment Utility for Node.js

This package is a kind of wrapper of FFmpeg to compare quality between two videos.

Currently vuality provides two Video Quality Assessment methods to compare quality - [PSNR](https://en.wikipedia.org/wiki/Peak_signal-to-noise_ratio#Quality_estimation_with_PSNR) and [SSIM](https://en.wikipedia.org/wiki/Structural_similarity).

## Prerequisites

vuality uses [ffmpeg](https://ffmpeg.org/) internally. Please install ffmpeg, or download pre-built ffmpeg before using vuality package.


## Usage

Install `vuality` to get up and running. 

```bash
$ npm install vuality
```

Then:

```typescript
import { Vuality } from "vuality";

const vuality = new Vuality();
// or
const vuality = new Vuality("/path/to/ffmpeg");


// Then either:
const psnr = await vuality.psnr("input.mp4", "reference.mp4");   
// or:
const ssim = await vuality.ssim("input.mp4", "reference.mp4");
```


## API

#### `vuality.psnr(input: Buffer | string, reference: string, options: AssessmentOption): Promise<PSNRStat>`

Returns PSNR Stats

If `scale` option is provided, Vuality tries to scale input video as given resolution before computing PSNR.

```typescript
interface Stat {
  avg: number;
  y: number;
  u: number;
  v: number;
}

interface PSNRFrameStat {
  n: number;
  mse: Stat;
  psnr: Stat;
}

interface PSNRStat {
  psnr: Stat;
  mse: Stat;
  frames: PSNRFrameStat[];
}
```

#### `vuality.psnrSync(input: Buffer | string, reference: string, options: AssessmentOption): PSNRStat`

Sync version of `vuality.psnr`.


#### `vuality.ssim(input: Buffer | string, reference: string, options: AssessmentOption): Promise<SSIMStat>`

Returns SSIM Stats

If `scale` option is provided, Vuality tries to scale input video as given resolution before computing SSIM.

```typescript
interface Stat {
  avg: number;
  y: number;
  u: number;
  v: number;
}

export interface SSIMFrameStat {
  n: number;
  ssim: Stat;
}

export interface SSIMStat {
  ssim: Stat;
  frames: SSIMFrameStat[];
}
```

#### `vuality.ssimSync(input: Buffer | string, reference: string, options: AssessmentOption): SSIMStat`

Sync version of `vuality.ssim`.



## Changelog

See [CHANGELOG](/CHANGELOG.md).

## Testing

```bash
$ npm run test
```

## Building

```bash
$ npm run build
```


## License
[MIT](LICENSE)

See full license on [mooyoul.mit-license.org](http://mooyoul.mit-license.org/)
