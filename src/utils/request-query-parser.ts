import qs from 'qs';

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

const parseQueryParams = (query) => {
  return qs.parse(query, { parameterLimit: 10 });
};

export { parsePageAndLimitNumber, parseQueryParams };
