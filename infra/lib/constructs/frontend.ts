import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

export interface FrontendProps {
	domain: string;
}

export interface FrontendResult {
	serverFn: lambda.Function;
	imageFn: lambda.Function;
}

export function createFrontend(
	scope: cdk.Stack,
	props: FrontendProps,
): FrontendResult {
	const openNextPath = path.join(__dirname, "../../..", "apps/web/.open-next");

	// S3 bucket for static assets and cache
	const assetsBucket = new s3.Bucket(scope, "FrontendAssets", {
		bucketName: `inboxpilot-frontend-assets-${scope.account}`,
		blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
		removalPolicy: cdk.RemovalPolicy.DESTROY,
		autoDeleteObjects: true,
		enforceSSL: true,
	});

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
			CACHE_BUCKET_NAME: assetsBucket.bucketName,
			CACHE_BUCKET_KEY_PREFIX: "_cache",
			NEXT_PUBLIC_API_URL: `https://${props.domain}`,
		},
	});

	assetsBucket.grantReadWrite(serverFn);

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
			BUCKET_NAME: assetsBucket.bucketName,
			BUCKET_KEY_PREFIX: "_assets",
		},
	});

	assetsBucket.grantRead(imageFn);

	// Deploy static assets to S3
	new s3deploy.BucketDeployment(scope, "FrontendAssetsDeploy", {
		destinationBucket: assetsBucket,
		destinationKeyPrefix: "_assets",
		sources: [s3deploy.Source.asset(path.join(openNextPath, "assets"))],
		prune: true,
	});

	// Deploy cache assets
	new s3deploy.BucketDeployment(scope, "FrontendCacheDeploy", {
		destinationBucket: assetsBucket,
		destinationKeyPrefix: "_cache",
		sources: [s3deploy.Source.asset(path.join(openNextPath, "cache"))],
		prune: false,
	});

	return { serverFn, imageFn };
}
