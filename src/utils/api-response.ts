interface ApiResponseDataType {
  data: {
    [key: string]: any;
  };
  message: string;
  [key: string]: any;
}

const ApiResponse = ({ message, data, ...meta }: ApiResponseDataType) => {
  delete data.password;
  delete data.updatedAt;
  delete data.createdBy;
  delete data.lastModifiedBy;

  return { success: true, message, data, ...meta };
};

export { ApiResponse };
