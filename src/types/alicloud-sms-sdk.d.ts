declare module '@alicloud/sms-sdk' {
  class SMSClient {
    constructor(options: {
      accessKeyId: string;
      secretAccessKey: string;
    });
    sendSMS(params: {
      PhoneNumbers: string;
      SignName: string;
      TemplateCode: string;
      TemplateParam: string;
    }): Promise<any>;
  }
  export default SMSClient;
}