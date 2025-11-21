declare module 'customerio-node' {
  export class APIClient {
    constructor(apiKey: string)
    sendEmail(request: SendEmailRequest): Promise<any>
  }

  export class SendEmailRequest {
    constructor(params: {
      transactional_message_id: string
      identifiers: {
        id: string
      }
      to: string
      from?: string
      subject?: string
      body?: string
      message_data?: Record<string, unknown>
      [key: string]: any
    })
  }
}

