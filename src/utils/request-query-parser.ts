import qs from 'qs';

const DEFAULT_ROWS_COUNT = 25;
const parsePageAndLimitNumber = (pageNo, limit) => {
  if (!pageNo) {
    pageNo = 0;
  }
  if (!limit) {
    limit = DEFAULT_ROWS_COUNT;
  }
  const page = parseInt(pageNo) <= 0 ? 1 : parseInt(pageNo);
  const rows = parseInt(limit) <= 0 ? DEFAULT_ROWS_COUNT : parseInt(limit);

  return { page, rows };
};

const parseQueryParams = (query) => {
  return qs.parse(query, { parameterLimit: 10 });
};

export { parsePageAndLimitNumber, parseQueryParams };
