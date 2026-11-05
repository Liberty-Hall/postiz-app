// Run with: node --test libraries/nestjs-libraries/src/emails/html.to.text.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { htmlToText } from './html.to.text.ts';
import { emailTemplate } from './email.template.ts';

test('drops tags and keeps the words', () => {
  assert.equal(htmlToText('<p>Hello <b>there</b></p>'), 'Hello there\n');
});

test('writes a link as its text followed by its address', () => {
  assert.equal(
    htmlToText('Click <a href="https://x.example/activate/abc">here</a> to activate'),
    'Click here (https://x.example/activate/abc) to activate\n'
  );
});

test('writes a link whose text is its address once', () => {
  assert.equal(
    htmlToText('<a href="https://x.example/">https://x.example/</a>'),
    'https://x.example/\n'
  );
});

test('leaves out the head, styles and scripts', () => {
  const text = htmlToText(
    '<html><head><title>T</title><style>a { color: red; }</style></head><body>Body<script>x()</script></body></html>'
  );
  assert.equal(text, 'Body\n');
});

test('breaks lines at block elements and br, without piling up blank lines', () => {
  assert.equal(
    htmlToText('<h1>Title</h1>\n\n\n<div>One<br>Two</div><div></div><div>Three</div>'),
    'Title\nOne\nTwo\nThree\n'
  );
});

test('decodes entities', () => {
  assert.equal(
    htmlToText('Tom &amp; Jerry &lt;3 &quot;hi&quot; &#39;yo&#39; a&nbsp;b &#8212; &#x2014;'),
    'Tom & Jerry <3 "hi" \'yo\' a b — —\n'
  );
});

test('turns a whole email into readable text', () => {
  const text = htmlToText(
    emailTemplate({
      subject: 'Activate your account',
      html: 'Click <a href="https://post.example.com/auth/activate/x">here</a> to activate your account',
      fromName: 'Example Org',
      frontendUrl: 'https://post.example.com',
    })
  );
  assert.doesNotMatch(text, /[<>]/);
  assert.doesNotMatch(text, /color/);
  assert.match(text, /^Activate your account\n/);
  assert.match(text, /Click here \(https:\/\/post\.example\.com\/auth\/activate\/x\) to activate your account/);
  assert.match(text, /Example Org/);
  assert.match(text, /account settings\. \(https:\/\/post\.example\.com\/settings\)/);
});
