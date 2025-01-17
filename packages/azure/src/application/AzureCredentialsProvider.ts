/*
 * © 2021 Thoughtworks, Inc.
 */

import {
  ClientSecretCredential,
  WorkloadIdentityCredential,
} from '@azure/identity'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

import { configLoader } from '@cloud-carbon-footprint/common'
const defaultId = ''
export default class AzureCredentialsProvider {
  static async create(): Promise<
    ClientSecretCredential | WorkloadIdentityCredential
  > {
    const clientId = configLoader().AZURE?.authentication?.clientId
    const clientSecret = configLoader().AZURE?.authentication?.clientSecret
    const tenantId = configLoader().AZURE?.authentication?.tenantId

    switch (configLoader().AZURE?.authentication?.mode) {
      case 'GCP':
        const clientIdFromGoogle = await this.getGoogleSecret(
          clientId || defaultId,
        )
        const clientSecretFromGoogle = await this.getGoogleSecret(
          clientSecret || defaultId,
        )
        const tenantIdFromGoogle = await this.getGoogleSecret(
          tenantId || defaultId,
        )
        return new ClientSecretCredential(
          tenantIdFromGoogle,
          clientIdFromGoogle,
          clientSecretFromGoogle,
        )
      case 'WORKLOAD_IDENTITY':
        return new WorkloadIdentityCredential({
          tenantId: tenantId,
          clientId: clientId,
        })
      default:
        return new ClientSecretCredential(
          tenantId || defaultId,
          clientId || defaultId,
          clientSecret || defaultId,
        )
    }
  }

  static async getGoogleSecret(secretName: string): Promise<string> {
    const client = new SecretManagerServiceClient()
    const name = `projects/${
      configLoader().GCP?.BILLING_PROJECT_NAME
    }/secrets/${secretName}/versions/latest`

    const [version] = await client.accessSecretVersion({
      name: name,
    })
    return version.payload?.data?.toString() || defaultId
  }
}
