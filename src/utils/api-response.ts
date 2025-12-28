interface ApiResponseDataType {
  data:
    | {
        [key: string]: any;
      }
    | {
        [key: string]: any;
      }[]
    | null;
  message: string;
  [key: string]: any;
}

const ApiResponse = ({ message, data, ...meta }: ApiResponseDataType) => {
  if (typeof data === 'object' && !Array.isArray(data)) {
    data?.password && delete data.password;
    data?.updatedAt && delete data.updatedAt;
    data?.createdBy && delete data.createdBy;
    data?.lastModifiedBy && delete data.lastModifiedBy;
  }

  return { success: true, message, data, ...meta };
};

export { ApiResponse };
