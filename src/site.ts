/** Site-wide facts in one place. */
export const SITE = {
  name: 'Bill Baran',
  title: 'Bill Baran · Software architect',
  role: 'Software architect & senior engineer',
  location: 'Boise, Idaho',
  summary:
    'I design and build systems that stay up for decades: government licensing and payment platforms, ' +
    'AWS infrastructure, and lately the plumbing that makes LLM agents dependable.',
  github: 'https://github.com/wkbaran',
  linkedin: 'https://www.linkedin.com/in/billbaran',
  // Assembled in the browser on click (see Contact.astro), so it isn't in the HTML as one string.
  email: { user: 'hello', domain: 'billbaran.us' },
  // "Carbon and signal red": a near-neutral grey, so each app's demo can carry its own colour beside it.
  palette: '#1a1b1d,#ecebe6,#ff5a4e',
};
