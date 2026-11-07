// Where to find the source of the running build, from its version (set at
// build time from `git describe --tags`): the commit if the build is past a
// tag, the tag if it is a release, or else the deploy branch.
const repo = 'https://github.com/Liberty-Hall/postiz-app';

export function sourceLink(version: string | undefined): {
  url: string;
  label: string;
} {
  const v = (version || '').trim();
  const commit = v.match(/-g([0-9a-f]{7,40})$/);
  if (commit) {
    return { url: `${repo}/tree/${commit[1]}`, label: `commit ${commit[1]}` };
  }
  if (/^v\d+(\.\d+)*$/.test(v)) {
    return { url: `${repo}/tree/${v}`, label: v };
  }
  return { url: `${repo}/tree/deploy`, label: 'deploy branch' };
}
