interface ForwardMapping {
  [key: string]: string[];
}

interface Config {
  project: string;
  recipient: string;
  headerValue: string;
  emailKeyPrefix: string;
  subjectPrefix: string;
  allowPlusSign: boolean;
  forwardMapping: ForwardMapping;
}

export declare const config: Config;
