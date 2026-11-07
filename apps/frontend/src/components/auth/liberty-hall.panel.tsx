import { sourceLink } from '@gitroom/frontend/components/auth/source.link';

// Liberty Hall's side of the login page, in libertyh.com's style: what this
// install is, where to ask about using it, Postiz's own service, and (as the
// AGPL asks) where the source of the running build is.
const css = `
@font-face{font-family:"IM Fell English";src:url(/liberty-hall/IMFellEnglish-Regular.woff2) format("woff2");font-display:swap}
@font-face{font-family:"IM Fell English";font-style:italic;src:url(/liberty-hall/IMFellEnglish-Italic.woff2) format("woff2");font-display:swap}
@font-face{font-family:"IM Fell English SC";src:url(/liberty-hall/IMFellEnglishSC-Regular.woff2) format("woff2");font-display:swap}
.lh{--paper:#f4efe4;--ink:#1d1b18;--red:#9e2a1f;--mute:#6f675b;
  background:var(--paper);color:var(--ink);color-scheme:light;
  font:19px/1.5 "IM Fell English",Georgia,"Times New Roman",serif;text-align:center}
.lh .tree{width:min(240px,60vw);margin:0 auto;aspect-ratio:720/579;background:var(--ink);
  -webkit-mask:url(/liberty-hall/tree.png) center/contain no-repeat;mask:url(/liberty-hall/tree.png) center/contain no-repeat}
.lh h2{font:normal clamp(36px,6vw,48px)/1 "IM Fell English SC",Georgia,serif;margin:18px 0 0}
.lh h2 span{color:var(--red)}
.lh .fleur{width:26px;height:31px;margin:14px auto 0;background:var(--red);
  -webkit-mask:url(/liberty-hall/fleur.png) center/contain no-repeat;mask:url(/liberty-hall/fleur.png) center/contain no-repeat}
.lh .tag{margin:8px 0 0;font-style:italic;color:var(--mute)}
.lh .body{max-width:30em;margin:28px auto 0;text-wrap:pretty}
.lh .body p{margin:0 0 14px}
.lh .source{margin:28px auto 0;max-width:36em;font-size:14px;color:var(--mute);text-wrap:balance}
.lh a{color:inherit;text-decoration:underline;text-decoration-color:var(--red);text-underline-offset:.18em}
.lh a:hover{color:var(--red)}
.lh a:focus-visible{outline:2px solid var(--red);outline-offset:3px}
`;

export function LibertyHallPanel() {
  const source = sourceLink(process.env.NEXT_PUBLIC_VERSION);
  return (
    <div className="lh flex-1 flex flex-col justify-center rounded-[12px] py-[40px] px-[20px]">
      <style>{css}</style>
      <div className="tree" aria-hidden="true" />
      <h2>
        <span>L</span>iberty <span>H</span>all
      </h2>
      <div className="fleur" aria-hidden="true" />
      <p className="tag">Social Scheduling</p>
      <div className="body">
        <p>
          This is Liberty Hall’s social media scheduler. We and the groups we
          work with use it to write posts once and publish them, on time, to
          each of our accounts.
        </p>
        <p>
          If you’d like to use it too, see{' '}
          <a href="https://libertyh.com/">libertyh.com</a> for details.
        </p>
        <p>
          It runs <a href="https://postiz.com/">Postiz</a>, an open-source
          scheduler. If you would rather have your own, Postiz provide an
          excellent service you can set up in five minutes.
        </p>
      </div>
      <p className="source">
        Postiz is free software under the{' '}
        <a href="https://www.gnu.org/licenses/agpl-3.0.html">
          GNU Affero General Public License
        </a>
        . The source of this copy, with Liberty Hall’s changes, is at{' '}
        <a href="https://github.com/Liberty-Hall/postiz-app">
          github.com/Liberty-Hall/postiz-app
        </a>{' '}
        (this build: <a href={source.url}>{source.label}</a>).
      </p>
    </div>
  );
}
