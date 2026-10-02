/* Generates the site's photographic stills with the Higgsfield API (Soul 2).

       bun run images.ts hero        generate one still (run one process per still)

   The raw download lands in tools/higgsfield/out/<name>.<ext> (git ignored).
   tools/higgsfield/optimise.sh then crops, resizes and encodes it into
   assets/img/<name>-<width>.{webp,jpg}, which tools/pages.js references.

   Credentials: HF_CREDENTIALS ("key-id:key-secret") in tools/higgsfield/.env.local,
   which Bun loads at startup and git ignores. Never commit it, never print it.
   Each still is one billable request.

   A request can sit in the queue forever and the SDK's maxPollTime does not
   always stop it, so drive this from a shell loop that hard-kills the process
   after ~6 minutes and retries.

   The prompts below are the source of truth for these images. Everything shown
   is generic: scenes only, nobody real or named, no coach or member, no
   logos, no on-image text, no app UI.

   Where each still sits:
     hero     home header, under the headline and the app mockup   (16:9)
     how      home, how it works: the phone against a water bottle (4:3)
     still    philosophy, above "The name"                          (3:2)
     privacy  privacy, beside "How the camera is used"              (4:3)

   The model takes these as suggestions. As shipped: the hero has the phone
   standing beside the bottle rather than leaning on it; the how still has the
   phone upright rather than sideways (a sideways retry painted a logo on the
   mat); the privacy still has the phone lying screen-up and switched off. All
   three were kept because they read calmly and carry no text or logos. Look
   at every output before using it.

   Crops and grades used for the shipped files (see optimise.sh):
     hero     2000x1125+34+27 (film border on the left edge), warmed with
              GRADE="-channel R -evaluate multiply 1.07 -channel B -evaluate multiply 0.88 +channel -modulate 100,92"
     still    1950x1300+33+22 (film border on all four edges)
     how, privacy   none */

import { config, higgsfield, HiggsfieldError, NotEnoughCreditsError, AuthenticationError, TimeoutError } from '@higgsfield/client/v2';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const MODEL = 'higgsfield-ai/soul/v2/standard';
const OUT = resolve(import.meta.dir, 'out');

const STYLE = 'Quiet, warm editorial lifestyle photography for a calm yoga brand. Soft early-morning window light with warm amber highlights, deep plum and violet shadows, muted lavender and off-white tones, a gentle low-contrast grade. Natural textures: pale wooden floor, linen, cork, a matte lavender-grey yoga mat. A real, lived-in, uncluttered home, not a gym, not clinical, not futuristic. Shot on a full-frame camera with a 50mm lens, shallow depth of field, no film grain, no vignette, no border, no frame. No text, no letters, no numbers, no logos, no brand names, no watermark, no visible screen content.';

type Still = { prompt: string; aspect: '16:9' | '4:3' | '3:2' };

const STILLS: Record<string, Still> = {
  hero: {
    aspect: '16:9',
    prompt: `Wide, calm shot of a living room at dawn. In the middle distance a woman stands balanced in Tree pose (Vrksasana) on a lavender-grey yoga mat: standing leg straight, the sole of her other foot resting on her inner thigh, palms pressed together at her chest, posture tall and relaxed, eyes softly closed. At the near end of the mat, in the foreground, a thin flat black smartphone, turned sideways in landscape orientation, is propped at a slight backward tilt against a plain matte water bottle, its camera facing her; it is clearly a phone, thin and rectangular, seen at a three-quarter angle. Both are completely unbranded with no logo, label or lettering. Golden sunrise light through a tall window with sheer curtains, a leafy houseplant, a wooden floor, plenty of quiet space around her. ${STYLE}`,
  },
  how: {
    aspect: '4:3',
    prompt: `Low close-up at floor level: a smartphone turned sideways in landscape orientation, its long edge resting on the mat, leaning back against a brushed-metal water bottle at the front edge of a lavender-grey yoga mat; we see the phone's plain dark back. Two metres behind it, heavily out of focus, a person stands upright on the mat in a simple Warrior II pose, arms out wide, a soft blurred full-body silhouette against a bright window, face not visible. Warm morning light rakes across the mat. ${STYLE}`,
  },
  still: {
    aspect: '3:2',
    prompt: `A quiet still life on a pale wooden floor at sunrise: a lavender-grey yoga mat half unrolled, a neatly folded off-white linen blanket, a cork yoga block, a small handmade ceramic cup of tea with a thin wisp of steam, and a single sprig of dried lavender. Long soft shadows of a window frame fall across the scene. Calm, minimal, contemplative. No people. ${STYLE}`,
  },
  privacy: {
    aspect: '4:3',
    prompt: `A calm bedroom corner in early morning: a smartphone lies face-down on a pale wooden floor beside a rolled-out lavender-grey yoga mat, a folded linen towel and a glass of water next to it. No laptop, no screens, nothing switched on. A linen-covered bed softly out of focus in the background, sheer curtains, warm gentle light. Peaceful, private, ordinary. No people. ${STYLE}`,
  },
};

async function main(): Promise<number> {
  const credentials = process.env.HF_CREDENTIALS;
  if (!credentials) {
    console.error('HF_CREDENTIALS is not set. Put it in tools/higgsfield/.env.local as key-id:key-secret.');
    return 1;
  }
  config({ credentials, maxPollTime: 6 * 60 * 1000 });

  const name = process.argv[2];
  const still = name && STILLS[name];
  if (!still) {
    console.error(`usage: bun run images.ts <${Object.keys(STILLS).join('|')}>`);
    return 2;
  }
  await mkdir(OUT, { recursive: true });

  try {
    const result = await higgsfield.subscribe(MODEL, {
      input: { prompt: still.prompt, aspect_ratio: still.aspect, resolution: '1080p', batch_size: 1, enhance_prompt: false },
      withPolling: true,
    });
    // subscribe() resolves on every terminal state, not only success.
    if (result.status !== 'completed') {
      throw new Error(`${name}: request ${result.request_id} ended ${result.status === 'nsfw' ? 'rejected by moderation' : result.status}`);
    }
    const url = result.images?.[0]?.url;
    if (!url) throw new Error(`${name}: request ${result.request_id} completed without an image`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${name}: download failed (${res.status})`);
    const ext = (url.split('?')[0].match(/\.(png|jpe?g|webp)$/i)?.[1] ?? 'png').toLowerCase();
    const out = join(OUT, `${name}.${ext}`);
    await Bun.write(out, res);
    console.log(`${name} -> ${out}`);
    return 0;
  } catch (err) {
    // The SDK's errors carry the HTTP detail, never the credentials.
    if (err instanceof NotEnoughCreditsError) console.error(`${name}: not enough credits on this API key`);
    else if (err instanceof AuthenticationError) console.error(`${name}: the API key was rejected`);
    else if (err instanceof TimeoutError) console.error(`${name}: still queued after 6 minutes`);
    else if (err instanceof HiggsfieldError) console.error(`${name}: ${err.name}: ${err.message}`);
    else console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }
}

process.exit(await main());
