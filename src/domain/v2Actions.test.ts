import { isAllowedEmail } from './access';
import { buildEmailTemplate } from './emailTemplates';

it('accepts only allowlisted workspace emails', () => {
  const allowlist = ['ashish@arkitech.example', 'terri@arkitech.example'];
  expect(isAllowedEmail('Ashish@ArkiTech.Example', allowlist)).toBe(true);
  expect(isAllowedEmail('someone@else.example', allowlist)).toBe(false);
});

it('builds an editable follow-up email with real names', () => {
  expect(buildEmailTemplate('follow_up', { ownerName: 'Maya', businessName: 'Harbor Dental' })).toEqual({
    subject: 'Quick follow-up for Harbor Dental',
    body: expect.stringContaining('Hey Maya, just circling back'),
  });
});
