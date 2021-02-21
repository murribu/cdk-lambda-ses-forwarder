This is a CDK-ification of [this project](https://github.com/arithmetric/aws-lambda-ses-forwarder)

# Steps

## Initial Deployment

1. [Buy a domain](https://console.aws.amazon.com/route53/home#DomainRegistration:)
1. [Verify your domain in SES](https://console.aws.amazon.com/ses/home?region=us-east-1#verified-senders-domain:)
1. clone the repo
1. `cp ./lambda/config.example.js ./lambda/config.js`
1. Fill in your info in the config file
1. `yarn`
1. `npx cdk synth`
1. `npx cdk deploy --require-approval never`
1. Go into [your SES Console](https://console.aws.amazon.com/ses/home?region=us-east-1#receipt-rules:) and set your new RuleSet as Active. If you have an existing RuleSet, clone it as backup then copy your new rules into your existing rule set manually.
1. [Verify the email address(es) that you're forwarding to](https://console.aws.amazon.com/ses/home?region=us-east-1#verified-senders-email:)
1. Send a test email to your recipient, and it should forward correctly

## Updates
After pulling down a code update, re-run the deployment command:
1. `npx cdk deploy --require-approval never`
1. If you have only modified the lambda, then you are done.  If you have modified any CDK or related configuration that changes the SES rule set, then take the following manual steps:
1. Go into [your SES Console](https://console.aws.amazon.com/ses/home?region=us-east-1#receipt-rules:), locate your rule and copy it into your active rule set. You may have to change the name, to copy2, etc.
1. Open your active rule set, enable the new rule you just copied, then disable the old rule.


