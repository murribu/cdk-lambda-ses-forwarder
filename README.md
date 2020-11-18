This is a CDK-ification of [this project](https://github.com/arithmetric/aws-lambda-ses-forwarder)

# Steps

1. [Buy a domain](https://console.aws.amazon.com/route53/home#DomainRegistration:)
1. [Verify your domain in SES](https://console.aws.amazon.com/ses/home?region=us-east-1#verified-senders-domain:)
1. clone the repo
1. `cp ./lambda/config.example.js ./lambda/config.js`
1. Fill in your info in the config file
1. `yarn`
1. `npx cdk synth`
1. `npx cdk deploy --require-approval never`
1. Go into [your SES Console](https://console.aws.amazon.com/ses/home?region=us-east-1#receipt-rules:) and set your new RuleSet as Active
