/** Site-wide facts in one place. */

// Counted from the first job, at Geneer in 1998.
const years = new Date().getFullYear() - 1998;

export const SITE = {
  name: 'Bill Baran',
  title: 'Bill Baran · Software architect',
  role: 'Software architect & senior engineer',
  location: 'Boise, Idaho',
  years,
  summary:
    'I build systems that stay up, retire technical debt on purpose, and bring new technology into critical ' +
    `environments responsibly. For ${years} years that has mostly meant government payment and licensing services; ` +
    'lately it also means AWS architecture and AI-assisted development.',
  github: 'https://github.com/wkbaran',
  linkedin: 'https://www.linkedin.com/in/billbaran',
  // Assembled in the browser on click (see Contact.astro), so it isn't in the HTML as one string.
  email: { user: 'hello', domain: 'billbaran.us' },
  // "Carbon and signal red": a near-neutral grey, so each app's demo can carry its own colour beside it.
  palette: '#1a1b1d,#ecebe6,#ff5a4e',
};
