var config = require("../config.js");

const NAMESPACE_ROOT = `${config.config.project}/SESForwarder`;

/**
 * emitMetric to CloudWatch using Embedded Metric Format (EMF) of logging from Lambda.  For example:
 *
 * {"_aws":{"Timestamp":1611034887493,"CloudWatchMetrics":[{"Namespace":"MyDomain/SESForwarder/Spam",
 * "Dimensions":[["Type"]],"Metrics":[{"Name":"Viagra","Unit":"Count"}]}]},"Viagra":1,"Type":"SubjectKeyword"}
 *
 * See: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format_Specification.html
 * Also: https://aws.amazon.com/blogs/mt/lowering-costs-and-focusing-on-our-customers-with-amazon-cloudwatch-embedded-custom-metrics/
 *
 * Params:
 *   metricName is a string name of metric.
 *
 *   dimensions is an array of dimension objets, following cloudwatch.putMetric schema.
 *     For example:
 *
 *     const dimensions = [
 *       {
 *         Name: 'MyDimensionName',
 *         Value: 'MyDimensionValue'
 *       }
 *     ];
 *
 *    namespace is a string of the CloudWatch namespace that metrics will be emitted under.
 */
function emitMetric(metricName, dimensions= [], namespace = NAMESPACE_ROOT) {
  // The EMF log spec puts dimension keys inside the schema and values outside at root level.
  // Build up a list of just the keys.
  let dimensionKeys = [], dimensionsArray = [];
  for (const dimension of dimensions){
    dimensionKeys.push(dimension.Name);
  }

  // Create the EMF log structure following the spec.
  let embeddedMetricLog = {
    "_aws": {
        "Timestamp": Date.now(),
        "CloudWatchMetrics": [
            {
                "Namespace": namespace,
                "Dimensions": [ dimensionKeys ],
                "Metrics": [
                    {
                        "Name": metricName,
                        "Unit": "Count"
                    }
                ]
            }
        ]
    }
  };

  // Add the metric name and count as a root element, following EMF spec
  embeddedMetricLog[metricName] = 1.0;

  // Add the dimension mapping as root elements, following EMF spec.
  for (const dimension of dimensions){
    embeddedMetricLog[dimension.Name] = dimension.Value;
  }

  // When executing in Lambda, EMF spec just needs to be emitted as std output.
  console.log(JSON.stringify(embeddedMetricLog));

  // Return true to signal success logging metric
  return true;
}


/**
 * emitSpamMetric to CloudWatch using consistent namespace.
 * Type is the type of spam reason, usually per filter type.
 * Term is the specific term of this type that triggered the spam flag.
 */
function emitSpamMetric(type, term) {
  const dimensions = [
    {
      Name: 'Type',
      Value: type
    },
  ];

  return emitMetric(term, dimensions, `${NAMESPACE_ROOT}/Spam`);
}


/**
 * emitResultMetric to CloudWatch using consistent namespace.
 * Result Examples: Success, Error, Spam, Other...
 */
function emitResultMetric(result) {
  const dimensions = [];
  return emitMetric(result, dimensions, `${NAMESPACE_ROOT}/Result`);
}


module.exports = {
  emitMetric,
  emitSpamMetric,
  emitResultMetric
};

