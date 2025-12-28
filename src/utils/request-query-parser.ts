import { ApiError } from './api-error';

const parsePageAndLimitNumber = (pageNo, limit) => {
  if (!pageNo) {
    pageNo = 0;
  }
  if (!limit) {
    limit = 20;
  }
  const page = parseInt(pageNo) <= 0 ? 1 : parseInt(pageNo);
  const rows = parseInt(limit) <= 0 ? 20 : parseInt(limit);

  return { page, rows };
};

const ALLOWED_QUERY_LENGTH = 30;
const parseQueryParams = (query) => {
  if (!query) return '';

  if (query.length > ALLOWED_QUERY_LENGTH) {
    throw ApiError.badRequest('Search parameter is longer than allowed characters');
  }
  const safeQuery = query.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return safeQuery;
};

export { parsePageAndLimitNumber, parseQueryParams };
