import * as cdk from "@aws-cdk/core";
import iam = require("@aws-cdk/aws-iam");
import lambda = require("@aws-cdk/aws-lambda");
import s3 = require("@aws-cdk/aws-s3");
import ses = require("@aws-cdk/aws-ses");
import actions = require("@aws-cdk/aws-ses-actions");
import path = require("path");

import { SpamFilterOption, config } from "../lambda/config";

export class SesStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, `${config.project}SESBucket`);

    const func = new lambda.Function(this, `${config.project}SESForwarder`, {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "handler.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda")),
      environment: {
        BUCKETNAME: bucket.bucketName
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 128
    });

    const lambdaRole = func.role as iam.Role;

    const policy = new iam.Policy(this, `${config.project}SESPolicy`);

    const policyStatementLog = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ["arn:aws:logs:*:*:*"],
      actions: [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
    });
    const policyStatementSes = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ["*"],
      actions: ["ses:SendRawEmail"]
    });
    const policyStatementS3 = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: [`${bucket.bucketArn}/*`],
      actions: ["s3:GetObject", "s3:PutObject"]
    });
    policy.addStatements(
      policyStatementLog,
      policyStatementS3,
      policyStatementSes
    );
    lambdaRole.attachInlinePolicy(policy);

    if (config.spamFilter == SpamFilterOption.NONE) console.warn("Warning: you are not using any spam filter!");
    const ruleSetProperties = {
      dropSpam: config.spamFilter == SpamFilterOption.DEFAULT ? true : false,
      rules: [
        {
          enabled: true,
          actions: [
            new actions.AddHeader({
              name: "X-Special-Header",
              value: config.headerValue
            }),
            new actions.S3({
              bucket,
              objectKeyPrefix: config.emailKeyPrefix
            }),
            new actions.Lambda({ function: func })
          ]
        }
      ]
    };

    new ses.ReceiptRuleSet(this, `${config.project}RuleSet`, ruleSetProperties);
  }
}
