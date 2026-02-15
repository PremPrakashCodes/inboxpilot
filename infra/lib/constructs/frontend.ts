import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";

const BUCKET_NAME = process.env.LAMBDA_BUCKET || "lambda-dependencies-store";

export interface FrontendProps {
	domain: string;
}

export interface FrontendResult {
	serverFn: lambda.Function;
	imageFn: lambda.Function;
	staticFn: lambda.Function;
}

export function createFrontend(
	scope: cdk.Stack,
	props: FrontendProps,
): FrontendResult {
	const openNextPath = path.join(__dirname, "../../..", "apps/web/.open-next");
	const bucket = s3.Bucket.fromBucketName(scope, "FrontendBucket", BUCKET_NAME);

	// SSR Lambda function
	const serverFn = new lambda.Function(scope, "FrontendServerFn", {
		functionName: "inboxpilot-frontend-server",
		runtime: lambda.Runtime.NODEJS_22_X,
		handler: "index.handler",
		code: lambda.Code.fromAsset(
			path.join(openNextPath, "server-functions/default"),
		),
		memorySize: 1024,
		timeout: cdk.Duration.seconds(30),
		environment: {
			CACHE_BUCKET_NAME: BUCKET_NAME,
			CACHE_BUCKET_KEY_PREFIX: "frontend-cache",
			NEXT_PUBLIC_API_URL: `https://${props.domain}`,
		},
	});

	bucket.grantReadWrite(serverFn);

	// Image optimization Lambda
	const imageFn = new lambda.Function(scope, "FrontendImageFn", {
		functionName: "inboxpilot-frontend-image",
		runtime: lambda.Runtime.NODEJS_22_X,
		handler: "index.handler",
		code: lambda.Code.fromAsset(
			path.join(openNextPath, "image-optimization-function"),
		),
		memorySize: 1536,
		timeout: cdk.Duration.seconds(25),
		environment: {
			BUCKET_NAME,
			BUCKET_KEY_PREFIX: "frontend-assets",
		},
	});

	bucket.grantRead(imageFn);

	// Static asset Lambda — serves _next/static files from S3
	const staticFn = new lambda.Function(scope, "FrontendStaticFn", {
		functionName: "inboxpilot-frontend-static",
		runtime: lambda.Runtime.NODEJS_22_X,
		handler: "index.handler",
		code: lambda.Code.fromInline(`
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const s3 = new S3Client({});
const MIME = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.map': 'application/json',
  '.txt': 'text/plain',
};
exports.handler = async (event) => {
  const key = process.env.PREFIX + event.rawPath;
  const ext = (key.match(/\\.[^.]+$/) || [''])[0];
  try {
    const { Body, ContentType } = await s3.send(new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
    }));
    const body = Buffer.from(await Body.transformToByteArray()).toString('base64');
    return {
      statusCode: 200,
      headers: {
        'content-type': MIME[ext] || ContentType || 'application/octet-stream',
        'cache-control': 'public, max-age=31536000, immutable',
        'access-control-allow-origin': '*',
      },
      body,
      isBase64Encoded: true,
    };
  } catch (e) {
    return { statusCode: 404, body: 'Not Found' };
  }
};
`),
		memorySize: 256,
		timeout: cdk.Duration.seconds(10),
		environment: {
			BUCKET_NAME,
			PREFIX: "frontend-assets",
		},
	});

	bucket.grantRead(staticFn);

	return { serverFn, imageFn, staticFn };
}
