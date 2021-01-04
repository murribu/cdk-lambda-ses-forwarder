interface ForwardMapping {
  [key: string]: string[];
}

export declare const enum SpamFilterOption {
  NONE,
  DEFAULT,
  CUSTOM
}

interface Config {
  project: string;
  recipient: string;
  headerValue: string;
  emailKeyPrefix: string;
  subjectPrefix: string;
  allowPlusSign: boolean;
  spamFilter: SpamFilterOption;
  forwardMapping: ForwardMapping;
}

export declare const config: Config;
