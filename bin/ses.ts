#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SesStack } from '../lib/ses-stack';

const app = new cdk.App();
new SesStack(app, 'StubMinerSesStack');
