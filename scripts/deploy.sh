#!/usr/bin/env bash
# Builds the site and publishes it to the stack made from infra/site.yaml.
# Same steps as .github/workflows/deploy.yml, for deploying from a workstation.
# The bucket and distribution come from the stack outputs, so nothing
# account-specific lives in the repo.
#
#   STACK=billbaran-us npm run deploy      (STACK defaults to billbaran-us)
set -euo pipefail

STACK="${STACK:-billbaran-us}"
REGION=us-east-1
out() {
  aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}
BUCKET="$(out BucketName)"
DIST="$(out DistributionId)"
[[ -n "$BUCKET" && -n "$DIST" ]] || { echo "deploy: no outputs from stack $STACK in $REGION" >&2; exit 1; }

npm run build

# Hashed assets are immutable; everything else revalidates.
aws s3 sync dist/_astro "s3://$BUCKET/_astro" --cache-control "public, max-age=31536000, immutable" --delete
aws s3 sync dist "s3://$BUCKET" --exclude "_astro/*" --cache-control "public, max-age=300, must-revalidate" --delete
aws cloudfront create-invalidation --distribution-id "$DIST" --paths "/*" --query Invalidation.Id --output text
echo "deployed: $(out SiteUrl)"
