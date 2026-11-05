// The page every email is sent in. Mail clients support little CSS, and in
// dark mode they recolour text and solid background colours but not
// gradients or translucent colours, so this sticks to tables, solid colours
// (as both bgcolor and background-color) and a declared light colour scheme.
export function emailTemplate({
  subject,
  html,
  fromName,
  frontendUrl,
}: {
  subject: string;
  html: string;
  fromName: string;
  frontendUrl: string;
}) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<style>
  :root { color-scheme: light; supported-color-schemes: light; }
  a { color: #2563eb; }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3f4f6" style="background-color: #f3f4f6;">
  <tr>
    <td align="center" style="padding: 32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background-color: #ffffff; max-width: 768px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <tr>
          <td style="padding: 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #374151; font-size: 16px; line-height: 1.5;">
            <h1 style="margin: 0 0 24px; font-size: 30px; font-weight: bold; color: #1f2937;">${subject}</h1>
            <div style="margin-bottom: 32px; color: #374151;">
              ${html}
            </div>
            <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
              <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #1f2937;">${fromName}</h2>
              <div style="font-size: 12px; color: #6b7280;">
                You can change your notification preferences in your <a href="${frontendUrl}/settings" style="color: #2563eb;">account settings.</a>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
`;
}
