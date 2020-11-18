exports.config = {
  project: "MyProject",
  recipient: "contact@example.com",
  headerValue: "example",
  emailKeyPrefix: "emails/",
  subjectPrefix: "",
  allowPlusSign: true,
  forwardMapping: {
    "info@example.com": ["example.john@example.com", "example.jen@example.com"],
    "abuse@example.com": ["example.jim@example.com"],
    "@example.com": ["example.john@example.com"],
    info: ["info@example.com"]
  }
};
