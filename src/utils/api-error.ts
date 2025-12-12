class ApiError {
  constructor(code, message) {
    this.name = 'ApiError';
    this.code = code;
    this.message = message;
  }

  static maskedError(msg) {
    return new ApiError(200, msg);
  }

  static badRequest(msg) {
    return new ApiError(400, msg);
  }

  static notFound(msg) {
    return new ApiError(404, msg);
  }

  static unauthenticated(msg) {
    return new ApiError(401, msg);
  }

  static forbidden(msg) {
    return new ApiError(403, msg);
  }

  static tooManyRequests(msg) {
    return new ApiError(429, msg);
  }

  static internalServerError(msg) {
    return new ApiError(500, msg);
  }

  static notImplemented(msg) {
    return new ApiError(501, msg);
  }
}

export { ApiError };
