import {
  SecretsManagerClient,
  GetSecretValueCommand,
  UpdateSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import type { CloudFormationCustomResourceEvent, Context } from 'aws-lambda';

const sm = new SecretsManagerClient({});

export const handler = async (event: CloudFormationCustomResourceEvent, context: Context) => {
  console.log('Custom resource event:', JSON.stringify(event, null, 2));

  const secretId = process.env.SECRET_ID!;
  const { DBHost, DBPort } = event.ResourceProperties;

  if (event.RequestType === 'Delete') {
    await sendResponse(event, context, 'SUCCESS');
    return;
  }

  try {
    // Get current secret
    const current = await sm.send(new GetSecretValueCommand({ SecretId: secretId }));
    const secret = JSON.parse(current.SecretString || '{}');

    // Update values
    secret.host = DBHost;
    secret.port = DBPort;

    // Update the secret
    await sm.send(
      new UpdateSecretCommand({
        SecretId: secretId,
        SecretString: JSON.stringify(secret),
      }),
    );

    console.log('Secret updated successfully.');
    await sendResponse(event, context, 'SUCCESS');
  } catch (err) {
    console.error('Failed to update secret:', err);
    await sendResponse(event, context, 'FAILED');
  }
};

// CloudFormation expects a signed response to this URL
async function sendResponse(
  event: CloudFormationCustomResourceEvent,
  context: Context,
  status: 'SUCCESS' | 'FAILED',
) {
  const responseBody = JSON.stringify({
    Status: status,
    Reason:
      status === 'FAILED' ? 'Check CloudWatch Logs for details.' : 'Update completed successfully.',
    PhysicalResourceId: context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
  });

  await fetch(event.ResponseURL, {
    method: 'PUT',
    body: responseBody,
    headers: {
      'Content-Type': '',
      'Content-Length': responseBody.length.toString(),
    },
  });
}
