import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import { Construct } from "constructs";
import { createTables } from "./constructs/tables";
import { createLambdas } from "./constructs/lambdas";
import { createApi } from "./constructs/api";

const DOMAIN = process.env.INBOXPILOT_DOMAIN || "inboxpilot.premprakash.dev";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const certificate = new acm.Certificate(this, "InboxPilotCert", {
      domainName: DOMAIN,
      validation: acm.CertificateValidation.fromDns(),
    });

    const tables = createTables(this);
    const lambdas = createLambdas(this, { domain: DOMAIN, tables });
    const api = createApi(this, { domain: DOMAIN, certificate, lambdas });

    new cdk.CfnOutput(this, "ApiUrl", { value: `https://${DOMAIN}` });
    new cdk.CfnOutput(this, "ApiGatewayDomainTarget", {
      value: api.domainName.regionalDomainName,
      description: "Add this as CNAME target in Cloudflare for " + DOMAIN,
    });
    new cdk.CfnOutput(this, "CertificateArn", { value: certificate.certificateArn });
  }
}
