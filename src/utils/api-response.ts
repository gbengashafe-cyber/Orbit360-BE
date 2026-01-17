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
    // Ensures password prop is not sent to frontend
    if (data?.password) delete data.password;
  }

  return { success: true, message, data, ...meta };
};

export { ApiResponse };
