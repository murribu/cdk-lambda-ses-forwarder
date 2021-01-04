// This is an example configuration file.
// Copy it to `config.js` and change the values below.

exports.config = {
  // 'project' - A short identifier string used in naming AWS resources
  project: "MyProject",

  // 'recipient' - Forwarded emails will come from this verified address
  recipient: "contact@example.com",

  // 'headerValue' - Value added to a header named 'X-Special-Header'
  headerValue: "forwarded",

  // 'emailKeyPrefix' - S3 key name prefix where SES stores email.
  //  Include the trailing slash.
  emailKeyPrefix: "emails/",

  // 'subjectPrefix' - Forwarded email subjects will contain this string.
  subjectPrefix: "",

  // 'allowPlusSign' - Enables support for plus sign suffixes on email addresses.
  //   If set to `true`, the username/mailbox part of an email address is parsed
  //   to remove anything after a plus sign. For example, an email sent to
  //   `example+test@example.com` would be treated as if it was sent to
  //   `example@example.com`.
  allowPlusSign: true,

  // 'spamFilter' - Choose between spam filter options:
  //  0 = None, good for initial setup and troubleshooting email receipt.
  //  1 = Default, uses the `dropSpam` singleton lambda defined by CDK.
  //  2 = Custom, uses the lambda in this project.
  spamFilter: 2,  // 0 = None, 1 = Default, 2 = Custom

  //  'forwardMapping' - Object where the key is the lowercase email address from
  //   which to forward and the value is an array of email addresses to which to
  //   send the message.
  //
  //   To match all email addresses on a domain, use a key without the name part
  //   of an email address before the "at" symbol (i.e. `@example.com`).
  //
  //   To match a mailbox name on all domains, use a key without the "at" symbol
  //   and domain part of an email address (i.e. `info`).
  //
  //   To match all email addresses matching no other mapping, use "@" as a key.
  forwardMapping: {
    "info@example.com": ["example.john@example.com", "example.jen@example.com"],
    "abuse@example.com": ["example.jim@example.com"],
    "@example.com": ["example.john@example.com"],
    info: ["info@example.com"]
  }
};
