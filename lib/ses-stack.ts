import * as cdk from "@aws-cdk/core";
import iam = require("@aws-cdk/aws-iam");
import lambda = require("@aws-cdk/aws-lambda");
import s3 = require("@aws-cdk/aws-s3");
import ses = require("@aws-cdk/aws-ses");
import actions = require("@aws-cdk/aws-ses-actions");
import cloudwatch = require('@aws-cdk/aws-cloudwatch');
import path = require("path");

import { SpamFilterOption, config } from "../lambda/config";

export class SesStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, `${config.project}SESBucket`, {
        lifecycleRules: [
          {
            transitions: [
                {
                    storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                    transitionAfter: cdk.Duration.days(30),
                },
                {
                    storageClass: s3.StorageClass.GLACIER,
                    transitionAfter: cdk.Duration.days(90),
                },
            ],
          },
        ],
    });

    const forwarderLambda = new lambda.Function(this, `${config.project}SESForwarder`, {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "handler.handler",
      functionName: `${config.project}SESForwarder`,
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda")),
      environment: {
        BUCKETNAME: bucket.bucketName
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 128
    });

    const lambdaRole = forwarderLambda.role as iam.Role;

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
          recipients: [ `.${config.domain}`, config.domain ],
          actions: [
            new actions.AddHeader({
              name: "X-Special-Header",
              value: config.headerValue
            }),
            new actions.S3({
              bucket,
              objectKeyPrefix: config.emailKeyPrefix
            }),
            new actions.Lambda({
              function: forwarderLambda
            }),
            new actions.Stop({})
          ]
        }
      ]
    };

    new ses.ReceiptRuleSet(this, `${config.project}RuleSet`, ruleSetProperties);


    /* Define a CloudWatch Metrics Dashboard */

    // Total Incoming
    let totalIncomingWidget = new cloudwatch.SingleValueWidget({
        title: 'Total Incoming',
        width: 6,
        height: 3,
        setPeriodToTimeRange: true,
        metrics: [new cloudwatch.Metric({
            namespace: "AWS/Lambda",
            metricName: 'Invocations',
            dimensions: {
                FunctionName: forwarderLambda.functionName
            },
            statistic: 'Sum'
        })]
    });

    // Total Dropped
    let totalDroppedWidget = new cloudwatch.SingleValueWidget({
        title: 'Total Dropped',
        width: 6,
        height: 3,
        setPeriodToTimeRange: true,
        metrics: [new cloudwatch.Metric({
            namespace: `${config.project}/SESForwarder/Result`,
            metricName: 'Spam',
            statistic: 'Sum'
        })]
    });

    // Total Errors
    let totalErrorsWidget = new cloudwatch.SingleValueWidget({
        title: 'Total Errors',
        width: 6,
        height: 3,
        setPeriodToTimeRange: true,
        metrics: [new cloudwatch.Metric({
            namespace: `${config.project}/SESForwarder/Result`,
            metricName: 'Error',
            statistic: 'Sum'
        })]
    });

    // Total Forwarded
    let totalForwardedWidget = new cloudwatch.SingleValueWidget({
        title: 'Total Forwarded',
        width: 6,
        height: 3,
        setPeriodToTimeRange: true,
        metrics: [new cloudwatch.Metric({
            namespace: `${config.project}/SESForwarder/Result`,
            metricName: 'Success',
            statistic: 'Sum'
        })]
    });

    // Lambda Invocations and Duration
    const executionsWidget = new cloudwatch.GraphWidget({
        title: 'Forwarder Executions',
        width: 12,
        height: 3,
        left: [new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            dimensions: {
                FunctionName: forwarderLambda.functionName
            },
            statistic: 'Sum'
        })],
        right: [new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Duration',
            dimensions: {
                FunctionName: forwarderLambda.functionName
            },
            statistic: 'Sum'
        })],
        rightYAxis: {
            label: "Latency"
        },
    });

    // Results
    let resultWidget = new cloudwatch.GraphWidget({
        title: 'Forwarder Results',
        width: 12,
        height: 3,
        stacked: true,
        left: [new cloudwatch.Metric({
            namespace: `${config.project}/SESForwarder/Result`,
            metricName: 'Error',
            statistic: 'Sum'
        }),
        new cloudwatch.Metric({
            namespace: `${config.project}/SESForwarder/Result`,
            metricName: 'Spam',
            statistic: 'Sum'
        }),
        new cloudwatch.Metric({
            namespace: `${config.project}/SESForwarder/Result`,
            metricName: 'Success',
            statistic: 'Sum'
        })]
    });

    // Spam Tags
    let spamWidget = new cloudwatch.GraphWidget({
        title: 'Spam Tags by Type',
        width: 12,
        height: 9,
        left: [new cloudwatch.MathExpression({
            expression: `SEARCH('{${config.project}/SESForwarder/Spam,Type}', 'Sum', 300)`,
            usingMetrics: { },
            label: ' '
        })]
    });

    // Results
    let sesWidget = new cloudwatch.GraphWidget({
        title: 'Total Account SES Sends',
        width: 12,
        height: 3,
        stacked: true,
        left: [new cloudwatch.Metric({
            namespace: 'AWS/SES',
            metricName: 'Send',
            statistic: 'Sum'
        })]
    });

    // Recent logs
    let queryLinesList = ['fields @timestamp, mail.commonHeaders.from.0, mail.destination.0, mail.commonHeaders.subject, ispresent(mail.commonHeaders.from.0) as fw'];
    queryLinesList.push('filter fw != 0');
    queryLinesList.push('sort @timestamp desc');
    queryLinesList.push('limit 10');
    let logWidget = new cloudwatch.LogQueryWidget({
        title: 'Recent Forwarder Logs',
        logGroupNames: [forwarderLambda.logGroup.logGroupName],
        queryLines: queryLinesList,
        width: 24,
        height: 6
    });

    const emailDashboard = new cloudwatch.Dashboard(this, `${config.project}EmailDashboard`, {
      dashboardName: `${config.project}-Email-Dashboard`,
      widgets: [
        [
          new cloudwatch.Column(totalIncomingWidget),
          new cloudwatch.Column(totalDroppedWidget),
          new cloudwatch.Column(totalErrorsWidget),
          new cloudwatch.Column(totalForwardedWidget),
        ],
        [
          new cloudwatch.Column(executionsWidget, resultWidget, sesWidget),
          new cloudwatch.Column(spamWidget),
        ],
        [
          logWidget
        ]
      ]
    });

  }
}
