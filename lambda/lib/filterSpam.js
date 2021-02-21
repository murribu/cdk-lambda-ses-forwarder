const AWS = require("aws-sdk");
const config = require("../config.js");
const { emitMetric, emitSpamMetric }  = require("./metrics.js");

const spamKey = "SPAM";

/**
 * Filters out spam, if custom filter is enabled in config.
 * Some basic filters are included below.
 * To add more custom filters:
 * 1. Create a function that emits metrics and returns true if spam is found.
 * 2. Add a  call to your new function in the list below.
 * 3. Consider contributing this back to the project in a PR!
 */
function filterSpam(data) {
  let spam = false; // Flag to set by one or more of the filter checks.

  // Only check for spam to drop if custom filter is configured
  if (config.config.spamFilter == 2) {
    console.log('Custom Spam Filter is enabled.  Running filters...');

    // Get the SES notification object from the data event
    const sesNotification = data.event.Records[0].ses;
    console.log("SES Notification:\n", JSON.stringify(sesNotification, null, 2));

    // Run through a series of filters.
    if(filterBySESReceiptVerdicts(sesNotification.receipt)) spam = true;
    if(filterBySubjectKeyword(sesNotification.mail.commonHeaders.subject)) spam = true;
    if(filterByTargetRecipient(sesNotification.mail.destination[0])) spam = true;
  }

  // If the spam flag is still not set after all the spam filters, then forward the email.
  if (!spam) {
    return Promise.resolve(data);
  } else {
    // If the spam flag is set by any of the spam filters, then reject the promise to stop the forward.
    data.log({
      message: "Dropped Spam.",
      level: "error",
      event: JSON.stringify(data.event)
    });
    return Promise.reject(new Error(spamKey));
  }
}


/**
 * Filter By SES Receipt Verdicts
 * The following logic is from AWS Docs and is also found in the default CDK dropSpam implementation.
 * This function has the same impact as choosing spamFilter config = 1 = Default
 * Docs:  https://docs.aws.amazon.com/ses/latest/DeveloperGuide/receiving-email-action-lambda-example-functions.html
 **/
function filterBySESReceiptVerdicts(sesReceipt) {
  console.log("filterBySESverdicts");
  const typeName = 'SESReceiptVerdict';
  let spam = false;
  if (sesReceipt.spfVerdict.status === 'FAIL') spam = logSpam(typeName, 'Sender Policy Framework (SPF)');
  if (sesReceipt.dkimVerdict.status === 'FAIL') spam = logSpam(typeName, 'DomainKeys Identified Mail (DKIM)');
  if (sesReceipt.spamVerdict.status === 'FAIL') spam = logSpam(typeName, 'AWS Spam Verdict');
  if (sesReceipt.virusVerdict.status === 'FAIL') spam = logSpam(typeName, 'AWS Virus Verdict');
  return spam;
}


/**
 * Filter by Subject Keyword
 * Given an email subject, tag it as spam if it contains any configured keywords.
 **/
function filterBySubjectKeyword(subject) {
  console.log("filterBySubject");
  const typeName = 'SubjectKeyword';
  let spam = false;

  for (let i = 0; i < config.config.subjectFilterKeywords.length; i++) {
    const keyword = config.config.subjectFilterKeywords[i];
    if (subject.toLowerCase().includes(keyword.toLowerCase())) spam = logSpam(typeName, keyword);
  }

  return spam;
}


/**
 * Filter By Target Recipient will check the To: email value and drop any configured addresses.
 * Use this if you want to give an email to someone you know will spam you (games, conferences).
 **/
function filterByTargetRecipient(recipientEmail) {
  console.log("filterByTarget");
  const typeName = 'TargetRecipient';
  let spam = false;

  for (const recipient of config.config.blockedRecipients) {
    if (recipientEmail === recipient) spam = logSpam(typeName, recipient.replace('@', '.'));
  }

  return spam;
}


/**
 * Log Spam emits a metric and returns true, to easily set the spam flag.
 * The intent is to record metrics for every reason an email is determined to be spam.
 **/
function logSpam(type, term) {
  console.log(`Logging spam, type=${type}, term=${term}`);
  emitSpamMetric(type, term);
  return true;
}


module.exports = {
    filterSpam,
    spamKey
};

