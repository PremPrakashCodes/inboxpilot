import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import type * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

export interface FrontendProps {
	domain: string;
	certificate: acm.ICertificate;
}

export interface FrontendResult {
	distribution: cloudfront.Distribution;
}

export function createFrontend(
	scope: cdk.Stack,
	props: FrontendProps,
): FrontendResult {
	const openNextPath = path.join(__dirname, "../../..", "apps/web/.open-next");

	// S3 bucket for static assets
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
			NEXT_PUBLIC_API_URL: `https://api.${props.domain}`,
		},
	});

	assetsBucket.grantReadWrite(serverFn);

	const serverFnUrl = serverFn.addFunctionUrl({
		authType: lambda.FunctionUrlAuthType.NONE,
		invokeMode: lambda.InvokeMode.RESPONSE_STREAM,
	});

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

	const imageFnUrl = imageFn.addFunctionUrl({
		authType: lambda.FunctionUrlAuthType.NONE,
	});

	// Cache policies
	const serverCachePolicy = new cloudfront.CachePolicy(
		scope,
		"FrontendServerCachePolicy",
		{
			cachePolicyName: "inboxpilot-server",
			defaultTtl: cdk.Duration.seconds(0),
			maxTtl: cdk.Duration.days(365),
			minTtl: cdk.Duration.seconds(0),
			cookieBehavior: cloudfront.CacheCookieBehavior.all(),
			headerBehavior: cloudfront.CacheHeaderBehavior.allowList(
				"x-open-next-cache-key",
			),
			queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
			enableAcceptEncodingGzip: true,
			enableAcceptEncodingBrotli: true,
		},
	);

	const staticCachePolicy = new cloudfront.CachePolicy(
		scope,
		"FrontendStaticCachePolicy",
		{
			cachePolicyName: "inboxpilot-static",
			defaultTtl: cdk.Duration.days(30),
			maxTtl: cdk.Duration.days(365),
			minTtl: cdk.Duration.days(1),
			cookieBehavior: cloudfront.CacheCookieBehavior.none(),
			headerBehavior: cloudfront.CacheHeaderBehavior.none(),
			queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
			enableAcceptEncodingGzip: true,
			enableAcceptEncodingBrotli: true,
		},
	);

	// Extract hostname from Lambda function URL
	const serverOrigin = new origins.FunctionUrlOrigin(serverFnUrl);
	const imageOrigin = new origins.FunctionUrlOrigin(imageFnUrl);
	const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(
		assetsBucket,
		{ originPath: "/_assets" },
	);

	// CloudFront distribution
	const distribution = new cloudfront.Distribution(
		scope,
		"FrontendDistribution",
		{
			domainNames: [props.domain],
			certificate: props.certificate,
			defaultBehavior: {
				origin: serverOrigin,
				cachePolicy: serverCachePolicy,
				allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
				cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
				viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
				originRequestPolicy:
					cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
			},
			additionalBehaviors: {
				"_next/static/*": {
					origin: s3Origin,
					cachePolicy: staticCachePolicy,
					viewerProtocolPolicy:
						cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
				},
				"_next/image": {
					origin: imageOrigin,
					cachePolicy: serverCachePolicy,
					allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
					viewerProtocolPolicy:
						cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
				},
				"favicon.ico": {
					origin: s3Origin,
					cachePolicy: staticCachePolicy,
					viewerProtocolPolicy:
						cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
				},
			},
		},
	);

	// Deploy static assets to S3
	new s3deploy.BucketDeployment(scope, "FrontendAssetsDeploy", {
		destinationBucket: assetsBucket,
		destinationKeyPrefix: "_assets",
		sources: [s3deploy.Source.asset(path.join(openNextPath, "assets"))],
		distribution,
		distributionPaths: ["/_next/static/*"],
		prune: true,
	});

	// Deploy cache assets
	new s3deploy.BucketDeployment(scope, "FrontendCacheDeploy", {
		destinationBucket: assetsBucket,
		destinationKeyPrefix: "_cache",
		sources: [s3deploy.Source.asset(path.join(openNextPath, "cache"))],
		prune: false,
	});

	return { distribution };
}
