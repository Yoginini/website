/* Yoginini — central data model. One source for the site and /yoginini.json.
 *
 * HONESTY RULES for this file, please keep them:
 *  1. No invented people. Yoginini has not signed a single coach yet, so there
 *     are no coach profiles here — only the seats we are recruiting for.
 *  2. No invented metrics. No "318 on the mat right now", no waitlist count,
 *     until something real counts them.
 *  3. Anything that depicts the app in use is marked `preview: true` and the
 *     page must say so next to it. It is a mockup of an unreleased app.
 */
window.YOG = {

  /* ── Company ─────────────────────────────────────────────── */
  brand: {
    name: 'Yoginini',
    domain: 'yoginini.us',
    url: 'https://yoginini.us',
    email: 'contact@yoginini.us',
    tagline: 'A yoga teacher who can see you.',
    summary:
      'Yoginini is a yoga app that watches your form through your phone camera and ' +
      'speaks corrections out loud, the way a teacher would across the room. Pose ' +
      'tracking runs on the device and video never leaves it. When you want a human, ' +
      'you book a real teacher by the hour.',
    parent: { name: 'Factory Zero', id: 'FZ-003', url: 'https://factory0.ventures' }
  },

  /* Launch state. Every claim on the site is gated on these, so flipping a
     flag here and rebuilding is the only way a page starts saying "live". */
  status: {
    launched: false,
    platform: 'iPhone first, Android after',
    waitlistLive: false,   // true once WAITLIST_* secrets are set on Pages
    coachesSigned: 0,
    posesPublished: 0,
    appStore: null,        // no link until there is an app
    playStore: null
  },

  /* ── Pricing ─────────────────────────────────────────────── */
  pricing: {
    currency: 'USD',
    trial:      { name: 'Trial',      price: 3,  period: '14 days', rolls: true },
    membership: { name: 'Membership', price: 15, period: 'month' },
    membershipIncludes: [
      'Live camera coaching with spoken cues',
      'The 20-pose core library, reviewed by teachers',
      "Every coach's published poses and sequences",
      'Session summaries and weekly progress notes',
      'Streaks, badges, friends',
      'Cancel any time'
    ],
    coaching: {
      rateBand: '$50–85 / hr',
      coachKeeps: '80%',
      repeatShare: '10–12%',
      membershipRequired: true,
      processor: 'Stripe'
    },
    rows: [
      { k: 'Typical hourly rate',       sub: 'Set by each coach',                     v: '$50–85' },
      { k: 'Coach keeps',               sub: 'Paid out through Stripe',               v: '80%',    accent: true },
      { k: 'Repeat student, same coach',sub: 'Our share on bookings after the first', v: '10–12%', accent: true },
      { k: 'Membership required?',      sub: 'To book a live session',                v: 'Yes',    italic: true }
    ]
  },

  /* ── How it works ────────────────────────────────────────── */
  steps: [
    { n: '01', title: 'Learn the shape', meta: 'READ · 40 SEC',
      body: 'A short explanation of the pose, what it should feel like, and the one or two things people usually get wrong.' },
    { n: '02', title: 'Prop up your phone', meta: 'SETUP · ONCE',
      body: 'We walk you through distance, height and angle the first time. Most bad sessions are framing problems, so we fix framing first.' },
    { n: '03', title: 'Hold, and listen', meta: 'PRACTICE · 5–60 MIN',
      body: 'The camera tracks 33 points on your body and compares your joint angles to the reference. When something drifts, a calm voice says so.' }
  ],

  cues: [
    'lift your left hip a little',
    'soften the shoulders away from the ears',
    'press the standing foot down, lengthen up',
    'good. breathe here'
  ],

  sampleCues: [
    { t: '0:04', text: 'Shoulders back, just a touch.' },
    { t: '0:11', text: 'Lift your left hip a little.' },
    { t: '0:19', text: 'Lovely. Stay with your breath.' },
    { t: '0:31', text: 'Let the front knee track over the ankle.' }
  ],

  /* The 20-pose core library. Sanskrit names are the real ones. */
  poses: [
    ['Mountain', 'Tadasana'], ['Downward dog', 'Adho Mukha Svanasana'], ['Warrior I', 'Virabhadrasana I'],
    ['Warrior II', 'Virabhadrasana II'], ['Triangle', 'Trikonasana'], ['Tree', 'Vrksasana'],
    ['Chair', 'Utkatasana'], ['Low lunge', 'Anjaneyasana'], ['Forward fold', 'Uttanasana'],
    ['Bridge', 'Setu Bandha Sarvangasana'], ['Pigeon', 'Eka Pada Rajakapotasana'], ['Cobra', 'Bhujangasana'],
    ['Plank', 'Phalakasana'], ['Chaturanga', 'Chaturanga Dandasana'], ["Child's pose", 'Balasana'],
    ['Seated twist', 'Ardha Matsyendrasana'], ['Corpse', 'Savasana'], ['Warrior III', 'Virabhadrasana III'],
    ['High lunge', 'Utthita Ashwa Sanchalanasana'], ['Upward dog', 'Urdhva Mukha Svanasana']
  ],

  /* ── Coaches ─────────────────────────────────────────────── *
   * Seats in the founding cohort, NOT people. Nobody is signed. */
  coachSeats: [
    { style: 'Vinyasa',     tags: ['Vinyasa', 'Beginners'],   band: '$55–70 / hr',
      wants: 'Alignment for beginners. Someone who slows a shape down until it makes sense in an unfamiliar body.' },
    { style: 'Ashtanga',    tags: ['Ashtanga', 'Inversions'], band: '$70–85 / hr',
      wants: 'The primary series, strength and inversions. Precision, and patience with how long a handstand takes to arrive.' },
    { style: 'Restorative', tags: ['Restorative', 'Prenatal'],band: '$50–65 / hr',
      wants: 'Tired bodies and busy nervous systems. Long holds, props, and permission to do less.' },
    { style: 'Hatha',       tags: ['Hatha', 'Breathwork'],    band: '$60–75 / hr',
      wants: 'Breath-led practice and meditation. Standing poses taught as places to be still.' },
    { style: 'Athletes',    tags: ['Vinyasa', 'Athletes'],    band: '$60–80 / hr',
      wants: 'Runners and cyclists whose hamstrings have opinions. Sequences you can finish after a long ride.' },
    { style: 'Yin',         tags: ['Yin', 'Beginners'],       band: '$50–65 / hr',
      wants: 'Hips and lower backs, three-minute holds, a quiet voice. For people who sit at a desk all day.' }
  ],
  coachFilters: ['All', 'Vinyasa', 'Ashtanga', 'Hatha', 'Restorative', 'Yin', 'Beginners', 'Athletes', 'Inversions', 'Prenatal', 'Breathwork'],

  coachSteps: [
    { n: 'i',   title: 'Record the pose',      body: 'Three to five takes. We keep the median angle per joint and drop the outliers.' },
    { n: 'ii',  title: 'Set the tolerances',   body: 'Tight where it matters for safety, loose where bodies simply differ.' },
    { n: 'iii', title: 'Write the cues',       body: 'Your words, in your voice. We draft, you edit.' },
    { n: 'iv',  title: 'Review, then publish', body: 'A human checks every pose before a student sees it.' }
  ],

  bookingSteps: [
    { title: 'Send your practice for review',
      body: 'Choose which sessions, poses or your full history to share with a coach. They review the angles the app recorded, where your form drifted, and reply with notes, with or without a live call. Sharing is off by default and you can stop it any time.' },
    { title: 'The call starts already informed',
      body: "If you've shared, the coach arrives knowing your poses, the cues you keep hearing, and your streak. No warm-up chat about what you're working on." },
    { title: 'Pay per session, in the app or on the web',
      body: 'Rates are hourly and set by the coach. Payments run through Stripe; the coach keeps 80%. Repeat sessions with the same coach cost the coach less in fees, so long relationships are rewarded.' },
    { title: 'Video, scheduling and notes in one place',
      body: "Book from the coach's calendar, join the call from the app, and get their notes and a custom sequence afterwards to practise with the AI coach until next time." }
  ],

  /* ── Philosophy ──────────────────────────────────────────── */
  principles: [
    { n: 'i',   title: 'The phone watches. Nobody else does.',
      body: 'Every frame is analysed on the device and discarded. We store angles and scores, never video. A practice done in a bedroom deserves that.' },
    { n: 'ii',  title: 'Say less.',
      body: 'One cue at a time, never off a single frame, never twice in five seconds. Silence is part of teaching. An app that will not stop talking has not understood the room.' },
    { n: 'iii', title: 'Safety before beauty.',
      body: 'If three things are off, you hear the one that protects your knee or your lower back. Shape can wait. Joints cannot.' },
    { n: 'iv',  title: 'Bodies differ. Tolerances should too.',
      body: 'A tight hamstring is a starting point, not a mistake. Every pose ships in beginner, intermediate and advanced tolerances, and adapts to your own baseline.' },
    { n: 'v',   title: 'Humans review every pose.',
      body: 'A badly captured reference would teach thousands of people bad form. Nothing a coach records goes live until another teacher has checked it.' },
    { n: 'vi',  title: 'Consistency over intensity.',
      body: 'Streaks with grace days, no leaderboards, no red charts. Yoga rewards the person who shows up on a dull Tuesday, and so do we.' },
    { n: 'vii', title: 'The machine serves the teacher.',
      body: 'The AI fills the days between classes. It hands what it learned to a human coach, who does what no model can: notice you.' }
  ],

  chakras: [
    { n: 'VII',  name: 'Sahasrara',    meaning: 'crown · awareness',        color: '#b39ddb', top: true },
    { n: 'VI',   name: 'Ajna',         meaning: 'brow · insight',           color: '#4b3f8c' },
    { n: 'V',    name: 'Vishuddha',    meaning: 'throat · expression',      color: '#5aa7c9' },
    { n: 'IV',   name: 'Anahata',      meaning: 'heart · compassion',       color: '#6fae7a' },
    { n: 'III',  name: 'Manipura',     meaning: 'solar plexus · will',      color: '#e2c25a' },
    { n: 'II',   name: 'Svadhisthana', meaning: 'sacral · feeling',         color: '#e0894f' },
    { n: 'I',    name: 'Muladhara',    meaning: 'root · ground',            color: '#c34b4b' }
  ],

  /* ── Streaks ─────────────────────────────────────────────── */
  badges: [
    { name: 'First Breath',    how: 'Complete your first session' },
    { name: 'Seven Suns',      how: 'A 7-day streak',                          warm: true },
    { name: 'Steady as Stone', how: 'A 30-day streak' },
    { name: 'Balance Keeper',  how: 'Tree pose, both sides, clean form' },
    { name: 'The Long Exhale', how: 'One session over 60 minutes',             warm: true },
    { name: 'Still Water',     how: '5 hours in restorative poses' },
    { name: 'Quiet Mind',      how: '50 hours on the mat, all time' },
    { name: "Coach's Pick",    how: 'Given by hand, by a real coach. The rarest one.', rare: true }
  ],

  /* ── Community ───────────────────────────────────────────── *
   * `preview: true` — these describe features of an unreleased app.
   * Pages showing them must carry the preview marker. No real activity. */
  preview: true,
  rooms: [
    { state: 'SCHEDULED', len: '30 MIN', title: 'Sunrise flow',
      desc: 'A gentle vinyasa to start the day. All levels, cameras optional.' },
    { state: 'SCHEDULED', len: '20 MIN', title: 'Desk-back rescue',
      desc: 'Twists, hip openers and one long forward fold for people who sat all day.' },
    { state: 'COACH-HOSTED', len: '45 MIN', title: 'Moon Walkers',
      desc: 'Slow yin with a coach hosting. Quiet room, no chat until the end.' },
    { state: 'YOURS', len: 'ANY', title: 'Start your own',
      desc: 'Pick a sequence, set a time, send the link. Two people is enough.' }
  ],
  roomNotes: [
    { n: 'i',   title: 'Camera tile, or just a breathing dot',
      body: 'Show yourself to the room, or appear as a name and a pulse. Pose tracking works either way; only you see your corrections.' },
    { n: 'ii',  title: 'Rooms of two to twenty',
      body: 'A quiet pair session with a friend, or an open sunrise flow. Coaches can host bigger rooms as group classes.' },
    { n: 'iii', title: 'The room stays open',
      body: 'After savasana the room becomes a chat. Set the next time, share how it went, or just leave a wave.' }
  ],
  circles: [
    { kind: 'TIME OF DAY', name: 'Sunrise Warriors',       desc: 'Before 8am, wherever you are.' },
    { kind: 'TIME OF DAY', name: 'Moon Walkers',           desc: 'After 8pm. Slow, quiet, mostly yin.' },
    { kind: 'GOAL',        name: 'First Headstand',        desc: 'Twelve weeks of prep, together.' },
    { kind: 'GOAL',        name: 'Tight Hamstrings Club',  desc: 'Forward folds without shame.' },
    { kind: 'COACH',       name: "A coach's students",     desc: 'Everyone practising with the same teacher.' },
    { kind: 'PLACE',       name: 'Your city',              desc: 'Online rooms, and a park meet-up when the weather allows.' }
  ],
  shareScopes: [
    { label: 'Streak',          who: 'Friends',            on: true },
    { label: 'Badges',          who: 'Friends',            on: true },
    { label: 'Poses mastered',  who: 'Friends',            on: false },
    { label: 'Weekly minutes',  who: 'Circle',             on: false },
    { label: 'Session history', who: 'A coach you choose', on: false }
  ],
  rules: [
    { n: '01', title: 'No leaderboards, ever',
      body: 'Rankings push people to force poses, and forcing poses is how yoga injures people. Progress is shared, never ranked.' },
    { n: '02', title: 'Friends only by default',
      body: 'Nothing you do is visible to strangers unless you turn it on. Rooms are private unless the host opens them.' },
    { n: '03', title: 'Corrections stay private',
      body: 'In a room, the coach speaks only to you. Nobody else hears what you are working on.' },
    { n: '04', title: "Cheer, don't compare",
      body: 'Reactions are breaths, not likes. There are no counts on profiles.' },
    { n: '05', title: 'Leave any time',
      body: 'Mute a room, leave a circle, unfriend quietly. Nobody is notified.' }
  ],

  /* ── FAQ ─────────────────────────────────────────────────── */
  faqs: [
    { q: 'Does anyone see my camera feed?',
      a: 'No. Video is processed on your phone and discarded frame by frame. Our servers receive joint angles and scores, never images. There is nothing to watch, even for us.' },
    { q: "I'm a complete beginner. Will it just tell me I'm wrong all the time?",
      a: 'Every pose ships with beginner, intermediate and advanced tolerances, and over time the app scales to your own baseline. A tight hamstring is a starting point, not an error.' },
    { q: 'What happens after the $3 trial?',
      a: 'After 14 days it becomes the $15 monthly membership. We email you two days before, and cancelling takes one tap.' },
    { q: 'Are coaching sessions included in the membership?',
      a: 'No. Coaches set their own hourly rate, and you pay per session. Your membership gives you their published poses and sequences to practise between calls.' },
    { q: 'Can a teacher look at my progress?',
      a: 'If you want them to. You choose which sessions, poses or your full history to send a coach for review. They see the same angles and scores the app saw, never video, and can reply with notes or a sequence to work on. Sharing is off by default and you can revoke it any time.' },
    { q: 'Do I need special equipment?',
      a: 'A phone with a camera and somewhere to lean it. Landscape, about two metres away, roughly hip height. The app checks your framing before each session.' },
    { q: 'Which phones?',
      a: 'iPhone first, Android shortly after. Join the waitlist and tell us which you use.' },
    { q: 'Is Yoginini available yet?',
      a: 'Not yet. Nothing has shipped, no coaches are signed, and there is no app to download. The waitlist is the only thing that is real today.' }
  ],

  billingFaqs: [
    { q: 'What exactly happens on day 14?',
      a: "Your $3 trial becomes the $15 monthly membership. You'll get an email on day 12 with a one-tap cancel link. Cancel before day 14 and you pay nothing more." },
    { q: 'Is the price the same in the app and on the web?',
      a: "Yes, $15 either way. App stores take a cut of in-app subscriptions, so subscribing on the web leaves more for building the product. We'd rather you didn't have to think about it." },
    { q: 'Do coaches charge extra for their poses and sequences?',
      a: 'No. Anything a coach publishes to the library is included in membership. Coaches earn from live sessions, not from gating content.' },
    { q: 'How are coach payments handled?',
      a: "Through Stripe. You pay per session at the coach's hourly rate; the coach receives 80% and is paid out automatically. Refunds for missed or cancelled sessions follow each coach's stated policy." },
    { q: 'Can I pause instead of cancelling?',
      a: 'Yes, for up to three months. Your streak is protected while paused, and your history is kept.' },
    { q: 'When does any of this start charging?',
      a: 'Not yet. There is no app and no payment form on this site. Nothing can charge you today, and the waitlist never asks for a card.' }
  ]
};
