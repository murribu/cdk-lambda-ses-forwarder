#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SesStack } from '../lib/ses-stack';
import { config } from "../lambda/config";

const app = new cdk.App();
new SesStack(app, `SesForwarder${config.project}`);
